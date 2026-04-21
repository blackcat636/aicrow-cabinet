import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

import {
  APP_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_PREFIX,
} from '@/i18n/locale-config';

export const routing = defineRouting({
  locales: [...APP_LOCALES],

  defaultLocale: DEFAULT_LOCALE,

  localePrefix: LOCALE_PREFIX,

  // Disable automatic locale detection from Accept-Language header
  // Always use default locale unless explicitly set via cookie or URL
  localeDetection: false
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

