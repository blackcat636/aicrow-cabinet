import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

import { getTokens } from "@/lib/auth";
import { decodeToken } from "@/lib/auth-utils";
import { authApi } from "@/lib/apiAuth";
import {
  getLocaleContext,
  applyRefreshedAuthCookies,
  applyClearedAuthCookies,
  appendDefaultLocaleCookieIfMissing,
} from "@/lib/middleware-auth-locale";
const authRoutes = [
  "/login",
  "/signup",
  "/auth/callback",
  "/sso/initiate",
  "/auth/sso/initiate",
];
const ssoRoutes = ["/sso/initiate", "/auth/sso/initiate"];

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
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
    const normalized = pathname.replace(`/${locale}`, "") || "/";

    return normalized;
  }

  return pathname;
}

function createLocalizedUrl(
  path: string,
  locale: string,
  request: NextRequest,
): URL {
  // Preserve query parameters from original request
  const originalUrl = new URL(request.url);
  const searchParams = originalUrl.searchParams.toString();

  if (
    locale === routing.defaultLocale &&
    routing.localePrefix === "as-needed"
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
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname === "/auth/sso/exchange"
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const { accessToken, refreshToken, deviceId } = getTokens(request);
    const { rawLocaleCookie, preferredLocale: currentLocale } =
      getLocaleContext(request);

    let redirectResponse: NextResponse;

    if (!accessToken && !refreshToken) {
      redirectResponse = NextResponse.redirect(
        createLocalizedUrl("/login", currentLocale, request),
      );
    } else if (accessToken) {
      try {
        const decoded = decodeToken(accessToken);

        if (decoded && decoded.exp > Math.floor(Date.now() / 1000)) {
          redirectResponse = NextResponse.redirect(
            createLocalizedUrl("/dashboard", currentLocale, request),
          );
        } else {
          redirectResponse = NextResponse.redirect(
            createLocalizedUrl("/login", currentLocale, request),
          );
        }
      } catch {
        redirectResponse = NextResponse.redirect(
          createLocalizedUrl("/login", currentLocale, request),
        );
      }
    } else if (refreshToken && deviceId) {
      try {
        const refreshed = await authApi.refreshToken(refreshToken, deviceId);

        if (refreshed.status === 200 && refreshed.data) {
          const nextResponse = NextResponse.redirect(
            createLocalizedUrl("/dashboard", currentLocale, request),
          );

          applyRefreshedAuthCookies(nextResponse, refreshed.data, deviceId);
          redirectResponse = nextResponse;
        } else {
          redirectResponse = NextResponse.redirect(
            createLocalizedUrl("/login", currentLocale, request),
          );
        }
      } catch {
        redirectResponse = NextResponse.redirect(
          createLocalizedUrl("/login", currentLocale, request),
        );
      }
    } else {
      redirectResponse = NextResponse.redirect(
        createLocalizedUrl("/login", currentLocale, request),
      );
    }

    appendDefaultLocaleCookieIfMissing(redirectResponse, rawLocaleCookie);

    return redirectResponse;
  }

  const pathHasLocale = getLocaleFromPathname(pathname);
  let intlResponse: NextResponse | null = null;
  let currentLocale: string;
  let normalizedPathname: string;

  const { preferredLocale } = getLocaleContext(request);

  if (!pathHasLocale && !pathname.startsWith("/api")) {
    if (preferredLocale !== routing.defaultLocale) {
      const localizedUrl = createLocalizedUrl(
        pathname,
        preferredLocale,
        request,
      );

      return NextResponse.redirect(localizedUrl);
    }

    const modifiedHeaders = new Headers(request.headers);

    modifiedHeaders.set("Accept-Language", routing.defaultLocale);

    // Create modified request
    const modifiedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body,
    });

    intlResponse = intlMiddleware(modifiedRequest);

    if (intlResponse && intlResponse.status === 307) {
      const location = intlResponse.headers.get("location");
      let redirectedPath: string | null = null;
      let redirectedLocale: string | null = null;
      let locationUrl: URL | null = null;

      if (location) {
        locationUrl = new URL(location, request.url);
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

      // next-intl (localePrefix: as-needed) may respond with 307 to an unprefixed path
      // (e.g. /billing). Returning that skips the rewrite below, so the first segment is
      // wrongly treated as [locale] ("billing") and app/[locale]/layout calls notFound().
      if (locationUrl && locationUrl.origin !== request.nextUrl.origin) {
        return intlResponse;
      }
      // Same-origin unprefixed redirect: fall through to explicit /{defaultLocale}/... rewrite.
    }

    currentLocale = routing.defaultLocale;
    normalizedPathname = pathname;

    const rewriteUrl = new URL(
      `/${routing.defaultLocale}${pathname}`,
      request.url,
    );
    const rewriteResponse = NextResponse.rewrite(rewriteUrl);

    rewriteResponse.headers.set("x-next-intl-locale", routing.defaultLocale);

    intlResponse = rewriteResponse;
  } else {
    const modifiedHeaders = new Headers(request.headers);

    modifiedHeaders.set("Accept-Language", preferredLocale);

    // Create modified request
    const modifiedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body,
    });

    intlResponse = intlMiddleware(modifiedRequest);

    if (intlResponse && intlResponse.status === 307) {
      return intlResponse;
    }

    currentLocale = getLocaleFromPathname(pathname) || preferredLocale;
    normalizedPathname = normalizePathname(pathname);
  }

  const isAuthRoute = authRoutes.some((route) => normalizedPathname === route);
  const isSSORoute = ssoRoutes.some((route) => normalizedPathname === route);

  const { accessToken, refreshToken, deviceId } = getTokens(request);

  if (!accessToken && refreshToken && deviceId) {
    try {
      const response = await authApi.refreshToken(refreshToken, deviceId);

      if (response.status === 200 && response.data) {
        const nextResponse =
          isAuthRoute && !isSSORoute
            ? NextResponse.redirect(
                createLocalizedUrl("/dashboard", currentLocale, request),
              )
            : NextResponse.next();

        applyRefreshedAuthCookies(nextResponse, response.data, deviceId);

        return nextResponse;
      } else {
        const redirectResponse = NextResponse.redirect(
          createLocalizedUrl("/login", currentLocale, request),
        );

        applyClearedAuthCookies(redirectResponse);

        return redirectResponse;
      }
    } catch {
      const redirectResponse = NextResponse.redirect(
        createLocalizedUrl("/login", currentLocale, request),
      );

      applyClearedAuthCookies(redirectResponse);

      return redirectResponse;
    }
  }

  if (!accessToken && !refreshToken) {
    if (isAuthRoute) {
      return intlResponse || NextResponse.next();
    }

    return NextResponse.redirect(
      createLocalizedUrl("/login", currentLocale, request),
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
    } catch {}
  }

  if (isAccessTokenValid) {
    if (isAuthRoute && !isSSORoute) {
      return NextResponse.redirect(
        createLocalizedUrl("/dashboard", currentLocale, request),
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

        applyRefreshedAuthCookies(nextResponse, response.data);

        return nextResponse;
      } else {
        const redirectResponse = NextResponse.redirect(
          createLocalizedUrl("/login", currentLocale, request),
        );

        applyClearedAuthCookies(redirectResponse);

        return redirectResponse;
      }
    } catch {
      const redirectResponse = NextResponse.redirect(
        createLocalizedUrl("/login", currentLocale, request),
      );

      applyClearedAuthCookies(redirectResponse);

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
    createLocalizedUrl("/login", currentLocale, request),
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
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
