'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ExecutionHistory } from '@/components/workflow/ExecutionHistory';
import { AppLayout } from '@/components/AppLayout';
import { PageLoader } from '@/components/ui/PageLoader';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function ExecutionsPage() {
  const { isLoading } = useAuth();
  const tCommon = useTranslations('common');

  // Show loading state
  if (isLoading) {
    return <PageLoader label={tCommon('loading')} />;
  }

  return (
    <AppLayout>
      <ExecutionHistory />
    </AppLayout>
  );
}
