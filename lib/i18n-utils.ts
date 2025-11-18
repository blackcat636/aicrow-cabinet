// Utility functions for i18n
import { useTranslations as useNextIntlTranslations } from 'next-intl';

/**
 * Re-export useTranslations for convenience
 * Usage: const t = useTranslations('workflow');
 */
export { useTranslations } from 'next-intl';

/**
 * Helper function to get nested translation keys
 * Usage: const statusLabel = getNestedTranslation(t, 'status', 'completed');
 */
export function getNestedTranslation(
  t: ReturnType<typeof useNextIntlTranslations>,
  ...keys: string[]
): string {
  return t(keys.join('.'));
}

