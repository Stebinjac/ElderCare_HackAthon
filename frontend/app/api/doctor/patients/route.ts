import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user || (user as any).role !== 'doctor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch patient IDs from accepted appointments for this doctor
        const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('patient_id')
            .eq('doctor_id', user.userId)
            .eq('status', 'accepted');

        if (apptError) throw apptError;

        const patientIds = Array.from(new Set(appointments?.map(a => a.patient_id) || []));

        if (patientIds.length === 0) {
            return NextResponse.json({ patients: [] });
        }

        const { data: consumers, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', patientIds);

        if (userError) throw userError;

        // Fetch reports for each patient to determine status/last update
        const { data: reports, error: reportsError } = await supabase
            .from('medical_reports')
            .select('user_id, reports')
            .in('user_id', patientIds);

        const patientsWithReports = consumers.map((p: any) => {
            const userReports = reports?.find(r => r.user_id === p.id)?.reports || [];
            const latestReport = userReports.length > 0 ? userReports[0] : null;

            return {
                ...p,
                lastReport: latestReport?.likelyDate || 'No reports',
                status: latestReport?.tests.some((t: any) => t.status !== 'Normal') ? 'Follow-up' : 'Healthy'
            };
        });

        return NextResponse.json({ patients: patientsWithReports });
    } catch (error) {
        console.error('Fetch patients error:', error);
        return NextResponse.json({ error: 'Failed to fetch patient list' }, { status: 500 });
    }
}
