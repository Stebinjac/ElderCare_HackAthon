import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all users with 'doctor' role
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, speciality')
            .eq('role', 'doctor');

        if (error) throw error;

        // Also fetch current status for this patient
        const { data: myRelations, error: relError } = await supabase
            .from('doctor_patient_relations')
            .select('doctor_id, status')
            .eq('patient_id', user.userId);

        const doctorsWithStatus = data.map((doc: any) => ({
            ...doc,
            requestStatus: myRelations?.find((r: any) => r.doctor_id === doc.id)?.status || 'none'
        }));

        return NextResponse.json({ doctors: doctorsWithStatus });
    } catch (error) {
        console.error('Fetch doctors error:', error);
        return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { doctorId } = await request.json();

        if (!doctorId) {
            return NextResponse.json({ error: 'Missing doctorId' }, { status: 400 });
        }

        const { error } = await supabase
            .from('doctor_patient_relations')
            .upsert({
                doctor_id: doctorId,
                patient_id: user.userId,
                status: 'pending',
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        return NextResponse.json({ message: 'Request sent successfully' });
    } catch (error) {
        console.error('Send request error:', error);
        return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
    }
}
