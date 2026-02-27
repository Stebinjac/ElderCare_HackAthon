import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API Key is not configured' }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const base64Data = Buffer.from(bytes).toString('base64');

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            Extract medical lab results from this PDF report. 
            Identify the test names, the results (values), and determine if they are Normal, High, or Low based on the reference ranges provided in the report.
            Also, extract the date the test was performed.
            
            Return the output in this strict JSON format:
            {
              "likelyDate": "Report Date (e.g. DD/MM/YYYY)",
              "tests": [
                { "name": "Full Test Name", "result": "Value plus unit", "status": "Normal | High | Low" }
              ]
            }
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf"
                }
            },
            { text: prompt }
        ]);

        const responseText = result.response.text();
        const extractedData = JSON.parse(responseText);

        return NextResponse.json({
            data: {
                fileName: file.name,
                uploadDate: new Date().toISOString(),
                ...extractedData
            }
        });
    } catch (error) {
        console.error('Gemini extraction error:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}
