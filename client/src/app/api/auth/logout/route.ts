import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000/api';

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

        // Revoke token in backend (best-effort)
        if (refreshToken) {
            await fetch(`${BACKEND_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => { }); // Don't fail logout if backend is down
        }

        // Always clear cookie
        const response = NextResponse.json({ success: true });
        response.cookies.delete('refreshToken');

        return response;
    } catch {
        // Still clear cookie on error
        const response = NextResponse.json({ success: true });
        response.cookies.delete('refreshToken');
        return response;
    }
}
