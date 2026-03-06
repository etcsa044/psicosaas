import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const responseBody = await backendRes.json();

        if (!backendRes.ok) {
            return NextResponse.json(responseBody, { status: backendRes.status });
        }

        // Backend wraps in { status: 'success', data: { user, tokens } }
        const { user, tokens } = responseBody.data;

        // Set refresh token as HttpOnly cookie, return access token in body
        const response = NextResponse.json({
            user,
            accessToken: tokens.accessToken,
        });

        response.cookies.set('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

        return response;
    } catch (error) {
        console.error('[BFF] Login error:', error);
        return NextResponse.json(
            { status: 'error', code: 'INTERNAL_ERROR', message: 'Login failed' },
            { status: 500 }
        );
    }
}
