'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BillingList } from '@/components/billing/BillingList';
import { AppLayout } from '@/components/AppLayout';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function BillingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const t = useTranslations('billing');
  const tCommon = useTranslations('common');

  if (isLoading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-300">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-full">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-300">{t('description')}</p>
        </div>
        <BillingList />
      </div>
    </AppLayout>
  );
}
