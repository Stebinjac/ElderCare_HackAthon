import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Get patient via guardian_id link or user's own patient record
        const { data: patient } = await supabase
            .from('patients')
            .select('id, name')
            .or(`user_id.eq.${authUser.userId},guardian_id.eq.${authUser.userId}`)
            .limit(1)
            .single();

        if (!patient) return NextResponse.json({ alerts: [], wellnessTrend: [] });

        // Fetch all alerts for the patient
        const { data: alerts } = await supabase
            .from('alerts')
            .select('*')
            .eq('patient_id', patient.id)
            .order('triggered_at', { ascending: false })
            .limit(20);

        // Fetch wellness trend from mcp_events
        const { data: wellnessEvents } = await supabase
            .from('mcp_events')
            .select('payload, created_at')
            .eq('patient_id', patient.id)
            .eq('event_type', 'WELLNESS_CHECK')
            .order('created_at', { ascending: false })
            .limit(7);

        const wellnessTrend = (wellnessEvents || []).reverse().map(e => ({
            date: new Date(e.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            score: e.payload?.sentiment_score || 5
        }));

        return NextResponse.json({ alerts: alerts || [], wellnessTrend, patient });
    } catch (error) {
        console.error('Guardian dashboard error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
