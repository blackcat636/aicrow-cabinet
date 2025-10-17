import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';
import { decodeToken } from '@/lib/auth-utils';
import { authApi } from '@/lib/apiAuth';

// Define protected routes that require authentication
const protectedRoutes = ['/workflows', '/executions', '/profile', '/dashboard'];
const authRoutes = ['/']; // Main page handles login/register

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Allow access to API routes, static files, and non-protected routes
  if (
    !isProtectedRoute ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const { accessToken, refreshToken, deviceId } = getTokens(request);

  // If no tokens at all, redirect to home page (which handles login)
  if (!accessToken && !refreshToken) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check if access token is valid
  let isAccessTokenValid = false;
  if (accessToken) {
    try {
      const decoded = decodeToken(accessToken);
      if (decoded) {
        const now = Math.floor(Date.now() / 1000);
        const expirationDate = new Date(decoded.exp * 1000);
        const timeUntilExpiry = decoded.exp * 1000 - Date.now();

        isAccessTokenValid = decoded.exp > now;
      }
    } catch (error) {
      console.error(`❌ Middleware: Error decoding access token:`, error);
    }
  }

  if (isAccessTokenValid) {
    // Access token is valid, allow request
    return NextResponse.next();
  }

  // Access token is invalid, try to refresh
  if (refreshToken && deviceId) {
    try {
      const response = await authApi.refreshToken(refreshToken, deviceId);

      if (response.status === 200 && response.data) {
        // Token refreshed successfully, set new tokens and allow request
        const nextResponse = NextResponse.next();

        // Set new tokens in cookies
        nextResponse.cookies.set('access_token', response.data.accessToken, {
          path: '/',
          secure: true,
          sameSite: 'strict'
        });

        nextResponse.cookies.set('refresh_token', response.data.refreshToken, {
          path: '/',
          maxAge: 365 * 24 * 60 * 60, // 1 year
          secure: true,
          sameSite: 'strict'
        });

        return nextResponse;
      } else {
        // Refresh failed, tokens are invalid
      }
    } catch (error) {
      console.error(`❌ Middleware: Error refreshing token:`, error);
    }
  }

  // Both access and refresh tokens are invalid, redirect to home page
  if (isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
};
