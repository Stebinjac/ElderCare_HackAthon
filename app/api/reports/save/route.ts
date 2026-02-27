import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const reportData = await request.json();

        // 1. Fetch existing reports for the user
        const { data: currentEntry, error: fetchError } = await supabase
            .from('medical_reports')
            .select('reports')
            .eq('user_id', user.userId)
            .single();

        let updatedReports = [];
        const newReport = {
            id: crypto.randomUUID(),
            ...reportData,
            createdAt: new Date().toISOString()
        };

        if (currentEntry) {
            updatedReports = [newReport, ...currentEntry.reports];
        } else {
            updatedReports = [newReport];
        }

        // 2. Upsert (One row per user, append to JSONB list)
        const { error: upsertError } = await supabase
            .from('medical_reports')
            .upsert({
                user_id: user.userId,
                reports: updatedReports,
                updated_at: new Date().toISOString()
            });

        if (upsertError) throw upsertError;

        return NextResponse.json({ message: 'Report saved successfully', data: newReport });
    } catch (error) {
        console.error('Save report error:', error);
        return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }
}
