import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Determine role
        const role = email.toLowerCase().endsWith('@doctor.com') ? 'doctor' : 'patient';

        // Create user and return the new ID
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                { name, email, password_hash: passwordHash, role }
            ])
            .select('id')
            .single();

        if (insertError || !newUser) {
            throw insertError || new Error('Failed to create user');
        }

        // If patient role, also create a patients record
        if (role === 'patient') {
            const { error: patientError } = await supabase
                .from('patients')
                .insert([
                    { user_id: newUser.id, name }
                ]);

            if (patientError) {
                console.error('Failed to create patient record:', patientError);
                // Don't fail the signup, but log the error
            }
        }

        return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
