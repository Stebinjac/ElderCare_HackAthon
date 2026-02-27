import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { type, value, message } = await request.json();

        // Fetch patient record to find guardian
        const { data: patient, error: pError } = await supabase
            .from('patients')
            .select('name, guardian_id')
            .eq('user_id', authUser.userId)
            .single();

        if (pError || !patient) {
            console.error('Error fetching patient for alert:', pError);
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        let guardianPhone: string | null = null;
        if (patient.guardian_id) {
            const { data: guardian } = await supabase
                .from('users')
                .select('phone')
                .eq('id', patient.guardian_id)
                .single();
            guardianPhone = guardian?.phone || null;
        }

        if (!guardianPhone) {
            // Fallback: use the user's own phone number
            const { data: selfUser } = await supabase
                .from('users')
                .select('phone')
                .eq('id', authUser.userId)
                .single();
            guardianPhone = selfUser?.phone || null;
        }

        if (!guardianPhone) {
            console.warn(`No guardian phone set for patient ${patient.name}. Alert skipped.`);
            return NextResponse.json({ success: false, error: 'No guardian phone set' });
        }

        // Send ACTUAL SMS using Twilio if credentials are set
        if (accountSid && authToken && twilioPhoneNumber) {
            try {
                const response = await client.messages.create({
                    body: `🚨 ELDERCARE ALERT: ${patient.name}'s ${type} measurement of ${value} is critical. Message: ${message}`,
                    from: twilioPhoneNumber,
                    to: guardianPhone
                });
                console.log(`Actual SMS sent via Twilio! SID: ${response.sid}`);
                return NextResponse.json({ success: true, actualSent: true });
            } catch (twilioError: any) {
                console.error('Twilio Error:', twilioError);
                return NextResponse.json({
                    success: false,
                    error: 'Twilio failed to send SMS',
                    message: twilioError?.message
                }, { status: 500 });
            }
        } else {
            // SIMULATED SMS SENDING (Fallback if creds are missing)
            console.warn('Twilio credentials missing. Falling back to simulated log.');
            console.log('--- SIMULATED SMS ALERT ---');
            console.log(`To: ${guardianPhone}`);
            console.log(`Message: 🚨 ELDERCARE ALERT: ${patient.name}'s ${type} measurement of ${value} is critical. Message: ${message}`);
            console.log('---------------------------');
            return NextResponse.json({ success: true, simulated: true, warning: 'Twilio credentials missing' });
        }
    } catch (error) {
        console.error('Failed to process alert:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
