import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get the patient's guardian_id, then fetch guardian's phone
        const { data: patient, error: pError } = await supabase
            .from('patients')
            .select('guardian_id')
            .eq('user_id', authUser.userId)
            .single();

        if (pError || !patient?.guardian_id) {
            return NextResponse.json({ guardianPhone: '' });
        }

        const { data: guardian, error: gError } = await supabase
            .from('users')
            .select('phone')
            .eq('id', patient.guardian_id)
            .single();

        if (gError) throw gError;

        return NextResponse.json({ guardianPhone: guardian?.phone || '' });
    } catch (error) {
        console.error('Failed to fetch guardian phone:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { guardianPhone } = await request.json();

        // Update the patient's own phone as guardian contact (if no separate guardian user exists yet)
        const { error } = await supabase
            .from('users')
            .update({ phone: guardianPhone })
            .eq('id', authUser.userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update guardian phone:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
