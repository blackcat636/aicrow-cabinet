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
      // Suppress errors for transactionDescriptions keys and MISSING_MESSAGE errors
      if (error && error.message && (
        error.message.includes('transactionDescriptions.') ||
        error.message.includes('MISSING_MESSAGE')
      )) {
        // Silently ignore - these are dynamic descriptions from API
        return undefined;
      }
      // Return undefined to suppress the error
      return undefined;
    },
    // Return fallback value if translation is missing
    getMessageFallback({ namespace, key, error }) {
      // For transactionDescriptions, return the description itself (without namespace prefix)
      // This prevents MISSING_MESSAGE errors for dynamic descriptions from API
      if (namespace === 'balance' && key && typeof key === 'string' && key.startsWith('transactionDescriptions.')) {
        // Return the description itself (remove the 'transactionDescriptions.' prefix)
        // The component will check if this matches the original and use it if so
        return key.replace('transactionDescriptions.', '');
      }
      // For other missing keys, return the key path
      const path = [namespace, key].filter((part) => part != null).join('.');
      return path;
    }
  };
});

