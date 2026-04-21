'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from '@/i18n/routing';
import { getClientPreferredLocale } from '@/lib/client-locale';
import en from '@/messages/en.json';
import uk from '@/messages/uk.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import ru from '@/messages/ru.json';

const MESSAGES: Record<(typeof routing.locales)[number], AbstractIntlMessages> =
  {
    en: en as AbstractIntlMessages,
    uk: uk as AbstractIntlMessages,
    fr: fr as AbstractIntlMessages,
    es: es as AbstractIntlMessages,
    ru: ru as AbstractIntlMessages
  };

function ErrorContent({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-4 text-center text-white">
      <h2 className="text-xl font-semibold">{t('title')}</h2>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Root error.tsx renders outside [locale]/layout, so there is no NextIntlClientProvider
  // from the locale tree. Match locale after mount to avoid SSR/client hydration mismatch.
  const [locale, setLocale] = useState<(typeof routing.locales)[number]>(
    routing.defaultLocale
  );

  useEffect(() => {
    setLocale(getClientPreferredLocale());
  }, []);

  const messages = MESSAGES[locale] ?? MESSAGES[routing.defaultLocale];

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ErrorContent error={error} reset={reset} />
    </NextIntlClientProvider>
  );
}
