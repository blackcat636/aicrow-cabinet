'use client';

import React from 'react';
import { BalanceData, Currency } from '@/types/balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BalanceCardProps {
  balanceData: BalanceData;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balanceData }) => {
  const { currency, balance, frozen_balance, available_balance, total_deposited, total_withdrawn } = balanceData;

  const formatAmount = (amount: number, precision: string) => {
    return amount.toFixed(2);
  };

  const getCurrencyIcon = (currency: Currency) => {
    if (currency.icon_url) {
      return (
        <img
          src={currency.icon_url}
          alt={currency.name}
          className="w-6 h-6 rounded-full"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    return <span className="text-lg font-semibold">Token</span>;
  };

  return (
    <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
      <Card className="w-full bg-black border-0 rounded-lg h-full">
      <CardHeader className="pb-3 bg-black rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-white">
          {getCurrencyIcon(currency)}
          <span className="text-lg font-semibold">Token</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Balance */}
        <div className="text-center p-6 bg-[#141519] rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Total Balance</p>
          <p className="text-4xl font-bold text-white">
            {formatAmount(balance, currency.precision)}
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};
