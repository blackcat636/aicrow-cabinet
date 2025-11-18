import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { getTokens } from '@/lib/auth';
import { decodeToken } from '@/lib/auth-utils';
import { authApi } from '@/lib/apiAuth';
import { routing } from './i18n/routing';

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

// Create next-intl middleware with locale detection disabled
// This ensures we always use default locale unless explicitly set via cookie or URL
const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false
});

// Helper function to extract locale from pathname
function getLocaleFromPathname(pathname: string): string | null {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return null;
}

// Helper function to normalize pathname by removing locale
function normalizePathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    const normalized = pathname.replace(`/${locale}`, '') || '/';
    return normalized;
  }
  return pathname;
}

// Helper function to create localized URL
function createLocalizedUrl(
  path: string,
  locale: string,
  request: NextRequest
): URL {
  // For default locale with 'as-needed' strategy, don't add prefix
  if (
    locale === routing.defaultLocale &&
    routing.localePrefix === 'as-needed'
  ) {
    return new URL(path, request.url);
  }
  return new URL(`/${locale}${path}`, request.url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log incoming request
  console.log('[Middleware] Incoming request:', {
    pathname,
    method: request.method,
    url: request.url,
    cookies: {
      NEXT_LOCALE: request.cookies.get('NEXT_LOCALE')?.value,
      locale: request.cookies.get('locale')?.value,
      'next-intl-locale': request.cookies.get('next-intl-locale')?.value
    },
    acceptLanguage: request.headers.get('Accept-Language')
  });

  // Allow access to API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // For root path, always redirect to default locale login (without prefix for default locale)
  if (pathname === '/') {
    const { accessToken, refreshToken } = getTokens(request);

    // Get locale from cookie (set by next-intl) or use default
    // next-intl stores locale in cookie, try different possible names
    const localeCookie =
      request.cookies.get('NEXT_LOCALE')?.value ||
      request.cookies.get('locale')?.value ||
      request.cookies.get('next-intl-locale')?.value;
    const currentLocale =
      localeCookie && routing.locales.includes(localeCookie as any)
        ? localeCookie
        : routing.defaultLocale;

    // Create redirect response
    let redirectResponse: NextResponse;

    if (!accessToken && !refreshToken) {
      // Redirect to login with current locale
      redirectResponse = NextResponse.redirect(
        createLocalizedUrl('/login', currentLocale, request)
      );
    } else if (accessToken) {
      // If authenticated, redirect to dashboard with current locale
      try {
        const decoded = decodeToken(accessToken);
        if (decoded && decoded.exp > Math.floor(Date.now() / 1000)) {
          redirectResponse = NextResponse.redirect(
            createLocalizedUrl('/dashboard', currentLocale, request)
          );
        } else {
          redirectResponse = NextResponse.redirect(
            createLocalizedUrl('/login', currentLocale, request)
          );
        }
      } catch (error) {
        // Token invalid, redirect to login
        redirectResponse = NextResponse.redirect(
          createLocalizedUrl('/login', currentLocale, request)
        );
      }
    } else {
      // Default: redirect to login
      redirectResponse = NextResponse.redirect(
        createLocalizedUrl('/login', currentLocale, request)
      );
    }

    // Set locale cookie if not set, to ensure default locale is used
    if (!localeCookie) {
      redirectResponse.cookies.set('NEXT_LOCALE', routing.defaultLocale, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }

    return redirectResponse;
  }

  // Check if path has no locale prefix - if so, get locale from cookie or use default
  const pathHasLocale = getLocaleFromPathname(pathname);
  let intlResponse: NextResponse | null = null;
  let currentLocale: string;
  let normalizedPathname: string;

  // Get locale from cookie if path has no locale prefix
  const localeCookie =
    request.cookies.get('NEXT_LOCALE')?.value ||
    request.cookies.get('locale')?.value ||
    request.cookies.get('next-intl-locale')?.value;
  const preferredLocale =
    localeCookie && routing.locales.includes(localeCookie as any)
      ? localeCookie
      : routing.defaultLocale;

  // If path has no locale and it's not an API route, redirect to localized version
  if (!pathHasLocale && !pathname.startsWith('/api')) {
    // If preferred locale is not default, redirect to localized path
    if (preferredLocale !== routing.defaultLocale) {
      return NextResponse.redirect(
        createLocalizedUrl(pathname, preferredLocale, request)
      );
    }

    // For default locale, continue with rewrite logic below
    // Create a modified request with Accept-Language header set to default locale
    // This prevents next-intl from detecting browser language
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('Accept-Language', routing.defaultLocale);

    // Create modified request
    const modifiedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body
    });

    // Use modified request for intl middleware
    intlResponse = intlMiddleware(modifiedRequest);

    // If it redirects, check if it's redirecting to non-default locale
    if (intlResponse && intlResponse.status === 307) {
      const location = intlResponse.headers.get('location');
      let redirectedPath: string | null = null;
      let redirectedLocale: string | null = null;

      if (location) {
        redirectedPath = new URL(location, request.url).pathname;
        redirectedLocale = getLocaleFromPathname(redirectedPath);

        // If redirected to non-default locale, redirect to same path without locale (default locale)
        if (redirectedLocale && redirectedLocale !== routing.defaultLocale) {
          const normalizedPath = normalizePathname(redirectedPath);
          return NextResponse.redirect(new URL(normalizedPath, request.url));
        }
      }

      // If redirect is to default locale, let it proceed
      // But we need to ensure the path is accessible
      // For 'as-needed' strategy, default locale paths should work without prefix
      // So we let the redirect happen if it's to default locale
      if (redirectedLocale === routing.defaultLocale && redirectedPath) {
        // The redirect should go to the path without locale prefix
        // But next-intl might redirect to /en/profile, we need to handle this
        const finalPath = normalizePathname(redirectedPath);
        // If the final path matches the original, use the redirect
        // Otherwise, redirect to path without locale
        if (finalPath === pathname) {
          return intlResponse;
        } else {
          // Redirect to path without locale prefix (default locale)
          return NextResponse.redirect(new URL(pathname, request.url));
        }
      }
      return intlResponse;
    }

    // If no redirect from intl middleware, it means the path should work as-is
    // But Next.js needs the [locale] segment, so we need to rewrite the URL
    // For default locale with 'as-needed', we rewrite to include locale internally
    // but keep the URL without prefix

    // Use default locale for paths without locale prefix
    currentLocale = routing.defaultLocale;
    normalizedPathname = pathname;

    // Rewrite the request to include locale segment for Next.js routing
    // This allows Next.js to find the page in app/[locale]/profile/page.tsx
    const rewriteUrl = new URL(
      `/${routing.defaultLocale}${pathname}`,
      request.url
    );
    const rewriteResponse = NextResponse.rewrite(rewriteUrl);

    // Set locale header for next-intl
    rewriteResponse.headers.set('x-next-intl-locale', routing.defaultLocale);

    // Continue with auth logic using the rewrite response
    intlResponse = rewriteResponse;
  } else {
    // Path has locale or is API route
    // Get locale from cookie or use default, and override Accept-Language to prevent auto-detection
    const localeCookie =
      request.cookies.get('NEXT_LOCALE')?.value ||
      request.cookies.get('locale')?.value ||
      request.cookies.get('next-intl-locale')?.value;
    const preferredLocale =
      localeCookie && routing.locales.includes(localeCookie as any)
        ? localeCookie
        : routing.defaultLocale;

    // Log locale detection
    console.log('[Middleware] Locale detection:', {
      pathname,
      localeFromPath: getLocaleFromPathname(pathname),
      cookies: {
        NEXT_LOCALE: request.cookies.get('NEXT_LOCALE')?.value,
        locale: request.cookies.get('locale')?.value,
        'next-intl-locale': request.cookies.get('next-intl-locale')?.value
      },
      localeCookie,
      preferredLocale,
      acceptLanguage: request.headers.get('Accept-Language')
    });

    // Override Accept-Language header to prevent next-intl from auto-detecting locale
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('Accept-Language', preferredLocale);

    // Create modified request
    const modifiedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body
    });

    // Use modified request for intl middleware
    intlResponse = intlMiddleware(modifiedRequest);

    // Log intl middleware response
    if (intlResponse) {
      console.log('[Middleware] Intl middleware response:', {
        status: intlResponse.status,
        statusText: intlResponse.statusText,
        redirectUrl: intlResponse.headers.get('Location'),
        headers: Object.fromEntries(intlResponse.headers.entries())
      });
    }

    // If intl middleware returns a redirect, return it
    if (intlResponse && intlResponse.status === 307) {
      console.log('[Middleware] Returning redirect from intl middleware');
      return intlResponse;
    }

    // Get the current locale (after intl processing)
    currentLocale = getLocaleFromPathname(pathname) || preferredLocale;
    normalizedPathname = normalizePathname(pathname);
    
    console.log('[Middleware] Final locale decision:', {
      currentLocale,
      normalizedPathname,
      pathnameFromUrl: pathname
    });
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    normalizedPathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => normalizedPathname === route);

  // Get tokens from cookies
  const { accessToken, refreshToken, deviceId } = getTokens(request);

  // If access token is missing but refresh token and device id exist, try to refresh immediately
  if (!accessToken && refreshToken && deviceId) {
    try {
      const response = await authApi.refreshToken(refreshToken, deviceId);
      if (response.status === 200 && response.data) {
        const nextResponse = isAuthRoute
          ? NextResponse.redirect(new URL('/dashboard', request.url))
          : NextResponse.next();

        const nowSec = Math.floor(Date.now() / 1000);
        const accessExp = decodeToken(response.data.accessToken)?.exp;
        const refreshExp = decodeToken(response.data.refreshToken)?.exp;
        const accessMaxAge = accessExp
          ? Math.max(0, accessExp - nowSec)
          : 60 * 60;
        const refreshMaxAge = refreshExp
          ? Math.max(0, refreshExp - nowSec)
          : 365 * 24 * 60 * 60;

        nextResponse.cookies.set('access_token', response.data.accessToken, {
          path: '/',
          maxAge: accessMaxAge,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        nextResponse.cookies.set('refresh_token', response.data.refreshToken, {
          path: '/',
          maxAge: refreshMaxAge,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        nextResponse.cookies.set('device_id', deviceId, {
          path: '/',
          maxAge: 365 * 24 * 60 * 60,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        return nextResponse;
      } else {
        const redirectResponse = NextResponse.redirect(
          new URL('/login', request.url)
        );
        redirectResponse.cookies.set('access_token', '', {
          path: '/',
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        redirectResponse.cookies.set('refresh_token', '', {
          path: '/',
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
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
      const redirectResponse = NextResponse.redirect(
        new URL('/login', request.url)
      );
      redirectResponse.cookies.set('access_token', '', {
        path: '/',
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      redirectResponse.cookies.set('refresh_token', '', {
        path: '/',
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
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

  // If no tokens at all
  if (!accessToken && !refreshToken) {
    // Allow public auth routes
    if (isAuthRoute) {
      // Let intl middleware handle the response (or rewrite response)
      return intlResponse || NextResponse.next();
    }
    // Redirect unauthenticated users of protected routes to login
    // But if we have a rewrite response, we need to return it after auth check
    // For now, redirect to login
    return NextResponse.redirect(
      createLocalizedUrl('/login', currentLocale, request)
    );
  }

  // Check if access token is valid
  let isAccessTokenValid = false;
  if (accessToken) {
    try {
      const decoded = decodeToken(accessToken);
      if (decoded) {
        const now = Math.floor(Date.now() / 1000);
        isAccessTokenValid = decoded.exp > now;
      }
    } catch (error) {
      console.error(`❌ Middleware: Error decoding access token:`, error);
    }
  }

  if (isAccessTokenValid) {
    // If user is authenticated and visits auth routes, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(
        createLocalizedUrl('/dashboard', currentLocale, request)
      );
    }
    // Access token is valid, allow request
    // If we have a rewrite response (intlResponse with rewrite), return it
    // Otherwise, let the request proceed
    if (intlResponse) {
      return intlResponse;
    }
    return NextResponse.next();
  }

  // Access token is invalid, try to refresh
  if (refreshToken && deviceId) {
    try {
      const response = await authApi.refreshToken(refreshToken, deviceId);

      if (response.status === 200 && response.data) {
        // Token refreshed successfully, set new tokens and allow request
        const nextResponse = intlResponse || NextResponse.next();

        // Derive cookie lifetimes from JWT exp
        const nowSec = Math.floor(Date.now() / 1000);
        const accessExp = decodeToken(response.data.accessToken)?.exp;
        const refreshExp = decodeToken(response.data.refreshToken)?.exp;
        const accessMaxAge = accessExp
          ? Math.max(0, accessExp - nowSec)
          : 60 * 60;
        const refreshMaxAge = refreshExp
          ? Math.max(0, refreshExp - nowSec)
          : 365 * 24 * 60 * 60;

        // Set new tokens in cookies
        nextResponse.cookies.set('access_token', response.data.accessToken, {
          path: '/',
          maxAge: accessMaxAge,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        nextResponse.cookies.set('refresh_token', response.data.refreshToken, {
          path: '/',
          maxAge: refreshMaxAge,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        return nextResponse;
      } else {
        // Refresh failed, tokens are invalid -> clear cookies and redirect to /login
        const redirectResponse = NextResponse.redirect(
          createLocalizedUrl('/login', currentLocale, request)
        );
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
      const redirectResponse = NextResponse.redirect(
        createLocalizedUrl('/login', currentLocale, request)
      );
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
    // Let intl middleware handle the response (or rewrite response)
    if (intlResponse) {
      return intlResponse;
    }
    return NextResponse.next();
  }

  return NextResponse.redirect(
    createLocalizedUrl('/login', currentLocale, request)
  );
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
