import { routing } from '@/i18n/routing';

function isLocaleStringMap(o: Record<string, unknown>): boolean {
  return routing.locales.some((loc) => typeof o[loc] === 'string');
}

/**
 * API sometimes returns user-facing strings as a map, e.g. { en, uk, fr, es, ru }.
 * Picks the string for the active UI locale with sensible fallbacks.
 */
export function resolveLocalizedApiField(
  value: unknown,
  locale: string
): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => resolveLocalizedApiField(v, locale))
      .filter((s) => s.trim() !== '')
      .join(', ');
  }
  if (typeof value !== 'object') {
    return String(value);
  }

  const o = value as Record<string, unknown>;
  if (!isLocaleStringMap(o)) {
    return '';
  }

  const order = [
    locale,
    routing.defaultLocale,
    ...routing.locales.filter((l) => l !== locale && l !== routing.defaultLocale)
  ];
  const tried = new Set<string>();
  for (const loc of order) {
    if (tried.has(loc)) continue;
    tried.add(loc);
    const v = o[loc];
    if (typeof v === 'string' && v.trim() !== '') {
      return v;
    }
  }
  for (const v of Object.values(o)) {
    if (typeof v === 'string' && v.trim() !== '') {
      return v;
    }
  }
  return '';
}
