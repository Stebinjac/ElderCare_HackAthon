import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await request.formData();
        const file = formData.get('prescription') as File;
        const confirmSave = formData.get('confirm') === 'true';
        const extractedDataStr = formData.get('extractedData') as string;

        // If user confirmed, save the previously extracted data
        if (confirmSave && extractedDataStr) {
            const medications = JSON.parse(extractedDataStr);

            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', authUser.userId)
                .single();

            if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

            for (const med of medications) {
                await supabase.from('medications').insert({
                    patient_id: patient.id,
                    name: med.name,
                    dosage: med.dosage,
                    frequency: med.frequency,
                    timing: med.timing || [],
                    stock_count: med.stock_count || 30,
                    daily_dose: med.daily_dose || 1,
                    refill_alert: true
                });
            }
            return NextResponse.json({ success: true, saved: medications.length });
        }

        // Otherwise run Gemini Vision analysis
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const mimeType = file.type || 'image/jpeg';

        const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a medical AI. Analyze this prescription image and extract all medicines.
Return ONLY a valid JSON array. Do not include markdown or any explanation.
Format: [{"name": "Medicine Name", "dosage": "dosage string", "frequency": "how often", "timing": ["HH:MM"], "stock_count": 30, "daily_dose": 1}]
If no prescription found, return [].`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { mimeType, data: base64 } }
        ]);

        const rawText = result.response.text().trim();
        let medications = [];
        try {
            // Strip markdown code blocks if present
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            medications = JSON.parse(cleaned);
        } catch {
            medications = [];
        }

        return NextResponse.json({ medications, rawText: rawText.slice(0, 500) });
    } catch (error: any) {
        console.error('Prescription analyze error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
