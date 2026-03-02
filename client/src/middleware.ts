import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/pricing', '/test-auth'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const hasSession = request.cookies.has('refreshToken');
    const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p);

    // If user is authenticated and tries to access public auth paths, redirect to dashboard
    if (hasSession && isPublicPath && pathname !== '/test-auth') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow static files and API routes
    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.includes('.') ||
        isPublicPath
    ) {
        return NextResponse.next();
    }

    // Protected routes: redirect to login if no session
    if (!hasSession) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
