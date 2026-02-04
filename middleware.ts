import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { getTokens } from '@/lib/auth';
import { decodeToken } from '@/lib/auth-utils';
import { authApi } from '@/lib/apiAuth';
import { routing } from './i18n/routing';

export const runtime = 'edge';

const protectedRoutes = [
  '/workflows',
  '/executions',
  '/profile',
  '/dashboard',
  '/balance',
  '/billing',
  '/integrations'
];
const authRoutes = [
  '/login',
  '/signup',
  '/auth/callback',
  '/sso/initiate',
  '/auth/sso/initiate'
];
const ssoRoutes = ['/sso/initiate', '/auth/sso/initiate'];

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false
});

function getLocaleFromPathname(pathname: string): string | null {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return null;
}

function normalizePathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    const normalized = pathname.replace(`/${locale}`, '') || '/';
    return normalized;
  }
  return pathname;
}

function createLocalizedUrl(
  path: string,
  locale: string,
  request: NextRequest
): URL {
  // Preserve query parameters from original request
  const originalUrl = new URL(request.url);
  const searchParams = originalUrl.searchParams.toString();

  if (
    locale === routing.defaultLocale &&
    routing.localePrefix === 'as-needed'
  ) {
    const url = new URL(path, request.url);
    if (searchParams) {
      url.search = searchParams;
    }
    return url;
  }
  const url = new URL(`/${locale}${path}`, request.url);
  if (searchParams) {
    url.search = searchParams;
  }
  return url;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/auth/sso/exchange'
  ) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    const { accessToken, refreshToken } = getTokens(request);

    const localeCookie =
      request.cookies.get('NEXT_LOCALE')?.value ||
      request.cookies.get('locale')?.value ||
      request.cookies.get('next-intl-locale')?.value;
    const currentLocale =
      localeCookie && routing.locales.includes(localeCookie as any)
        ? localeCookie
        : routing.defaultLocale;

    let redirectResponse: NextResponse;

    if (!accessToken && !refreshToken) {
      redirectResponse = NextResponse.redirect(
        createLocalizedUrl('/login', currentLocale, request)
      );
    } else if (accessToken) {
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
        redirectResponse = NextResponse.redirect(
          createLocalizedUrl('/login', currentLocale, request)
        );
      }
    } else {
      redirectResponse = NextResponse.redirect(
        createLocalizedUrl('/login', currentLocale, request)
      );
    }

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

  const pathHasLocale = getLocaleFromPathname(pathname);
  let intlResponse: NextResponse | null = null;
  let currentLocale: string;
  let normalizedPathname: string;

  const localeCookie =
    request.cookies.get('NEXT_LOCALE')?.value ||
    request.cookies.get('locale')?.value ||
    request.cookies.get('next-intl-locale')?.value;
  const preferredLocale =
    localeCookie && routing.locales.includes(localeCookie as any)
      ? localeCookie
      : routing.defaultLocale;

  if (!pathHasLocale && !pathname.startsWith('/api')) {
    if (preferredLocale !== routing.defaultLocale) {
      const localizedUrl = createLocalizedUrl(
        pathname,
        preferredLocale,
        request
      );
      return NextResponse.redirect(localizedUrl);
    }

    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('Accept-Language', routing.defaultLocale);

    // Create modified request
    const modifiedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body
    });

    intlResponse = intlMiddleware(modifiedRequest);

    if (intlResponse && intlResponse.status === 307) {
      const location = intlResponse.headers.get('location');
      let redirectedPath: string | null = null;
      let redirectedLocale: string | null = null;

      if (location) {
        const locationUrl = new URL(location, request.url);
        redirectedPath = locationUrl.pathname;
        redirectedLocale = getLocaleFromPathname(redirectedPath);

        // Preserve query params from original request
        const originalSearchParams = request.nextUrl.searchParams.toString();

        if (redirectedLocale && redirectedLocale !== routing.defaultLocale) {
          const normalizedPath = normalizePathname(redirectedPath);
          const finalUrl = new URL(normalizedPath, request.url);
          if (originalSearchParams) {
            finalUrl.search = originalSearchParams;
          }
          return NextResponse.redirect(finalUrl);
        }
      }

      if (redirectedLocale === routing.defaultLocale && redirectedPath) {
        const finalPath = normalizePathname(redirectedPath);
        if (finalPath === pathname) {
          return intlResponse;
        } else {
          const finalUrl = new URL(pathname, request.url);
          const originalSearchParams = request.nextUrl.searchParams.toString();
          if (originalSearchParams) {
            finalUrl.search = originalSearchParams;
          }
          return NextResponse.redirect(finalUrl);
        }
      }
      return intlResponse;
    }

    currentLocale = routing.defaultLocale;
    normalizedPathname = pathname;

    const rewriteUrl = new URL(
      `/${routing.defaultLocale}${pathname}`,
      request.url
    );
    const rewriteResponse = NextResponse.rewrite(rewriteUrl);

    rewriteResponse.headers.set('x-next-intl-locale', routing.defaultLocale);

    intlResponse = rewriteResponse;
  } else {
    const localeCookie =
      request.cookies.get('NEXT_LOCALE')?.value ||
      request.cookies.get('locale')?.value ||
      request.cookies.get('next-intl-locale')?.value;
    const preferredLocale =
      localeCookie && routing.locales.includes(localeCookie as any)
        ? localeCookie
        : routing.defaultLocale;

    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('Accept-Language', preferredLocale);

    // Create modified request
    const modifiedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body
    });

    intlResponse = intlMiddleware(modifiedRequest);

    if (intlResponse && intlResponse.status === 307) {
      return intlResponse;
    }

    currentLocale = getLocaleFromPathname(pathname) || preferredLocale;
    normalizedPathname = normalizePathname(pathname);
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    normalizedPathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => normalizedPathname === route);
  const isSSORoute = ssoRoutes.some((route) => normalizedPathname === route);

  const { accessToken, refreshToken, deviceId } = getTokens(request);

  if (!accessToken && refreshToken && deviceId) {
    try {
      const response = await authApi.refreshToken(refreshToken, deviceId);
      if (response.status === 200 && response.data) {
        const nextResponse =
          isAuthRoute && !isSSORoute
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

  if (!accessToken && !refreshToken) {
    if (isAuthRoute) {
      return intlResponse || NextResponse.next();
    }
    return NextResponse.redirect(
      createLocalizedUrl('/login', currentLocale, request)
    );
  }

  let isAccessTokenValid = false;
  if (accessToken) {
    try {
      const decoded = decodeToken(accessToken);
      if (decoded) {
        const now = Math.floor(Date.now() / 1000);
        isAccessTokenValid = decoded.exp > now;
      }
    } catch (error) {}
  }

  if (isAccessTokenValid) {
    if (isAuthRoute && !isSSORoute) {
      return NextResponse.redirect(
        createLocalizedUrl('/dashboard', currentLocale, request)
      );
    }
    if (intlResponse) {
      return intlResponse;
    }
    return NextResponse.next();
  }

  if (refreshToken && deviceId) {
    try {
      const response = await authApi.refreshToken(refreshToken, deviceId);

      if (response.status === 200 && response.data) {
        const nextResponse = intlResponse || NextResponse.next();

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

        return nextResponse;
      } else {
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

  if (isAuthRoute) {
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
