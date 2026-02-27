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

        // Fetch guardian phone
        const { data: user, error } = await supabase
            .from('users')
            .select('guardian_phone, name')
            .eq('id', authUser.userId)
            .single();

        if (error || !user) {
            console.error('Error fetching user for alert:', error);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user?.guardian_phone) {
            console.warn(`No guardian phone set for user ${user?.name || authUser.userId}. Alert skipped.`);
            return NextResponse.json({ success: false, error: 'No guardian phone set' });
        }

        // Send ACTUAL SMS using Twilio if credentials are set
        if (accountSid && authToken && twilioPhoneNumber) {
            try {
                const response = await client.messages.create({
                    body: `🚨 ELDERCARE ALERT: ${user.name}'s ${type} measurement of ${value} is critical. Message: ${message}`,
                    from: twilioPhoneNumber,
                    to: user.guardian_phone
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
            console.log(`To: ${user.guardian_phone}`);
            console.log(`Message: 🚨 ELDERCARE ALERT: ${user.name}'s ${type} measurement of ${value} is critical. Message: ${message}`);
            console.log('---------------------------');
            return NextResponse.json({ success: true, simulated: true, warning: 'Twilio credentials missing' });
        }
    } catch (error) {
        console.error('Failed to process alert:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
