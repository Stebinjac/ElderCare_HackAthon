import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { data: events, error } = await supabase
            .from('mcp_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return NextResponse.json({ events: events || [] });
    } catch (error) {
        console.error('Admin events error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
