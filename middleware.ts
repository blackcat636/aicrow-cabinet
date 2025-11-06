import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';
import { decodeToken } from '@/lib/auth-utils';
import { authApi } from '@/lib/apiAuth';

// Define protected routes that require authentication
const protectedRoutes = [
  '/workflows',
  '/executions',
  '/profile',
  '/dashboard',
  '/balance',
  '/integrations'
];
const authRoutes = ['/login', '/signup']; // Public auth routes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Allow access to API routes and static files only; process auth logic for pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const { accessToken, refreshToken, deviceId } = getTokens(request);

  // If no tokens at all
  if (!accessToken && !refreshToken) {
    // Allow public auth routes
    if (isAuthRoute) {
      // If root '/', redirect to '/login' for clarity
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }
    // Redirect unauthenticated users of protected routes to login
    return NextResponse.redirect(new URL('/login', request.url));
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
    // If user is authenticated and visits auth routes, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
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

        // Set new tokens in cookies (HttpOnly)
        nextResponse.cookies.set('access_token', response.data.accessToken, {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true
        });

        nextResponse.cookies.set('refresh_token', response.data.refreshToken, {
          path: '/',
          maxAge: 365 * 24 * 60 * 60, // 1 year
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true
        });

        return nextResponse;
      } else {
        // Refresh failed, tokens are invalid -> clear cookies and redirect to /login
        const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
        redirectResponse.cookies.set('access_token', '', {
          path: '/',
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true
        });
        redirectResponse.cookies.set('refresh_token', '', {
          path: '/',
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true
        });
        redirectResponse.cookies.set('device_id', '', {
          path: '/',
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        return redirectResponse;
      }
    } catch (error) {
      console.error(`❌ Middleware: Error refreshing token:`, error);
      // On exception, clear cookies and redirect to /login
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.cookies.set('access_token', '', {
        path: '/',
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        httpOnly: true
      });
      redirectResponse.cookies.set('refresh_token', '', {
        path: '/',
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        httpOnly: true
      });
      redirectResponse.cookies.set('device_id', '', {
        path: '/',
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return redirectResponse;
    }
  }

  // Both access and refresh tokens are invalid
  if (isAuthRoute) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
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
