import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Get patient record
        const { data: patient, error: pError } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.userId)
            .single();

        if (pError || !patient) {
            return NextResponse.json({ error: 'Patient profile not found. Sign up as a patient first.' }, { status: 404 });
        }

        const body = await req.json();

        // Parse blood pressure string "120/80" or accept separate fields
        let bp_systolic = body.bp_systolic ?? null;
        let bp_diastolic = body.bp_diastolic ?? null;
        if (body.bloodPressure && typeof body.bloodPressure === 'string') {
            const parts = body.bloodPressure.split('/').map(Number);
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                bp_systolic = parts[0];
                bp_diastolic = parts[1];
            }
        }

        const { data, error } = await supabase
            .from('vitals')
            .insert({
                patient_id: patient.id,
                bp_systolic,
                bp_diastolic,
                heart_rate: body.heartRate ?? body.heart_rate ?? null,
                blood_sugar: body.bloodSugar ?? body.blood_sugar ?? null,
                weight: body.weight ?? null,
                spo2: body.spo2 ?? null,
                temperature: body.temperature ?? null,
                notes: body.notes ?? null,
            })
            .select('id, logged_at')
            .single();

        if (error) throw error;

        // Check for emergency thresholds
        const isEmergency = (bp_systolic !== null && bp_systolic > 180) ||
            (body.heartRate !== null && (body.heartRate > 150 || body.heartRate < 40));

        if (isEmergency) {
            // Log to alerts table
            await supabase.from('alerts').insert({
                patient_id: patient.id,
                type: 'EMERGENCY_VITALS',
                severity: 'CRITICAL',
                payload: { bp_systolic, bp_diastolic, heart_rate: body.heartRate, message: 'Critical vital signs detected' },
                resolved: false,
            });
        }

        return NextResponse.json({
            success: true,
            vitalId: data.id,
            loggedAt: data.logged_at,
            isEmergency,
            message: isEmergency
                ? '🚨 Critical vitals detected! Alert created. Seek emergency care immediately.'
                : '✅ Vitals logged successfully to your health record.',
        });
    } catch (error: any) {
        console.error('Vitals log error:', error);
        return NextResponse.json({ error: error.message || 'Failed to log vitals' }, { status: 500 });
    }
}

export async function GET() {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: patient } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.userId)
            .single();

        if (!patient) return NextResponse.json({ vitals: [] });

        const { data: vitals } = await supabase
            .from('vitals')
            .select('*')
            .eq('patient_id', patient.id)
            .order('logged_at', { ascending: false })
            .limit(30);

        return NextResponse.json({ vitals: vitals || [] });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch vitals' }, { status: 500 });
    }
}
