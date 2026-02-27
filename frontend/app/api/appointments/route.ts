import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        let query = supabase
            .from('appointments')
            .select(`
                *,
                patient:patient_id (name, email),
                doctor:doctor_id (name, email)
            `);

        if (patientId && (user as any).role === 'doctor') {
            // Doctor fetching a specific patient's appointments (for detail page)
            query = query.eq('patient_id', patientId).eq('doctor_id', user.userId);
        } else if ((user as any).role === 'doctor') {
            query = query.eq('doctor_id', user.userId);
        } else {
            query = query.eq('patient_id', user.userId);
        }

        const { data, error } = await query.order('date', { ascending: false }).order('time', { ascending: true });

        if (error) throw error;

        const appointments = data?.map(a => ({
            ...a,
            patientName: (a.patient as any)?.name,
            doctorName: (a.doctor as any)?.name,
        })) || [];

        return NextResponse.json({ appointments });
    } catch (error) {
        console.error('Fetch appointments error:', error);
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { doctorId, date, time, type, reason } = await request.json();

        if (!doctorId || !date || !time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('appointments')
            .insert([{
                patient_id: user.userId,
                doctor_id: doctorId,
                date,
                time,
                type: type || 'General Checkup',
                reason,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ message: 'Appointment booked successfully', appointment: data });
    } catch (error) {
        console.error('Book appointment error:', error);
        return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || (user as any).role !== 'doctor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { appointmentId, status } = await request.json();

        if (!appointmentId || !status) {
            return NextResponse.json({ error: 'Missing appointmentId or status' }, { status: 400 });
        }

        const { error } = await supabase
            .from('appointments')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId)
            .eq('doctor_id', user.userId);

        if (error) throw error;

        return NextResponse.json({ message: `Appointment ${status}` });
    } catch (error) {
        console.error('Update appointment error:', error);
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }
}
