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
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
    }

    try {
        const body = await req.json();

        const response = await fetch(`${BACKEND_URL}/api/agents/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, patient_id: patientId }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Bridge Error (Chat Assistant):', error);
        return NextResponse.json({ error: 'Failed to connect to agent backend' }, { status: 500 });
    }
}
