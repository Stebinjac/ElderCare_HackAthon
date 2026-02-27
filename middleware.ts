import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod');

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('authToken')?.value;
    const { pathname } = request.nextUrl;

    // Protect /dashboard and /doctor routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/doctor')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            const role = payload.role as string;

            // Enforce RBAC
            if (pathname.startsWith('/doctor') && role !== 'doctor') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            if (pathname.startsWith('/dashboard') && role === 'doctor') {
                return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
            }

            return NextResponse.next();
        } catch (error) {
            console.error('JWT verification failed:', error);
            // On invalid token, clear it and redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('authToken');
            return response;
        }
    }

    // Redirect to proper dashboard if logged in and trying to access login/signup
    if (pathname === '/login' || pathname === '/signup') {
        if (token) {
            try {
                const { payload } = await jwtVerify(token, JWT_SECRET);
                const role = payload.role as string;
                if (role === 'doctor') {
                    return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
                }
                return NextResponse.redirect(new URL('/dashboard', request.url));
            } catch (error) {
                // Token invalid, allow access to login/signup
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/doctor/:path*', '/login', '/signup'],
};
