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
            .select('name, email, guardian_phone, dob, hospital_name')
            .eq('id', authUser.userId)
            .single();

        if (error) throw error;

        // Map database guardian_phone to phone for the frontend
        return NextResponse.json({
            user: {
                ...user,
                phone: user.guardian_phone
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
        const { name, phone, dob, hospital_name } = await request.json();

        // Map phone from frontend to guardian_phone in DB
        const { error } = await supabase
            .from('users')
            .update({
                name,
                guardian_phone: phone,
                dob,
                hospital_name
            })
            .eq('id', authUser.userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update user profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
