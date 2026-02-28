import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { heartRate, spo2, systolic, diastolic } = await request.json();

        let bpStatus = 'Normal';
        if (systolic > 140 || diastolic > 90) bpStatus = 'High';
        else if (systolic < 90 || diastolic < 60) bpStatus = 'Low';

        const { data, error } = await supabase
            .from('vitals')
            .upsert({
                patient_id: authUser.userId,
                heart_rate: heartRate,
                spo2: spo2,
                bp_systolic: systolic,
                bp_diastolic: diastolic,
                bp_status: bpStatus,
                logged_at: new Date().toISOString()
            }, {
                onConflict: 'patient_id'
            })
            .select();

        if (error) {
            console.error('Failed to sync vitals to DB:', error);
            return NextResponse.json({ error: 'Failed to sync vitals', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Failed to process vitals sync:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
