'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/PageLoader';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function BalanceDepositSuccessPage() {
  const t = useTranslations('balance.deposit');
  const router = useRouter();
  const [phase, setPhase] = useState<'verifying' | 'success'>('verifying');

  useEffect(() => {
    let mounted = true;

    const refreshProfile = async () => {
      try {
        await fetch('/api/auth/refresh', { method: 'POST', cache: 'no-store' });
        await fetch('/api/users/profile', {
          method: 'GET',
          cache: 'no-store'
        });
      } catch {
        // Ignore
      }
    };

    const verifyAndRefresh = async () => {
      await refreshProfile();
      if (mounted) {
        setPhase('success');
      }
    };

    const timer = setTimeout(verifyAndRefresh, 800);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        {phase === 'verifying' ? (
          <PageLoader label={t('checkoutVerifying')} />
        ) : (
          <>
            <div className="rounded-full bg-emerald-500/20 p-4">
              <svg
                className="w-12 h-12 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold text-white text-center">{t('checkoutSuccess')}</p>
            <Button
              onClick={() => router.push('/balance')}
              className="bg-[var(--color-main)] hover:opacity-90 text-white border-0"
            >
              {t('goToBalance')}
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
