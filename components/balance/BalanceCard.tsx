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
    const decimalPlaces = parseInt(precision.split('.')[1]?.length.toString() || '2');
    return amount.toFixed(decimalPlaces);
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
    return <span className="text-lg font-semibold">{currency.symbol}</span>;
  };

  return (
    <Card className="w-full bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-white">
          {getCurrencyIcon(currency)}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{currency.name}</span>
              <Badge variant={currency.is_crypto ? "default" : "secondary"}>
                {currency.code}
              </Badge>
            </div>
            <p className="text-sm text-gray-400">{currency.description}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Balance */}
        <div className="text-center p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Total Balance</p>
          <p className="text-3xl font-bold text-white">
            {currency.symbol}{formatAmount(balance, currency.precision)}
          </p>
        </div>

        {/* Balance Details */}
        <div className="space-y-3">
          <div className="text-center p-3 bg-green-900/30 border border-green-800 rounded-lg">
            <p className="text-sm text-green-400 mb-1">Available</p>
            <p className="font-semibold text-green-300">
              {currency.symbol}{formatAmount(available_balance, currency.precision)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-orange-900/30 border border-orange-800 rounded-lg">
            <p className="text-sm text-orange-400 mb-1">Frozen</p>
            <p className="font-semibold text-orange-300">
              {currency.symbol}{formatAmount(frozen_balance, currency.precision)}
            </p>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Total Deposited</p>
            <p className="font-medium text-green-400">
              {currency.symbol}{formatAmount(total_deposited, currency.precision)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Total Withdrawn</p>
            <p className="font-medium text-red-400">
              {currency.symbol}{formatAmount(total_withdrawn, currency.precision)}
            </p>
          </div>
        </div>

        {/* Exchange Rate */}
        {currency.exchange_rate_to_usd !== "1.00000000" && (
          <div className="text-center p-2 bg-blue-900/30 border border-blue-800 rounded-lg">
            <p className="text-xs text-blue-400">
              Exchange Rate to USD: ${formatAmount(parseFloat(currency.exchange_rate_to_usd), "2.00000000")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
