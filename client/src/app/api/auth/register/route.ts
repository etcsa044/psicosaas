import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const backendRes = await fetch(`${BACKEND_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const responseBody = await backendRes.json();

        if (!backendRes.ok) {
            return NextResponse.json(responseBody, { status: backendRes.status });
        }

        // Backend wraps in { status: 'success', data: { user, tokens, tenantId } }
        const { user, tokens, tenantId } = responseBody.data;

        const response = NextResponse.json({
            user,
            accessToken: tokens.accessToken,
            tenantId,
        });

        response.cookies.set('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error('[BFF] Register error:', error);
        return NextResponse.json(
            { status: 'error', code: 'INTERNAL_ERROR', message: 'Registration failed' },
            { status: 500 }
        );
    }
}
