import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all users with 'doctor' role
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, speciality')
            .eq('role', 'doctor');

        if (error) throw error;

        return NextResponse.json({ doctors: data });
    } catch (error) {
        console.error('Fetch doctors error:', error);
        return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }
}
