/**
 * Shared locale list and defaults for i18n and client helpers.
 * No next-intl/navigation imports — safe to import from Vitest (node).
 */
export const APP_LOCALES = ['uk', 'en', 'fr', 'es', 'ru'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_PREFIX = 'as-needed' as const;
