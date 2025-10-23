'use client';

import React from 'react';
import { BalanceStats as BalanceStatsType } from '@/types/balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BalanceStatsProps {
  stats: BalanceStatsType;
}

export const BalanceStats: React.FC<BalanceStatsProps> = ({ stats }) => {
  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Balance */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${formatAmount(stats.totalBalance)}</div>
          <p className="text-xs text-gray-400">
            All currencies
          </p>
        </CardContent>
      </Card>

      {/* Available Balance */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">
            ${formatAmount(stats.totalAvailable)}
          </div>
          <p className="text-xs text-gray-400">
            For use
          </p>
        </CardContent>
      </Card>

      {/* Frozen Balance */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            Frozen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-400">
            ${formatAmount(stats.totalFrozen)}
          </div>
          <p className="text-xs text-gray-400">
            In process
          </p>
        </CardContent>
      </Card>

      {/* Net Deposited */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            Net Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            stats.totalDeposited - stats.totalWithdrawn >= 0 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}>
            ${formatAmount(stats.totalDeposited - stats.totalWithdrawn)}
          </div>
          <p className="text-xs text-gray-400">
            Deposited - Withdrawn
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
