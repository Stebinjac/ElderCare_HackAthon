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

        if (reports.length === 0) {
            return NextResponse.json({
                metrics: [
                    { label: 'Blood Pressure', value: '--/--', status: 'N/A', trend: 'no data' },
                    { label: 'Blood Sugar', value: '-- mg/dL', status: 'N/A', trend: 'no data' },
                    { label: 'Cholesterol', value: '-- mg/dL', status: 'N/A', trend: 'no data' },
                ],
                insight: "Upload your first lab report to see health insights and metrics.",
                recentBloodDetails: []
            });
        }

        // Sort by date descending
        const sortedReports = [...reports].sort((a, b) =>
            new Date(b.likelyDate).getTime() - new Date(a.likelyDate).getTime()
        );

        const latestReport = sortedReports[0];

        // Extract metrics (BP, Glucose, Cholesterol are common)
        const getMetric = (nameKeywords: string[]) => {
            const test = latestReport.tests.find((t: any) =>
                nameKeywords.some(kw => t.name.toLowerCase().includes(kw.toLowerCase()))
            );
            return test || null;
        };

        const bp = getMetric(['blood pressure', 'bp', 'systolic']);
        const sugar = getMetric(['sugar', 'glucose', 'hba1c']);
        const cholesterol = getMetric(['cholesterol', 'lipid', 'ldl', 'hdl']);

        const metrics = [
            {
                label: 'Blood Pressure',
                value: bp?.result || '--/--',
                status: bp?.status || 'N/A',
                trend: 'latest'
            },
            {
                label: 'Blood Sugar',
                value: sugar?.result || '-- mg/dL',
                status: sugar?.status || 'N/A',
                trend: 'latest'
            },
            {
                label: 'Cholesterol',
                value: cholesterol?.result || '-- mg/dL',
                status: cholesterol?.status || 'N/A',
                trend: 'latest'
            },
        ];

        // Insight (Simple heuristic)
        let insight = `Based on your latest report from ${latestReport.likelyDate}, `;
        const abnormalTests = latestReport.tests.filter((t: any) => t.status !== 'Normal');

        if (abnormalTests.length === 0) {
            insight += "all your recorded metrics are within normal ranges. Keep up the good work!";
        } else {
            insight += `we noticed some values like ${abnormalTests.map((t: any) => t.name).join(', ')} are outside normal ranges. Please consult with your doctor.`;
        }

        return NextResponse.json({
            metrics,
            insight,
            recentBloodDetails: latestReport.tests,
            latestReportDate: latestReport.likelyDate
        });
    } catch (error) {
        console.error('Fetch summary error:', error);
        return NextResponse.json({ error: 'Failed to fetch summary data' }, { status: 500 });
    }
}
