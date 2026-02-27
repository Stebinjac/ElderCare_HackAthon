import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod');

export async function getAuthUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;

        if (!token) return null;

        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { userId: string; email: string };
    } catch (error) {
        return null;
    }
}
