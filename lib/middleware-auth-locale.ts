import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { decodeToken } from "@/lib/auth-utils";
import {
  getAuthTokenCookieOptions,
  getClearAuthTokenCookieOptions,
  getClearDeviceCookieOptions,
  getDeviceCookieOptions,
} from "@/lib/auth-cookies";

export type AppLocale = (typeof routing.locales)[number];

export const isSupportedLocale = (value: string): value is AppLocale =>
  (routing.locales as readonly string[]).includes(value);

/** Raw cookie chain (same order as middleware). */
export function readRawLocaleCookie(request: NextRequest): string | undefined {
  return (
    request.cookies.get("NEXT_LOCALE")?.value ||
    request.cookies.get("locale")?.value ||
    request.cookies.get("next-intl-locale")?.value
  );
}

export function getLocaleContext(request: NextRequest): {
  rawLocaleCookie: string | undefined;
  preferredLocale: AppLocale;
} {
  const rawLocaleCookie = readRawLocaleCookie(request);
  const preferredLocale: AppLocale =
    rawLocaleCookie && isSupportedLocale(rawLocaleCookie)
      ? rawLocaleCookie
      : routing.defaultLocale;

  return { rawLocaleCookie, preferredLocale };
}

export function computeRefreshCookieMaxAges(
  accessToken: string,
  refreshToken: string,
): { accessMaxAge: number; refreshMaxAge: number } {
  const nowSec = Math.floor(Date.now() / 1000);
  const accessExp = decodeToken(accessToken)?.exp;
  const refreshExp = decodeToken(refreshToken)?.exp;
  const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
  const refreshMaxAge = refreshExp
    ? Math.max(0, refreshExp - nowSec)
    : 365 * 24 * 60 * 60;

  return { accessMaxAge, refreshMaxAge };
}

/**
 * Sets access + refresh cookies after refresh; optionally device_id (middleware skips when omitted).
 */
export function applyRefreshedAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  deviceId?: string,
): void {
  const { accessMaxAge, refreshMaxAge } = computeRefreshCookieMaxAges(
    tokens.accessToken,
    tokens.refreshToken,
  );

  response.cookies.set("access_token", tokens.accessToken, {
    ...getAuthTokenCookieOptions(accessMaxAge),
  });
  response.cookies.set("refresh_token", tokens.refreshToken, {
    ...getAuthTokenCookieOptions(refreshMaxAge),
  });
  if (deviceId !== undefined) {
    response.cookies.set("device_id", deviceId, {
      ...getDeviceCookieOptions(365 * 24 * 60 * 60),
    });
  }
}

export function applyClearedAuthCookies(response: NextResponse): void {
  response.cookies.set("access_token", "", {
    ...getClearAuthTokenCookieOptions(),
  });
  response.cookies.set("refresh_token", "", {
    ...getClearAuthTokenCookieOptions(),
  });
  response.cookies.set("device_id", "", {
    ...getClearDeviceCookieOptions(),
  });
}

/** Matches middleware: set NEXT_LOCALE only when no raw locale cookie was sent. */
export function appendDefaultLocaleCookieIfMissing(
  response: NextResponse,
  rawLocaleCookie: string | undefined,
): void {
  if (rawLocaleCookie) {
    return;
  }
  response.cookies.set("NEXT_LOCALE", routing.defaultLocale, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
