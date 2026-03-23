'use client';

import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function BalanceDepositCancelPage() {
  const t = useTranslations('balance.deposit');
  const router = useRouter();

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="rounded-full bg-amber-500/20 p-4">
          <svg
            className="w-12 h-12 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <p className="text-xl font-semibold text-white text-center max-w-md">{t('checkoutCanceled')}</p>
        <Button
          onClick={() => router.push('/balance')}
          variant="outline"
          className="border-gray-600 hover:bg-gray-800 text-white"
        >
          {t('goToBalance')}
        </Button>
      </div>
    </AppLayout>
  );
}
