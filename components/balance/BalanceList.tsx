'use client';

import React, { useState, useEffect } from 'react';
import { BalanceData } from '@/types/balance';
import { balanceApi } from '@/lib/apiBalance';
import { BalanceCard } from './BalanceCard';
import { TransactionHistory } from './TransactionHistory';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const BalanceList: React.FC = () => {
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
      setError(err.message || 'Failed to load balance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchBalances();
    }
  }, [fetchBalances]);

  // Skeleton loader to prevent layout shift
  const SkeletonLoader = () => (
    <div className="space-y-6 min-h-[400px]">
      <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
        {/* Header skeleton - fixed height */}
        <div className="flex items-center justify-between p-6 min-h-[100px]">
          <div className="ml-6">
            <div className="h-8 w-48 bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-64 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
                <div className="bg-black rounded-lg p-5 h-40 animate-pulse">
                  <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
                  <div className="h-12 w-48 bg-gray-700 rounded mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <Card className="w-full bg-[#141519] border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Error</h3>
          <p className="text-gray-400 text-center mb-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 min-h-[400px]">
      {/* Balance Cards */}
      {balances.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
          {/* Header - fixed height */}
          <div className="flex items-center justify-between p-6 min-h-[100px]">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">Your Balance</h2>
              <p className="text-gray-300 mt-1">Check balances and recent transactions</p>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No balances found
              </h3>
              <p className="text-gray-300 mb-6">
                You don't have any active balances yet
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
          {/* Header - fixed height */}
          <div className="flex items-center justify-between p-6 min-h-[100px]">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">Your Balance</h2>
              <p className="text-gray-300 mt-1">Check balances and recent transactions</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {balances.map((balance, index) => (
                <BalanceCard key={`${balance.currency.id}-${index}`} balanceData={balance} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <TransactionHistory balances={balances} />
    </div>
  );
};
