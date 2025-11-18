import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['uk', 'en', 'fr'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The locale prefix strategy
  localePrefix: 'as-needed' // Options: 'always', 'as-needed', 'never'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

