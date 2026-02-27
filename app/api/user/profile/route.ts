import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('name, email, phone, role')
            .eq('id', authUser.userId)
            .single();

        if (error) throw error;

        // Also fetch patient-specific data if applicable
        let patientData = null;
        if (user?.role === 'patient') {
            const { data: patient } = await supabase
                .from('patients')
                .select('id, age, gender, conditions, allergies, blood_group, phone as patient_phone')
                .eq('user_id', authUser.userId)
                .single();
            patientData = patient;
        }

        return NextResponse.json({
            user: {
                ...user,
                patient: patientData
            }
        });
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, phone, age, gender, conditions, allergies, blood_group } = await request.json();

        // Update core user fields
        const { error: userError } = await supabase
            .from('users')
            .update({ name, phone })
            .eq('id', authUser.userId);

        if (userError) throw userError;

        // Update patient-specific fields if they exist
        if (age !== undefined || gender !== undefined || conditions !== undefined || allergies !== undefined || blood_group !== undefined) {
            const patientUpdate: any = {};
            if (name !== undefined) patientUpdate.name = name;
            if (age !== undefined) patientUpdate.age = age;
            if (gender !== undefined) patientUpdate.gender = gender;
            if (conditions !== undefined) patientUpdate.conditions = conditions;
            if (allergies !== undefined) patientUpdate.allergies = allergies;
            if (blood_group !== undefined) patientUpdate.blood_group = blood_group;

            const { error: patientError } = await supabase
                .from('patients')
                .update(patientUpdate)
                .eq('user_id', authUser.userId);

            if (patientError) {
                console.error('Failed to update patient profile:', patientError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update user profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
