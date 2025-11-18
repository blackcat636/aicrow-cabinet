import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Suppress missing translation errors for dynamic keys (like transaction descriptions from API)
    onError(error) {
      // Only suppress errors for transactionDescriptions keys
      if (error && error.message && error.message.includes('transactionDescriptions.')) {
        // Silently ignore - these are dynamic descriptions from API
        return;
      }
      // Log other translation errors in development only
      if (process.env.NODE_ENV === 'development' && error) {
        console.error('[next-intl] Translation error:', error.message);
      }
    },
    // Return fallback value if translation is missing
    getMessageFallback({ namespace, key, error }) {
      // For transactionDescriptions, return the description itself (without namespace prefix)
      if (namespace === 'balance' && key && typeof key === 'string' && key.startsWith('transactionDescriptions.')) {
        return key.replace('transactionDescriptions.', '');
      }
      // For other missing keys, return the key path
      const path = [namespace, key].filter((part) => part != null).join('.');
      return path;
    }
  };
});

