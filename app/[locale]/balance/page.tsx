'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BalanceList } from '@/components/balance/BalanceList';
import { AppLayout } from '@/components/AppLayout';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function BalancePage() {
  useAuth();

  return (
    <AppLayout>
      <BalanceList />
    </AppLayout>
  );
}
