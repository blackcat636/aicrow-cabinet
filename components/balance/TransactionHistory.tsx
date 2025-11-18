'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, BalanceData, Pagination } from '@/types/balance';
import { balanceApi } from '@/lib/apiBalance';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowUpCircle, ArrowDownCircle, Loader2, Search, Calendar, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TransactionHistoryProps {
  balances: BalanceData[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ balances }) => {
  const { isLoading: authLoading } = useAuth();
  const t = useTranslations('balance');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [dateFromNative, setDateFromNative] = useState<string>('');
  const [dateToNative, setDateToNative] = useState<string>('');
  const [amountSearch, setAmountSearch] = useState<string>('');

  // Get date format from translations (JJ/MM/AAAA for French, MM/DD/YYYY for others)
  const dateFormat = t('dateFormat') || 'MM/DD/YYYY';
  const isFrenchFormat = dateFormat === 'JJ/MM/AAAA' || dateFormat.includes('JJ') || dateFormat.includes('DD');

  // Convert YYYY-MM-DD to locale-specific format (JJ/MM/AAAA or MM/DD/YYYY)
  const formatToDisplay = (value: string): string => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      if (isFrenchFormat) {
        // French format: JJ/MM/AAAA
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        // US format: MM/DD/YYYY
        return `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
    }
    return value;
  };

  // Convert locale-specific format to YYYY-MM-DD
  const formatToNative = (value: string): string => {
    if (!value) return '';
    const parts = value.split('/');
    if (parts.length === 3) {
      if (isFrenchFormat) {
        // French format: JJ/MM/AAAA -> YYYY-MM-DD
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      } else {
        // US format: MM/DD/YYYY -> YYYY-MM-DD
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    return value;
  };

  // Parse locale-specific format to Date object
  const parseDateInput = (value: string): Date | null => {
    if (!value) return null;
    
    const parts = value.split('/');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      let month: number, day: number, year: number;
      
      if (isFrenchFormat) {
        // French format: JJ/MM/AAAA
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        year = parseInt(parts[2], 10);
      } else {
        // US format: MM/DD/YYYY
        month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
      
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 1900) {
        const date = new Date(year, month, day);
        if (date.getMonth() === month && date.getDate() === day && date.getFullYear() === year) {
          return date;
        }
      }
    }
    
    // Try YYYY-MM-DD format (from native date input)
    const isoParts = value.split('-');
    if (isoParts.length === 3) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  };

  // Handle native date input change (from calendar)
  const handleDateFromNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateFromNative(value);
    setDateFrom(formatToDisplay(value));
  };

  const handleDateToNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateToNative(value);
    setDateTo(formatToDisplay(value));
  };

  // Format date input to locale-specific format
  const formatDateInput = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    if (isFrenchFormat) {
      // French format: JJ/MM/AAAA
      if (digits.length <= 2) {
        return digits;
      } else if (digits.length <= 4) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
      }
    } else {
      // US format: MM/DD/YYYY
      if (digits.length <= 2) {
        return digits;
      } else if (digits.length <= 4) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
      }
    }
  };

  // Handle text input change (manual entry)
  const handleDateFromTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    if (formatted.length <= 10) {
      setDateFrom(formatted);
      const native = formatToNative(formatted);
      if (native && native.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setDateFromNative(native);
      }
    }
  };

  const handleDateToTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    if (formatted.length <= 10) {
      setDateTo(formatted);
      const native = formatToNative(formatted);
      if (native && native.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setDateToNative(native);
      }
    }
  };

  useEffect(() => {
    if (balances.length > 0 && !selectedCurrencyId) {
      setSelectedCurrencyId(balances[0].currency.id);
    }
  }, [balances, selectedCurrencyId]);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // API uses token-based authentication to determine user
      const response = await balanceApi.getTransactions();

      if (response.status === 200 && response.data) {
        // Extract transactions and pagination from the new response structure
        const transactionData = response.data.transactions || [];
        const paginationData = response.data.pagination || null;
        
        // Filter by currency if selected
        const filtered = selectedCurrencyId
          ? transactionData.filter(
              t => t.currency && t.currency.id === selectedCurrencyId
            )
          : transactionData;
        
        setTransactions(filtered);
        setPagination(paginationData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      if (err.status === 404) {
        setTransactions([]);
        setError(null);
      } else {
        setError(err.message || t('failedToLoadTransactions'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCurrencyId, t]);

  useEffect(() => {
    // Wait for auth to finish loading before making request
    if (authLoading) {
      return;
    }
    
    // API uses token-based authentication to determine user
    fetchTransactions();
  }, [fetchTransactions, authLoading]);
  
  // Format amount with currency symbol
  const formatAmount = (amount: string, currency: Transaction['currency']) => {
    const numAmount = parseFloat(amount);
    const precision = parseFloat(currency.precision);
    return numAmount.toFixed(precision);
  };

  // Format balance (divide by 100 to convert from stored format, e.g., 70100 -> 701.00)
  const formatBalance = (amount: string, currency: Transaction['currency']) => {
    const numAmount = parseFloat(amount);
    const convertedAmount = numAmount / 100;
    return convertedAmount.toFixed(2);
  };

  // Filter transactions by selected currency, date range, and amount
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by currency
    if (selectedCurrencyId) {
      filtered = filtered.filter(t => t.currency && t.currency.id === selectedCurrencyId);
    }

    // Filter by date range
    if (dateFromNative || dateFrom) {
      const fromDate = parseDateInput(dateFromNative || dateFrom);
      if (fromDate) {
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.created_at);
          transactionDate.setHours(0, 0, 0, 0);
          return transactionDate >= fromDate;
        });
      }
    }

    if (dateToNative || dateTo) {
      const toDate = parseDateInput(dateToNative || dateTo);
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate <= toDate;
        });
      }
    }

    // Filter by amount search
    if (amountSearch.trim()) {
      const searchValue = amountSearch.trim().toLowerCase();
      filtered = filtered.filter(t => {
        const formattedAmount = formatAmount(t.amount, t.currency);
        return formattedAmount.includes(searchValue) || t.amount.toLowerCase().includes(searchValue);
      });
    }

    return filtered;
  }, [transactions, selectedCurrencyId, dateFrom, dateTo, amountSearch, formatAmount]);

  // Format date: mm/dd/yyyy
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    // Use locale-specific format from translations
    const dateFormat = t('dateFormat') || 'DD/MM/YYYY';
    if (dateFormat === 'JJ/MM/AAAA' || dateFormat.includes('DD') || dateFormat.includes('JJ')) {
      // French format: JJ/MM/AAAA
      return `${dd}/${mm}/${yyyy}`;
    }
    // Default: MM/DD/YYYY
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

  // Get translated transaction type
  const getTranslatedType = (type: string): string => {
    const translated = t(`transactionTypes.${type}` as any);
    return translated && translated !== `transactionTypes.${type}` ? translated : type;
  };

  // Get translated transaction status
  const getTranslatedStatus = (status: string): string => {
    const translated = t(`transactionStatuses.${status}` as any);
    return translated && translated !== `transactionStatuses.${status}` ? translated : status;
  };

  // Get translated transaction description
  const getTranslatedDescription = (description: string): string => {
    const translated = t(`transactionDescriptions.${description}` as any);
    return translated && translated !== `transactionDescriptions.${description}` ? translated : description;
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
            <p className="text-gray-300">{t('loadingTransactionHistory')}</p>
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
            <h3 className="text-lg font-semibold mb-2 text-white">{t('loadingError')}</h3>
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
            <CardTitle className="text-2xl font-bold text-white">{t('transactionHistory')}</CardTitle>
            <p className="text-gray-400 mt-1">{t('viewAllTransactions')}</p>
          </div>
          {balances.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">{t('currency')}:</label>
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
      
      {/* Filters Section */}
      <div className="px-6 pb-4 relative z-10 border-b border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Amount Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchByAmount')}
              value={amountSearch}
              onChange={(e) => setAmountSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
            />
            {amountSearch && (
              <button
                onClick={() => setAmountSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Range Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              {/* Calendar icon button */}
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('date-from-picker') as HTMLInputElement;
                  if (input) {
                    // Temporarily enable pointer events to allow calendar to open
                    input.style.pointerEvents = 'auto';
                    // Try showPicker() first (modern browsers)
                    if (typeof input.showPicker === 'function') {
                      try {
                        const pickerResult = input.showPicker();
                        // Check if it returns a Promise
                        if (pickerResult !== undefined && pickerResult !== null && typeof (pickerResult as any).catch === 'function') {
                          (pickerResult as any).catch(() => {
                            // If showPicker fails, try click
                            input.click();
                          });
                        }
                      } catch (error) {
                        // If showPicker throws, fallback to click
                        input.click();
                      }
                    } else {
                      // Fallback: trigger click on the input
                      input.click();
                    }
                    // Disable pointer events after a short delay
                    setTimeout(() => {
                      input.style.pointerEvents = 'none';
                    }, 100);
                  }
                }}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors z-20 cursor-pointer"
                title={t('openCalendar')}
              >
                <Calendar className="w-4 h-4" />
              </button>
              {/* Hidden native date picker for calendar - positioned absolutely to match the visible input */}
              <input
                type="date"
                value={dateFromNative}
                onChange={handleDateFromNativeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="date-from-picker"
                style={{ pointerEvents: 'none' }}
              />
              {/* Display input in locale-specific format */}
              <input
                type="text"
                value={dateFrom}
                onChange={handleDateFromTextChange}
                placeholder={t('dateFormat') || 'MM/DD/YYYY'}
                maxLength={10}
                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 relative z-0"
              />
              {dateFrom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateFrom('');
                    setDateFromNative('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-30"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative flex-1">
              {/* Calendar icon button */}
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('date-to-picker') as HTMLInputElement;
                  if (input) {
                    // Temporarily enable pointer events to allow calendar to open
                    input.style.pointerEvents = 'auto';
                    // Try showPicker() first (modern browsers)
                    if (typeof input.showPicker === 'function') {
                      try {
                        const pickerResult = input.showPicker();
                        // Check if it returns a Promise
                        if (pickerResult !== undefined && pickerResult !== null && typeof (pickerResult as any).catch === 'function') {
                          (pickerResult as any).catch(() => {
                            // If showPicker fails, try click
                            input.click();
                          });
                        }
                      } catch (error) {
                        // If showPicker throws, fallback to click
                        input.click();
                      }
                    } else {
                      // Fallback: trigger click on the input
                      input.click();
                    }
                    // Disable pointer events after a short delay
                    setTimeout(() => {
                      input.style.pointerEvents = 'none';
                    }, 100);
                  }
                }}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors z-20 cursor-pointer"
                title={t('openCalendar')}
              >
                <Calendar className="w-4 h-4" />
              </button>
              {/* Hidden native date picker for calendar - positioned absolutely to match the visible input */}
              <input
                type="date"
                value={dateToNative}
                onChange={handleDateToNativeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="date-to-picker"
                style={{ pointerEvents: 'none' }}
              />
              {/* Display input in locale-specific format */}
              <input
                type="text"
                value={dateTo}
                onChange={handleDateToTextChange}
                placeholder={t('dateFormat') || 'MM/DD/YYYY'}
                maxLength={10}
                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 relative z-0"
              />
              {dateTo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateTo('');
                    setDateToNative('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-30"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Clear All Filters Button */}
          {(dateFrom || dateTo || amountSearch) && (
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setDateFromNative('');
                setDateToNative('');
                setAmountSearch('');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              {t('clear')}
            </button>
          )}
        </div>
      </div>

      <CardContent className="px-6 pb-6 relative z-10">
        {!selectedCurrencyId ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">{t('noCurrencySelected')}</h3>
            <p className="text-gray-300">{t('selectCurrencyToView')}</p>
          </div>
        ) : sortedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">{t('noTransactionsFound')}</h3>
            <p className="text-gray-300">
              {t('noTransactionsForCurrency', { currency: selectedCurrency?.currency.name || t('thisCurrency') })}
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
                          {getTranslatedType(transaction.type)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(transaction.status)} border text-xs font-semibold`}
                        >
                          {getTranslatedStatus(transaction.status)}
                        </Badge>
                      </div>

                      <p className="text-white font-medium mb-1">{getTranslatedDescription(transaction.description)}</p>

                      {transaction.reference_id && (
                        <p className="text-xs text-gray-400 mb-2">
                          {t('reference')}: <span className="font-mono">{transaction.reference_id}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-2 flex-wrap">
                        <span>{formatDate(transaction.created_at)}</span>
                        {transaction.currency && (
                          <span className="flex items-center gap-1">
                            {t('currency')}: {transaction.currency.code}
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
                          {t('fee')}: {formatAmount(transaction.fee_amount, transaction.currency)}
                        </div>
                      )}
                      {transaction.balance_before && transaction.balance_after && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                          <div className="text-gray-500">
                            {t('balance')}: {formatBalance(transaction.balance_before, transaction.currency)} → {formatBalance(transaction.balance_after, transaction.currency)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata section removed as per design request */}
              </div>
            ))}
            
            {/* Pagination info */}
            {(pagination || dateFrom || dateTo || amountSearch) && (
              <div className="mt-6 pt-4 border-t border-gray-700/50 text-center text-sm text-gray-400">
                {dateFrom || dateTo || amountSearch ? (
                  <div>
                    {t('showingTransactions', { count: sortedTransactions.length, total: transactions.length })}
                    {(dateFrom || dateTo || amountSearch) && (
                      <span className="ml-2 text-purple-400">({t('filtered')})</span>
                    )}
                  </div>
                ) : (
                  pagination && pagination.total > 0 && (
                    <div>
                      {t('showingTransactions', { count: sortedTransactions.length, total: pagination.total })}
                      {pagination.pages > 1 && (
                        <span className="ml-2">({t('page')} {pagination.page} {t('of')} {pagination.pages})</span>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </div>
  );
};

