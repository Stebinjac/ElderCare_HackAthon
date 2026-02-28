import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

const BACKEND_URL = 'http://localhost:8000';

export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action, ...payload } = body;

        let endpoint = '';
        if (action === 'interview-turn') {
            endpoint = '/api/previsit/interview-turn';
            payload.patient_id = user.userId;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || 'Backend error');
        }
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('PreVisit API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process pre-visit request' },
            { status: 500 }
        );
    }
}
