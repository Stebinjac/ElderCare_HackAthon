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

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        const reports = data?.reports || [];

        // Calculate stats
        const totalReports = reports.length;

        // Find last checkup (latest likelyDate)
        let lastCheckup = 'No reports yet';
        if (reports.length > 0) {
            const sortedReports = [...reports].sort((a, b) =>
                new Date(b.likelyDate).getTime() - new Date(a.likelyDate).getTime()
            );
            lastCheckup = sortedReports[0].likelyDate;
        }

        // Recent activity (latest 3 tests/reports)
        const recentActivity = reports.slice(0, 3).map((r: any) => ({
            date: r.likelyDate,
            action: r.tests[0]?.name || 'Lab Report',
            result: r.tests[0]?.result || 'View Details',
            trend: (r.tests[0]?.status || 'normal').toLowerCase()
        }));

        return NextResponse.json({
            stats: [
                { label: 'Total Reports', value: totalReports.toString() },
                { label: 'Last Checkup', value: lastCheckup },
                { label: 'Upcoming', value: 'None Scheduled' }, // Placeholder until appointments are implemented
            ],
            recentActivity
        });
    } catch (error) {
        console.error('Fetch stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
    }
}
