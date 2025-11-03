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

  // Set default currency when balances are loaded
  useEffect(() => {
    console.log('🔄 [TransactionHistory] Balances updated:', {
      balancesCount: balances.length,
      balances: balances.map(b => ({ id: b.currency.id, code: b.currency.code, name: b.currency.name })),
      currentSelectedCurrencyId: selectedCurrencyId
    });
    
    if (balances.length > 0 && !selectedCurrencyId) {
      const firstCurrencyId = balances[0].currency.id;
      console.log('🎯 [TransactionHistory] Setting default currency:', {
        currencyId: firstCurrencyId,
        currencyName: balances[0].currency.name
      });
      setSelectedCurrencyId(firstCurrencyId);
    }
  }, [balances, selectedCurrencyId]);

  // Fetch transactions when user is available (we'll filter by currency on client side)
  useEffect(() => {
    if (user?.id) {
      console.log('💫 [TransactionHistory] User available, fetching transactions:', {
        userId: user.id,
        selectedCurrencyId
      });
      fetchTransactions();
    } else {
      console.log('⏸️ [TransactionHistory] Waiting for user ID');
    }
  }, [user?.id]);
  
  // Filter transactions by selected currency
  const filteredTransactions = useMemo(() => {
    if (!selectedCurrencyId) {
      return transactions;
    }
    const filtered = transactions.filter(t => t.currency && t.currency.id === selectedCurrencyId);
    console.log('🔍 [TransactionHistory] Filtering transactions:', {
      selectedCurrencyId,
      totalTransactions: transactions.length,
      filteredCount: filtered.length
    });
    return filtered;
  }, [transactions, selectedCurrencyId]);

  const fetchTransactions = async () => {
    if (!user?.id) {
      console.error('❌ [TransactionHistory] No user ID available');
      setError('User ID not available');
      return;
    }

    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    console.log('🚀 [TransactionHistory] fetchTransactions called:', {
      userId,
      userStringId: user.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('⏳ [TransactionHistory] Loading started for user:', userId);

      const response = await balanceApi.getTransactions(userId);
      console.log('📥 [TransactionHistory] Response received:', {
        status: response.status,
        hasData: !!response.data,
        dataIsArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : (response.data ? 1 : 0)
      });

      if (response.status === 200 && response.data) {
        // Response data is now always an array (normalized in apiBalance)
        let transactionData = Array.isArray(response.data) ? response.data : [response.data];
        
        // Filter transactions by selected currency if available
        if (selectedCurrencyId) {
          const beforeFilter = transactionData.length;
          transactionData = transactionData.filter(
            t => t.currency && t.currency.id === selectedCurrencyId
          );
          console.log('🔍 [TransactionHistory] Filtered transactions by currency:', {
            selectedCurrencyId,
            beforeFilter,
            afterFilter: transactionData.length
          });
        }
        
        console.log('✅ [TransactionHistory] Setting transactions:', {
          count: transactionData.length,
          transactions: transactionData.map(t => ({
            id: t.id,
            type: t.type,
            status: t.status,
            amount: t.amount,
            currencyId: t.currency?.id,
            createdAt: t.created_at
          }))
        });
        setTransactions(transactionData);
      } else {
        console.error('❌ [TransactionHistory] Invalid response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ [TransactionHistory] Error fetching transactions:', {
        error: err,
        message: err.message,
        status: err.status,
        userId: user?.id,
        stack: err.stack
      });
      
      // If 404, it might mean no transactions exist - show empty state instead of error
      if (err.status === 404) {
        console.log('ℹ️ [TransactionHistory] 404 - treating as no transactions');
        setTransactions([]);
        setError(null);
      } else {
        setError(err.message || 'Failed to load transactions');
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 [TransactionHistory] Loading finished for user:', user?.id);
    }
  };

  // Format amount with currency symbol
  const formatAmount = (amount: string, currency: Transaction['currency']) => {
    const numAmount = parseFloat(amount);
    const precision = parseFloat(currency.precision);
    return numAmount.toFixed(precision);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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

  return (
    <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
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
      <CardContent className="px-6 pb-6">
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
                className="p-5 bg-black/40 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
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
                  <div className="flex-shrink-0 text-right">
                    <div className="mb-2">
                      <p
                        className={`text-2xl font-bold ${
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
                      <div>
                        Before: {formatAmount(transaction.balance_before, transaction.currency)}
                      </div>
                      <div>
                        After: {formatAmount(transaction.balance_after, transaction.currency)}
                      </div>
                      {transaction.fee_amount && (
                        <div className="text-orange-400">
                          Fee: {formatAmount(transaction.fee_amount, transaction.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata section (if available) */}
                {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <details className="group">
                      <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                        View Details
                      </summary>
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {Object.entries(transaction.metadata).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};

