import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('guardian_phone')
            .eq('id', authUser.userId)
            .single();

        if (error) throw error;

        return NextResponse.json({ guardianPhone: user?.guardian_phone || '' });
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

        const { error } = await supabase
            .from('users')
            .update({ guardian_phone: guardianPhone })
            .eq('id', authUser.userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update guardian phone:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
