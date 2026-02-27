import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function getPatientId(userId: string) {
    const { data, error } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data.id;
}

export async function POST(req: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = await getPatientId(user.userId);
    if (!patientId) {
        return NextResponse.json({ error: 'Patient profile not found. Please complete your profile first.' }, { status: 404 });
    }

    const body = await req.json();

    // === SAVE VITALS TO SUPABASE vitals TABLE ===
    // Parse blood pressure if submitted as string like "120/80"
    let bp_systolic = body.bp_systolic ?? null;
    let bp_diastolic = body.bp_diastolic ?? null;
    if (body.bloodPressure && typeof body.bloodPressure === 'string') {
        const parts = body.bloodPressure.split('/').map(Number);
        if (parts.length === 2) {
            bp_systolic = parts[0];
            bp_diastolic = parts[1];
        }
    }

    const vitalsRecord = {
        patient_id: patientId,
        bp_systolic: bp_systolic || body.systolic || null,
        bp_diastolic: bp_diastolic || body.diastolic || null,
        heart_rate: body.heartRate ?? body.heart_rate ?? null,
        blood_sugar: body.bloodSugar ?? body.blood_sugar ?? null,
        weight: body.weight ?? null,
        spo2: body.spo2 ?? null,
        temperature: body.temperature ?? null,
        notes: body.notes ?? null,
    };

    const { error: vitalsError } = await supabase
        .from('vitals')
        .insert(vitalsRecord);

    if (vitalsError) {
        console.error('Failed to save vitals to Supabase:', vitalsError);
        // Don't fail the whole request — still try to run the AI analysis
    }

    // === FORWARD TO BACKEND AGENT FOR AI ANALYSIS ===
    try {
        const response = await fetch(`${BACKEND_URL}/api/agents/health-monitoring`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, patient_id: patientId }),
        });

        const data = await response.json();
        return NextResponse.json({ ...data, vitalsSaved: !vitalsError }, { status: response.status });
    } catch (error) {
        console.error('Bridge Error (Health Monitoring):', error);
        // Backend agent is down, but vitals were already saved — return a local analysis
        const isCritical = (vitalsRecord.bp_systolic ?? 0) > 180 || (vitalsRecord.heart_rate ?? 0) > 150 || (vitalsRecord.heart_rate ?? 0) < 40;
        return NextResponse.json({
            vitalsSaved: !vitalsError,
            data: {
                overallAlertLevel: isCritical ? 'CRITICAL' : 'NORMAL',
                requiresEmergency: isCritical,
                summary: vitalsError
                    ? 'Vitals received but could not be saved. Check your profile.'
                    : 'Vitals logged successfully to your health record.',
                vitals: [],
                recommendations: ['Your vitals have been recorded. Visit the Health Monitoring agent for a full AI analysis.'],
                emergencyReason: isCritical ? 'Critical vital signs detected. Seek immediate medical attention.' : null,
            }
        });
    }
}
