import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// ── GET: Fetch refills for patient or doctor ──────────────────────────────────
export async function GET(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'patient';

    try {
        let query;
        if (role === 'doctor') {
            query = supabase
                .from('medication_refills')
                .select('*, medication:medication_id(name, dosage, frequency), patient:patient_id(name, email)')
                .eq('doctor_id', user.userId)
                .in('status', ['pending_doctor'])
                .order('created_at', { ascending: false });
        } else {
            query = supabase
                .from('medication_refills')
                .select('*, medication:medication_id(name, dosage, frequency), doctor:doctor_id(name)')
                .eq('patient_id', user.userId)
                .order('created_at', { ascending: false })
                .limit(20);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ refills: data || [], total: data?.length || 0 });
    } catch (error) {
        console.error('Fetch refills error:', error);
        return NextResponse.json({ error: 'Failed to fetch refills' }, { status: 500 });
    }
}

// ── POST: Check meds, create refills, doctor decision, patient consent ────────
export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { action, refill_id } = body;

        // ── CHECK MEDICATIONS ──────────────────────────────────────────────
        if (action === 'check') {
            const today = new Date().toISOString().split('T')[0];

            // Get all active medications
            const { data: meds } = await supabase
                .from('medications')
                .select('id, name, dosage, frequency, remaining_days, prescribed_days, prescribed_by, started_at')
                .eq('patient_id', user.userId)
                .eq('status', 'active');

            if (!meds || meds.length === 0) {
                return NextResponse.json({ needs_refill: false, message: 'No active medications.' });
            }

            // Compute real remaining days
            const lowMeds = [];
            for (const med of meds) {
                let remaining = med.remaining_days ?? 999;
                if (med.started_at && med.prescribed_days) {
                    const start = new Date(med.started_at);
                    const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
                    remaining = Math.max(0, med.prescribed_days - elapsed);
                    // Sync back to DB
                    await supabase.from('medications').update({ remaining_days: remaining }).eq('id', med.id);
                }
                if (remaining <= 3) lowMeds.push({ ...med, remaining_days: remaining });
            }

            if (lowMeds.length === 0) {
                return NextResponse.json({ needs_refill: false, message: 'All medications have sufficient supply.' });
            }

            // Create refill requests for low medications
            const results = [];
            for (const med of lowMeds) {
                const doctorId = med.prescribed_by;
                if (!doctorId) continue;

                // Check for existing pending OR recently completed refill
                const { data: existingPending } = await supabase
                    .from('medication_refills')
                    .select('id')
                    .eq('medication_id', med.id)
                    .in('status', ['pending_doctor', 'pending_patient']);

                if (existingPending && existingPending.length > 0) continue;

                // Block if completed within last 24 hours
                const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const { data: recentDone } = await supabase
                    .from('medication_refills')
                    .select('id')
                    .eq('medication_id', med.id)
                    .eq('status', 'completed')
                    .gte('updated_at', recentCutoff);

                if (recentDone && recentDone.length > 0) continue;

                // Get patient vitals for health summary
                const { data: vitals } = await supabase
                    .from('vitals')
                    .select('*')
                    .eq('patient_id', user.userId)
                    .order('logged_at', { ascending: false })
                    .limit(1);

                const latestVitals = vitals?.[0] || null;
                let riskLevel = 'low';
                if (latestVitals) {
                    const hr = latestVitals.heart_rate || 72;
                    const spo2 = latestVitals.spo2 || 98;
                    const sys = latestVitals.bp_systolic || 120;
                    if (hr > 100 || hr < 50 || spo2 < 92 || sys > 160 || sys < 90) riskLevel = 'high';
                    else if (hr > 90 || spo2 < 95 || sys > 140) riskLevel = 'moderate';
                }

                const { data: inserted, error: insertErr } = await supabase
                    .from('medication_refills')
                    .insert({
                        medication_id: med.id,
                        patient_id: user.userId,
                        doctor_id: doctorId,
                        status: 'pending_doctor',
                        approved_days: med.prescribed_days || 30,
                        health_summary: { vitals: latestVitals, risk_level: riskLevel },
                    })
                    .select();

                if (!insertErr && inserted) {
                    results.push({ medication: med.name, remaining_days: med.remaining_days, refill_requested: true });
                }
            }

            return NextResponse.json({ needs_refill: results.length > 0, results });
        }

        // ── DOCTOR DECISION ────────────────────────────────────────────────
        if (action === 'doctor-decision') {
            const { decision, approved_days, notes } = body;

            const updateData: any = {
                status: decision === 'deny' ? 'doctor_denied' : 'pending_patient',
                doctor_decision: decision,
                doctor_notes: notes || null,
                updated_at: new Date().toISOString(),
            };
            if (decision !== 'deny' && approved_days != null) {
                updateData.approved_days = approved_days;
            }

            const { error } = await supabase
                .from('medication_refills')
                .update(updateData)
                .eq('id', refill_id);

            if (error) throw error;
            return NextResponse.json({ success: true, status: updateData.status });
        }

        // ── PATIENT CONSENT ────────────────────────────────────────────────
        if (action === 'patient-consent') {
            const { consent } = body;

            if (!consent) {
                await supabase.from('medication_refills').update({
                    status: 'patient_declined',
                    patient_consent: false,
                    updated_at: new Date().toISOString(),
                }).eq('id', refill_id);
                return NextResponse.json({ success: true, status: 'patient_declined' });
            }

            // Get the refill to execute
            const { data: refill } = await supabase
                .from('medication_refills')
                .select('*')
                .eq('id', refill_id)
                .single();

            if (!refill) return NextResponse.json({ error: 'Refill not found' }, { status: 404 });

            const approvedDays = refill.approved_days || 30;
            const todayStr = new Date().toISOString().split('T')[0];

            // Reset medication: remaining_days, prescribed_days, started_at
            await supabase.from('medications').update({
                remaining_days: approvedDays,
                prescribed_days: approvedDays,
                started_at: todayStr,
            }).eq('id', refill.medication_id);

            // Mark refill as completed
            await supabase.from('medication_refills').update({
                status: 'completed',
                patient_consent: true,
                updated_at: new Date().toISOString(),
            }).eq('id', refill_id);

            return NextResponse.json({ success: true, status: 'completed', approved_days: approvedDays });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('Refill API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
