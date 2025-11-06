'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, BalanceData } from '@/types/balance';
import { balanceApi } from '@/lib/apiBalance';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';

interface TransactionHistoryProps {
  balances: BalanceData[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ balances }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (balances.length > 0 && !selectedCurrencyId) {
      setSelectedCurrencyId(balances[0].currency.id);
    }
  }, [balances, selectedCurrencyId]);

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
    }
  }, [user?.id]);
  
  // Filter transactions by selected currency
  const filteredTransactions = useMemo(() => {
    if (!selectedCurrencyId) {
      return transactions;
    }
    const filtered = transactions.filter(t => t.currency && t.currency.id === selectedCurrencyId);
    return filtered;
  }, [transactions, selectedCurrencyId]);

  const fetchTransactions = async () => {
    if (!user?.id) {
      setError('User ID not available');
      return;
    }

    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await balanceApi.getTransactions(userId);

      if (response.status === 200 && response.data) {
        let transactionData = Array.isArray(response.data) ? response.data : [response.data];
        
        if (selectedCurrencyId) {
          transactionData = transactionData.filter(
            t => t.currency && t.currency.id === selectedCurrencyId
          );
        }
        setTransactions(transactionData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      if (err.status === 404) {
        setTransactions([]);
        setError(null);
      } else {
        setError(err.message || 'Failed to load transactions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format amount with currency symbol
  const formatAmount = (amount: string, currency: Transaction['currency']) => {
    const numAmount = parseFloat(amount);
    const precision = parseFloat(currency.precision);
    return numAmount.toFixed(precision);
  };

  // Format date: mm/dd/yyyy
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Get transaction type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WITHDRAWAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'TRANSFER':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'FEE':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'FAILED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownCircle className="w-5 h-5 text-green-400" />;
      case 'WITHDRAWAL':
        return <ArrowUpCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
            <p className="text-gray-300">Loading transaction history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">Loading Error</h3>
            <p className="text-gray-400 text-center mb-4">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Get selected currency
  const selectedCurrency = balances.find(b => b.currency.id === selectedCurrencyId);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  return (
    <div
      className="relative rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Interactive gradient overlay that follows mouse */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
        style={{
          background: isHovering
            ? `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(165,0,225,0.35), rgba(123,97,255,0.25) 40%, transparent 70%)`
            : 'none'
        }}
      />
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-white">Transaction History</CardTitle>
            <p className="text-gray-400 mt-1">View all your balance transactions</p>
          </div>
          {balances.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Currency:</label>
              <select
                value={selectedCurrencyId || ''}
                onChange={(e) => setSelectedCurrencyId(Number(e.target.value))}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              >
                {balances.map((balance) => (
                  <option key={balance.currency.id} value={balance.currency.id}>
                    {balance.currency.code} - {balance.currency.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 relative z-10">
        {!selectedCurrencyId ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No currency selected</h3>
            <p className="text-gray-300">Please select a currency to view transactions</p>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
            <p className="text-gray-300">
              You don't have any transactions for {selectedCurrency?.currency.name || 'this currency'} yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-5 bg-black/40 backdrop-blur-sm rounded-lg border border-gray-700/50 transition-all"
              >
                <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-4">
                  {/* Left side - Icon and Main Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTransactionIcon(transaction.type) || (
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400 font-semibold text-sm">
                            {transaction.type[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${getTypeColor(transaction.type)} border text-xs font-semibold`}
                        >
                          {transaction.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(transaction.status)} border text-xs font-semibold`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>

                      <p className="text-white font-medium mb-1">{transaction.description}</p>

                      {transaction.reference_id && (
                        <p className="text-xs text-gray-400 mb-2">
                          Reference: <span className="font-mono">{transaction.reference_id}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-2 flex-wrap">
                        <span>{formatDate(transaction.created_at)}</span>
                        {transaction.currency && (
                          <span className="flex items-center gap-1">
                            Currency: {transaction.currency.code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Amount and Balance Info */}
                  <div className="flex-shrink-0 md:text-right w-full md:w-auto mt-3 md:mt-0">
                    <div className="mb-2">
                      <p
                        className={`text-2xl font-bold whitespace-normal break-all leading-tight ${
                          transaction.type === 'DEPOSIT'
                            ? 'text-green-400'
                            : transaction.type === 'WITHDRAWAL'
                            ? 'text-red-400'
                            : 'text-white'
                        }`}
                      >
                        {transaction.type === 'DEPOSIT' ? '+' : '-'}
                        {formatAmount(transaction.amount, transaction.currency)}
                        {transaction.currency.symbol && (
                          <span className="text-lg ml-1">{transaction.currency.symbol}</span>
                        )}
                      </p>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1">
                      {transaction.fee_amount && (
                        <div className="text-orange-400">
                          Fee: {formatAmount(transaction.fee_amount, transaction.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata section removed as per design request */}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};

