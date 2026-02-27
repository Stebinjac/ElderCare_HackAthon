import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get Patient ID
        const { data: patient, error: pError } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.userId)
            .single();

        if (pError || !patient) {
            return NextResponse.json({
                stats: [
                    { label: 'Total Reports', value: '0' },
                    { label: 'Last Checkup', value: 'N/A' },
                    { label: 'Upcoming', value: 'None' },
                ],
                recentActivity: []
            });
        }

        const patientId = patient.id;

        // 2. Fetch Vitals Count (as a proxy for activity)
        const { count: vitalsCount } = await supabase
            .from('vitals')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId);

        // 3. Fetch Medications Count
        const { count: medsCount } = await supabase
            .from('medications')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId);

        // 4. Fetch Last Checkup (Latest Vital)
        const { data: lastVital } = await supabase
            .from('vitals')
            .select('logged_at')
            .eq('patient_id', patientId)
            .order('logged_at', { ascending: false })
            .limit(1)
            .single();

        // 5. Fetch Upcoming Appointment (appointments.patient_id references users.id)
        const { data: upcomingApp } = await supabase
            .from('appointments')
            .select('date, type')
            .eq('patient_id', user.userId)
            .eq('status', 'pending')
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(1)
            .single();

        // 6. Recent Activity (Recent Vitals)
        const { data: recentVitals } = await supabase
            .from('vitals')
            .select('logged_at, bp_systolic, bp_diastolic')
            .eq('patient_id', patientId)
            .order('logged_at', { ascending: false })
            .limit(3);

        const recentActivity = recentVitals?.map(v => ({
            date: new Date(v.logged_at).toLocaleDateString(),
            action: 'Blood Pressure Log',
            result: `${v.bp_systolic}/${v.bp_diastolic}`,
            trend: v.bp_systolic > 140 ? 'high' : 'normal'
        })) || [];

        return NextResponse.json({
            stats: [
                { label: 'Total Reports', value: medsCount?.toString() || '0', sublabel: 'Medications' },
                { label: 'Last Checkup', value: lastVital ? new Date(lastVital.logged_at).toLocaleDateString() : 'Never' },
                { label: 'Upcoming', value: upcomingApp ? `${upcomingApp.date}` : 'None', sublabel: upcomingApp?.type || 'No appointments' },
            ],
            recentActivity,
            vitalsCount: vitalsCount || 0
        });
    } catch (error) {
        console.error('Fetch stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
    }
}
