import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { patientId } = await request.json();

        // For doctor, use provided patientId; for patient, use their own
        const targetPatientId = patientId || null;

        let patient: any = null;
        if (targetPatientId) {
            const { data } = await supabase.from('patients').select('*').eq('id', targetPatientId).single();
            patient = data;
        } else {
            const { data } = await supabase.from('patients').select('*').eq('user_id', authUser.userId).single();
            patient = data;
        }

        if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

        // Fetch vitals (7-day trend)
        const { data: vitals } = await supabase
            .from('vitals')
            .select('bp_systolic, bp_diastolic, heart_rate, blood_sugar, weight, spo2, logged_at')
            .eq('patient_id', patient.id)
            .order('logged_at', { ascending: false })
            .limit(7);

        // Fetch medications
        const { data: medications } = await supabase
            .from('medications')
            .select('name, dosage, frequency, stock_count, daily_dose')
            .eq('patient_id', patient.id);

        // Fetch recent alerts
        const { data: alerts } = await supabase
            .from('alerts')
            .select('type, severity, payload, triggered_at')
            .eq('patient_id', patient.id)
            .order('triggered_at', { ascending: false })
            .limit(5);

        // Generate summary with Gemini
        const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a clinical AI assistant generating a doctor summary report.

Patient: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}
Conditions: ${(patient.conditions || []).join(', ')}
Allergies: ${(patient.allergies || []).join(', ')}
Blood Group: ${patient.blood_group}

7-Day Vitals Trend:
${(vitals || []).map(v => `- ${new Date(v.logged_at).toLocaleDateString()}: BP ${v.bp_systolic}/${v.bp_diastolic} mmHg, HR ${v.heart_rate} bpm, Sugar ${v.blood_sugar} mg/dL`).join('\n')}

Current Medications:
${(medications || []).map(m => `- ${m.name} ${m.dosage} — ${m.frequency} (Stock: ${m.stock_count})`).join('\n')}

Recent Alerts:
${(alerts || []).map(a => `- ${a.type} (${a.severity}) at ${new Date(a.triggered_at).toLocaleString()}`).join('\n')}

Generate a concise clinical summary with:
1. Vitals Summary & Trend Analysis
2. Medication Status & Compliance Concerns
3. Flagged Concerns
4. Recommendations for the doctor visit

Keep it professional, clinical, and under 400 words.`;

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        return NextResponse.json({
            patient,
            vitals: vitals || [],
            medications: medications || [],
            alerts: alerts || [],
            summary
        });
    } catch (error: any) {
        console.error('Doctor summary error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
