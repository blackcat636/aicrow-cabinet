'use client';

import React, { useState, useEffect } from 'react';
import { BalanceData } from '@/types/balance';
import { balanceApi } from '@/lib/apiBalance';
import { TransactionHistory } from './TransactionHistory';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const BalanceList: React.FC = () => {
  const t = useTranslations('balance');
  const [balances, setBalances] = useState<BalanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = React.useRef(false);

  const fetchBalances = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await balanceApi.getBalance();
      
      if (response.status === 200 && response.data) {
        setBalances(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ Error fetching balances:', err);
      setError(err.message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchBalances();
    }
  }, [fetchBalances]);

  const SkeletonLoader = () => (
    <div className="space-y-4 min-h-[400px]">
      <div className="h-10 w-72 rounded bg-[var(--color-secondary-3)] animate-pulse" />
      <div className="h-5 w-80 rounded bg-[var(--color-secondary-3)] animate-pulse" />
      <div className="flex gap-3 pt-2">
        <div className="h-12 w-[446px] rounded-[10px] bg-[var(--color-secondary-3)] animate-pulse" />
        <div className="h-12 w-[147px] rounded-[10px] bg-[var(--color-secondary-3)] animate-pulse" />
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[74px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <Card className="w-full bg-[var(--color-secondary-2)] border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('loadingError')}</h3>
          <p className="text-gray-400 text-center mb-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return <TransactionHistory balances={balances} />;
};
