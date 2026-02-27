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
            .select('id, name, email, role')
            .eq('id', authUser.userId)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Fetch current user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
