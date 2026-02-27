import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
        return NextResponse.json({ error: 'Missing doctorId or date' }, { status: 400 });
    }

    try {
        // 1. Fetch existing appointments for this doctor on this day
        const { data: existingAppointments, error } = await supabase
            .from('appointments')
            .select('time')
            .eq('doctor_id', doctorId)
            .eq('date', date)
            .in('status', ['pending', 'accepted']);

        if (error) throw error;

        const bookedSlots = existingAppointments?.map(a => a.time) || [];

        // 2. Generate all slots (9 AM to 5 PM, every 30 mins)
        const allSlots: string[] = [];
        for (let hour = 9; hour < 17; hour++) {
            ['00', '30'].forEach(minute => {
                const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                allSlots.push(time);
            });
        }

        // 3. Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        return NextResponse.json({ slots: availableSlots });
    } catch (error) {
        console.error('Fetch slots error:', error);
        return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 });
    }
}
