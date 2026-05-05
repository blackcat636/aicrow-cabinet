'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BillingList } from '@/components/billing/BillingList';
import { AppLayout } from '@/components/AppLayout';
import { PageLoader } from '@/components/ui/PageLoader';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function BillingPage() {
  const { isLoading } = useAuth();
  const tCommon = useTranslations('common');

  if (isLoading) {
    return <PageLoader label={tCommon('loading')} />;
  }

  return (
    <AppLayout>
      <div className="max-w-[1262px] mx-auto">
        <BillingList />
      </div>
    </AppLayout>
  );
}
