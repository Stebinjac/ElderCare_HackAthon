import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user || (user as any).role !== 'doctor') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { patientId, medication, dosage, prescribedDays, instructions } = await request.json();

        if (!patientId || !medication || !dosage) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const days = prescribedDays || 30;

        // Insert into prescriptions table
        const { error: prescError } = await supabase
            .from('prescriptions')
            .insert([{
                doctor_id: user.userId,
                patient_id: patientId,
                medication,
                dosage,
                instructions,
                prescribed_days: days,
                created_at: new Date().toISOString()
            }]);

        if (prescError) throw prescError;

        // Also insert/update into medications table for refill tracking
        // Check if medication already exists for this patient
        const { data: existingMed } = await supabase
            .from('medications')
            .select('id')
            .eq('patient_id', patientId)
            .ilike('name', medication)
            .eq('status', 'active')
            .limit(1);

        if (existingMed && existingMed.length > 0) {
            // Update existing medication with new days
            await supabase
                .from('medications')
                .update({
                    dosage,
                    frequency: instructions || dosage,
                    prescribed_days: days,
                    remaining_days: days,
                    prescribed_by: user.userId,
                    started_at: new Date().toISOString().split('T')[0],
                })
                .eq('id', existingMed[0].id);
        } else {
            // Create new medication entry
            await supabase
                .from('medications')
                .insert([{
                    patient_id: patientId,
                    name: medication,
                    dosage,
                    frequency: instructions || dosage,
                    prescribed_days: days,
                    remaining_days: days,
                    status: 'active',
                    prescribed_by: user.userId,
                    started_at: new Date().toISOString().split('T')[0],
                }]);
        }

        return NextResponse.json({ message: 'Prescription added successfully' });
    } catch (error) {
        console.error('Add prescription error:', error);
        return NextResponse.json({ error: 'Failed to add prescription' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    try {
        let query = supabase
            .from('prescriptions')
            .select(`
                *,
                doctor:doctor_id (
                    name
                )
            `);

        if ((user as any).role === 'doctor') {
            if (patientId) {
                query = query.eq('patient_id', patientId).eq('doctor_id', user.userId);
            } else {
                query = query.eq('doctor_id', user.userId);
            }
        } else {
            query = query.eq('patient_id', user.userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Flatten the doctor name into the object for easier consumption
        const prescriptionsWithDoctorNames = data?.map(p => ({
            ...p,
            doctor_name: (p.doctor as any)?.name || 'Unknown Doctor'
        })) || [];

        return NextResponse.json({ prescriptions: prescriptionsWithDoctorNames });
    } catch (error) {
        console.error('Fetch prescriptions error:', error);
        return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
    }
}
