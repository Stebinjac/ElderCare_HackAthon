import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user || (user as any).role !== 'doctor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('doctor_patient_relations')
            .select('id, created_at, patient:users!patient_id(id, name, email)')
            .eq('doctor_id', user.userId)
            .eq('status', 'pending');

        if (error) throw error;

        return NextResponse.json({ requests: data || [] });
    } catch (error) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || (user as any).role !== 'doctor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { requestId, status } = await request.json(); // status: 'accepted' or 'rejected'

        if (!requestId || !status) {
            return NextResponse.json({ error: 'Missing requestId or status' }, { status: 400 });
        }

        const { error } = await supabase
            .from('doctor_patient_relations')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', requestId)
            .eq('doctor_id', user.userId);

        if (error) throw error;

        return NextResponse.json({ message: `Request ${status} successfully` });
    } catch (error) {
        console.error('Update request error:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
