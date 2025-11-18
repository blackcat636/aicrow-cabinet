export const dynamic = 'force-dynamic';
export const runtime = 'edge';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider 
      messages={messages}
      onError={(error) => {
        // Suppress missing translation errors for dynamic keys (like transaction descriptions from API)
        if (error && error.message && (
          error.message.includes('transactionDescriptions.') ||
          error.message.includes('MISSING_MESSAGE')
        )) {
          // Silently ignore - these are dynamic descriptions from API
          // Return undefined to suppress the error
          return undefined;
        }
        // Return undefined to suppress the error
        return undefined;
      }}
      getMessageFallback={({ namespace, key, error }) => {
        // For transactionDescriptions, return empty string to indicate missing translation
        // The component will handle this and return the original description
        if (namespace === 'balance' && key && typeof key === 'string' && key.startsWith('transactionDescriptions.')) {
          // Return empty string to indicate missing translation
          // The component's getTranslatedDescription will return the original description
          return '';
        }
        // For other missing keys, return the key path
        const path = [namespace, key].filter((part) => part != null).join('.');
        return path;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}

