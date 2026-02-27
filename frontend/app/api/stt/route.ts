import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Voice transcription is not configured. Please add SARVAM_API_KEY.' },
            { status: 500 }
        );
    }

    try {
        // Get the incoming form data (audio blob from the browser)
        const formData = await request.formData();
        const audioBlob = formData.get('audio') as Blob | null;

        if (!audioBlob) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        // Forward to Sarvam AI Speech-to-Text API
        const sarvamForm = new FormData();
        sarvamForm.append('file', audioBlob, 'recording.webm');
        sarvamForm.append('model', 'saaras:v3');
        sarvamForm.append('mode', 'transcribe');

        const sarvamRes = await fetch('https://api.sarvam.ai/speech-to-text', {
            method: 'POST',
            headers: {
                'api-subscription-key': apiKey,
            },
            body: sarvamForm,
        });

        if (!sarvamRes.ok) {
            const errText = await sarvamRes.text();
            console.error('[STT] Sarvam API error:', errText);
            return NextResponse.json(
                { error: `Sarvam API error: ${sarvamRes.status}` },
                { status: 502 }
            );
        }

        const data = await sarvamRes.json();
        // Sarvam returns { transcript: string, ... }
        const transcript = data.transcript || data.text || '';

        return NextResponse.json({ transcript });
    } catch (error: any) {
        console.error('[STT] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to transcribe audio' },
            { status: 500 }
        );
    }
}
