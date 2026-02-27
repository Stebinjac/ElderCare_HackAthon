import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    (await cookies()).delete('authToken');
    return NextResponse.json({ message: 'Logged out successfully' });
}
