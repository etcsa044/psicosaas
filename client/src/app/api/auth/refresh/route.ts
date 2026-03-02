import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000/api';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
};

export async function POST(request: NextRequest) {
    try {
        // CSRF Protection: Require custom header exactly as '1'
        const csrfHeader = request.headers.get('x-csrf-protection');
        if (csrfHeader !== '1') {
            return NextResponse.json(
                { status: 'error', code: 'FORBIDDEN', message: 'CSRF token missing' },
                { status: 403 }
            );
        }
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { status: 'error', code: 'UNAUTHORIZED', message: 'No refresh token' },
                { status: 401 }
            );
        }

        const backendRes = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        const responseBody = await backendRes.json();

        if (!backendRes.ok) {
            // Refresh failed → clear cookie
            const response = NextResponse.json(responseBody, { status: backendRes.status });
            response.cookies.delete('refreshToken');
            return response;
        }

        // Backend wraps in { status: 'success', data: { accessToken, refreshToken } }
        const tokens = responseBody.data;

        // Rotate cookie with new refresh token
        const response = NextResponse.json({
            accessToken: tokens.accessToken,
        });

        response.cookies.set('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

        return response;
    } catch (error) {
        console.error('[BFF] Refresh error:', error);
        return NextResponse.json(
            { status: 'error', code: 'INTERNAL_ERROR', message: 'Refresh failed' },
            { status: 500 }
        );
    }
}
