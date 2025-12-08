'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations('error');
  
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>{t('title') || 'Something went wrong!'}</h2>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        {t('tryAgain') || 'Try again'}
      </button>
    </div>
  );
}
