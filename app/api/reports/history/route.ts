import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('medical_reports')
            .select('reports')
            .eq('user_id', user.userId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
            throw error;
        }

        return NextResponse.json({ reports: data?.reports || [] });
    } catch (error) {
        console.error('Fetch history error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
