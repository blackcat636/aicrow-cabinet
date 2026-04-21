import {
  APP_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_PREFIX,
  type AppLocale,
} from '@/i18n/locale-config';

const isSupportedLocale = (value: string): value is AppLocale =>
  (APP_LOCALES as readonly string[]).includes(value);

function readClientCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`),
  );
  const raw = match?.[1]?.trim();
  return raw?.length ? raw : null;
}

/**
 * Client-only: preferred locale from URL prefix or cookies (same cookie order as middleware).
 */
export function getClientPreferredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const { pathname } = window.location;
  for (const loc of APP_LOCALES) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
      return loc;
    }
  }

  for (const name of ['NEXT_LOCALE', 'locale', 'next-intl-locale'] as const) {
    const value = readClientCookie(name);
    if (value && isSupportedLocale(value)) {
      return value;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Pathname with locale prefix for redirects, aligned with next-intl `as-needed` + defaultLocale.
 */
export function getLocalizedAppPath(path: string): string {
  const pathname = path.startsWith('/') ? path : `/${path}`;
  const locale = getClientPreferredLocale();

  if (locale === DEFAULT_LOCALE && LOCALE_PREFIX === 'as-needed') {
    return pathname;
  }

  return `/${locale}${pathname}`;
}
