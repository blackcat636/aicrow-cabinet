'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BalanceData, Transaction } from '@/types/balance';
import { balanceApi } from '@/lib/apiBalance';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, ChevronDown, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CalendarDetailedIcon, ChevronLeftIcon, ChevronRightIcon, DownloadSquareIcon } from '@/components/icons';
import { BalanceDepositModal } from '@/components/balance/BalanceDepositModal';

interface TransactionHistoryProps {
  balances: BalanceData[];
  onBalancesRefresh?: () => void;
}

interface DateRange {
  start: string | null;
  end: string | null;
}

const PAGE_SIZE = 8;
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value: string, format: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  if (format === 'ДД/ММ/РРРР' || format === 'JJ/MM/AAAA') {
    return `${dd}/${mm}/${yyyy}`;
  }
  return `${mm}/${dd}/${yyyy}`;
};

const formatAmount = (amount: string, precision: string): string => {
  const amountNumber = Number.parseFloat(amount);
  const decimals = Number.parseInt(precision, 10);
  const safeDecimals = Number.isNaN(decimals) ? 2 : Math.max(0, Math.min(8, decimals));
  if (Number.isNaN(amountNumber)) return '0.00';
  return amountNumber.toFixed(safeDecimals);
};

const formatBalance = (amount: string, precision: string): string => {
  const amountNumber = Number.parseFloat(amount);
  const decimals = Number.parseInt(precision, 10);
  const safeDecimals = Number.isNaN(decimals) ? 2 : Math.max(0, Math.min(8, decimals));
  if (Number.isNaN(amountNumber)) return '0.00';
  // Backend stores before/after balances scaled by 100 for rounding safety.
  const normalized = amountNumber / 100;
  return normalized.toFixed(safeDecimals);
};

const formatDateDot = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const normalizeRange = (range: DateRange): DateRange => {
  if (!range.start) return { start: null, end: null };
  if (!range.end) return { start: range.start, end: null };
  if (range.start <= range.end) return range;
  return { start: range.end, end: range.start };
};

const isIsoInRange = (iso: string, range: DateRange): boolean => {
  if (!range.start) return false;
  if (!range.end) return iso === range.start;
  return iso >= range.start && iso <= range.end;
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  balances,
  onBalancesRefresh
}) => {
  const { isLoading: authLoading } = useAuth();
  const t = useTranslations('balance');
  const tDeposit = useTranslations('balance.deposit');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [appliedRange, setAppliedRange] = useState<DateRange>({ start: null, end: null });
  const [pendingRange, setPendingRange] = useState<DateRange>({ start: null, end: null });
  const [page, setPage] = useState(1);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const dateFormat = t('dateFormat') || 'MM/DD/YYYY';

  useEffect(() => {
    if (balances.length > 0 && !selectedCurrencyId) {
      setSelectedCurrencyId(balances[0].currency.id);
    }
  }, [balances, selectedCurrencyId]);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await balanceApi.getTransactions();
      setTransactions(Array.isArray(response?.data?.transactions) ? response.data.transactions : []);
    } catch (err: any) {
      if (err?.status === 404) {
        setTransactions([]);
        setError(null);
      } else {
        setError(err?.message || t('failedToLoadTransactions'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!authLoading) {
      fetchTransactions();
    }
  }, [authLoading, fetchTransactions]);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const onOutsideClick = (event: MouseEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [isCalendarOpen]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (selectedCurrencyId) {
      result = result.filter((tx) => tx.currency?.id === selectedCurrencyId);
    }
    if (appliedRange.start) {
      const normalizedAppliedRange = normalizeRange(appliedRange);
      result = result.filter((tx) => {
        const txDate = new Date(tx.created_at);
        if (Number.isNaN(txDate.getTime())) return false;
        const txIso = txDate.toISOString().slice(0, 10);
        return isIsoInRange(txIso, normalizedAppliedRange);
      });
    }
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((tx) => {
        const reference = tx.reference_id?.toLowerCase() || '';
        const description = tx.description?.toLowerCase() || '';
        return reference.includes(query) || description.includes(query);
      });
    }
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }, [search, selectedCurrencyId, appliedRange, transactions]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCurrencyId, appliedRange]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarMonth),
    [calendarMonth]
  );
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells: Array<{ iso: string; day: number; inCurrentMonth: boolean }> = [];

    for (let i = startWeekday - 1; i >= 0; i -= 1) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({ iso: toIsoDate(d), day: d.getDate(), inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const d = new Date(year, month, day);
      cells.push({ iso: toIsoDate(d), day, inCurrentMonth: true });
    }

    let nextDay = 1;
    while (cells.length < 42) {
      const d = new Date(year, month + 1, nextDay);
      cells.push({ iso: toIsoDate(d), day: nextDay, inCurrentMonth: false });
      nextDay += 1;
    }

    return cells;
  }, [calendarMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const isEmptyState = paginatedTransactions.length === 0;

  const pageItems = useMemo<(number | '...')[]>(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    if (safePage <= 3) return [1, 2, 3, '...', totalPages];
    if (safePage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', safePage, '...', totalPages];
  }, [safePage, totalPages]);

  const calendarButtonLabel = 'Calendar';

  const appliedRangeLabel = useMemo(() => {
    if (!appliedRange.start) return '';
    const normalizedAppliedRange = normalizeRange(appliedRange);
    const { start, end } = normalizedAppliedRange;
    if (!start) return '';
    if (!end) return formatDateDot(start);
    return `${formatDateDot(start)} - ${formatDateDot(end)}`;
  }, [appliedRange]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="h-[74px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="figma-body-1-regular text-[var(--color-secondary-9)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="figma-heading-semibold text-[32px] text-[var(--color-secondary-10)]">
            {t('transactionHistory')}
          </h1>
          <p className="figma-body-1-regular text-[var(--color-secondary-6)]">{t('viewAllTransactions')}</p>
        </div>
        {/*
        <button
          type="button"
          onClick={() => setDepositModalOpen(true)}
          className="shrink-0 h-12 px-5 rounded-[10px] bg-[var(--color-main)] text-white text-[14px] font-semibold tracking-[0.28px] hover:opacity-90 transition-opacity"
        >
          {tDeposit('addFunds')}
        </button>
        */}
      </div>

      <BalanceDepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        balances={balances}
        onDepositSuccess={onBalancesRefresh}
      />

      <div className="flex flex-row gap-3 pt-1">
        <div className="relative w-full md:w-[446px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full h-12 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] pl-4 pr-14 figma-body-2-medium text-[var(--color-secondary-9)] placeholder:text-[var(--color-secondary-6)]"
          />
          <div className="absolute right-12 top-2 h-8 w-px bg-[var(--color-secondary-4)]" />
          <Search className="absolute right-4 top-3 h-6 w-6 text-[var(--color-secondary-6)]" />
        </div>

        <div className="relative w-[72px] md:w-[147px]" ref={calendarRef}>
          <button
            type="button"
            onClick={() => {
              setPendingRange(appliedRange);
              setIsCalendarOpen((prev) => !prev);
            }}
            className="w-full h-12 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] px-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-[5px]">
              <CalendarDetailedIcon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-9)] font-medium">
                {calendarButtonLabel}
              </span>
            </div>
            <div className="flex items-center gap-[5px]">
              <ChevronDown className="h-5 w-5 text-[var(--color-secondary-6)]" />
            </div>
          </button>

          {isCalendarOpen && (
            <div className="absolute right-0 top-[56px] z-50 w-[288px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] shadow-[0px_0px_7px_0px_rgba(255,255,255,0.04)]">
              <div className="h-[54px] px-6 flex items-center justify-between border-b border-[var(--color-secondary-4)]">
                <p className="text-[32px] hidden" />
                <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">
                  {monthLabel}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }
                    className="text-[var(--color-secondary-10)]"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }
                    className="text-[var(--color-secondary-10)]"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-b border-[var(--color-secondary-4)]">
                <div className="grid grid-cols-7 gap-y-4 text-center">
                  {WEEKDAYS.map((weekday, weekdayIndex) => (
                    <div key={`${weekday}-${weekdayIndex}`} className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">
                      {weekday}
                    </div>
                  ))}
                  {calendarDays.map((day) => {
                    const normalizedPendingRange = normalizeRange(pendingRange);
                    const selected = isIsoInRange(day.iso, normalizedPendingRange);
                    const isFutureDay = day.iso > todayIso;
                    return (
                      <button
                        key={day.iso}
                        type="button"
                        disabled={isFutureDay}
                        onClick={() =>
                          isFutureDay
                            ? undefined
                            : setPendingRange((prev) => {
                                if (!prev.start || prev.end) {
                                  return { start: day.iso, end: null };
                                }
                                if (day.iso < prev.start) {
                                  return { start: day.iso, end: prev.start };
                                }
                                return { start: prev.start, end: day.iso };
                              })
                        }
                        className={`h-[30px] rounded-[10px] text-[16px] leading-[1.4] tracking-[0.32px] ${
                          isFutureDay
                            ? 'text-[var(--color-secondary-5)] opacity-45 cursor-not-allowed'
                            : selected
                            ? 'bg-[var(--color-main)] text-white'
                            : day.inCurrentMonth
                            ? 'text-[var(--color-secondary-6)]'
                            : 'text-[var(--color-secondary-5)]'
                        }`}
                      >
                        {day.day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingRange({ start: null, end: null });
                      setAppliedRange({ start: null, end: null });
                      setIsCalendarOpen(false);
                    }}
                    className="h-[48px] px-4 rounded-[10px] border border-[var(--color-secondary-4)] text-[var(--color-secondary-9)] text-[14px] leading-[1.4] tracking-[0.28px] font-semibold"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedRange(normalizeRange(pendingRange));
                      setIsCalendarOpen(false);
                    }}
                    className="h-[48px] w-[129px] rounded-[10px] bg-[var(--color-main)] text-white text-[14px] leading-[1.4] tracking-[0.28px] font-semibold"
                  >
                    Apply Now
                  </button>
                </div>
                <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)] opacity-80">
                  *Choose start and end date
                </p>
              </div>
            </div>
          )}
        </div>

        {balances.length > 1 && (
          <select
            value={selectedCurrencyId || ''}
            onChange={(e) => setSelectedCurrencyId(Number(e.target.value))}
            className="hidden md:block w-[190px] h-12 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] px-4 figma-body-2-medium text-[var(--color-secondary-9)]"
          >
            {balances.map((balance) => (
              <option key={balance.currency.id} value={balance.currency.id}>
                {balance.currency.code}
              </option>
            ))}
          </select>
        )}
      </div>

      {appliedRange.start && (
        <div className="flex items-center gap-4">
          <div className="h-[36px] rounded-[47px] border border-[var(--color-secondary-4)] px-3 flex items-center gap-2">
            <span className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-10)] font-medium">
              {appliedRangeLabel}
            </span>
            <button
              type="button"
              onClick={() => {
                setAppliedRange({ start: null, end: null });
                setPendingRange({ start: null, end: null });
                setIsCalendarOpen(false);
              }}
              className="text-[var(--color-secondary-6)] hover:text-[var(--color-secondary-10)]"
              aria-label="Clear selected dates"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setAppliedRange({ start: null, end: null });
              setPendingRange({ start: null, end: null });
              setIsCalendarOpen(false);
            }}
            className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-main)] font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="space-y-3">
        {isEmptyState ? (
          <div className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-6 py-10 md:py-14 text-center">
            <p className="figma-body-2-semibold text-[var(--color-secondary-10)]">{t('noTransactions')}</p>
            <p className="mt-2 text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)]">
              {t('noTransactionsDescription')}
            </p>
          </div>
        ) : (
          paginatedTransactions.map((transaction) => {
            const statusLabel = transaction.status?.toUpperCase() || 'UNKNOWN';
            const typeSign = transaction.type === 'DEPOSIT' ? '+' : transaction.type === 'WITHDRAWAL' ? '-' : '';
            const amountNum = Number.parseFloat(String(transaction.amount));
            const formattedAmount = formatAmount(transaction.amount, transaction.currency?.precision || '2');
            // Avoid double minus: if amount is already negative, don't add typeSign
            const displayAmount = amountNum < 0 ? formattedAmount : `${typeSign}${formattedAmount}`;
            return (
              <div key={transaction.id} className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-4 md:h-[74px] md:px-4 md:py-2">
                <div className="hidden md:flex items-center justify-between gap-4">
                  <div className="flex items-center gap-[10px] min-w-0 w-[44%]">
                    <DownloadSquareIcon className="shrink-0" />
                    <div className="min-w-0">
                      <p className="figma-body-2-semibold text-[var(--color-secondary-10)] truncate">
                        {transaction.description || 'Administrative deposit'}
                      </p>
                      <p className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)] truncate">
                        {t('reference')}: {transaction.reference_id || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center h-7 rounded-[47px] bg-[var(--color-secondary-4)] px-3">
                    <span className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)] font-semibold">
                      {statusLabel}
                    </span>
                  </div>

                  <p className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)]">
                    {t('currency')}: {transaction.currency?.code || '—'}
                  </p>

                  <p className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)]">
                    {formatDate(transaction.created_at, dateFormat)}
                  </p>

                  <div className="text-right min-w-[160px]">
                    <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-10)] font-semibold">
                      {displayAmount} {transaction.currency?.code || ''}
                    </p>
                    <p className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)]">
                      {t('balance')}: {formatBalance(transaction.balance_before || '0', transaction.currency?.precision || '2')} -&gt; {formatBalance(transaction.balance_after || '0', transaction.currency?.precision || '2')}
                    </p>
                  </div>
                </div>

                <div className="md:hidden flex flex-col gap-4">
                  <div className="flex items-center gap-[10px]">
                    <DownloadSquareIcon className="shrink-0" />
                    <div className="min-w-0">
                      <p className="figma-body-2-semibold text-[var(--color-secondary-10)] truncate">
                        {transaction.description || 'Administrative deposit'}
                      </p>
                      <p className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)] truncate">
                        {transaction.reference_id || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="h-7 rounded-[47px] bg-[var(--color-secondary-4)] px-3 flex items-center">
                      <span className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)] font-semibold">
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)]">
                      {t('currency')}: {transaction.currency?.code || '—'}
                    </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-10)] font-semibold">
                        {displayAmount} {transaction.currency?.code || ''}
                      </p>
                      <p className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)]">
                        {t('balance')}: {formatBalance(transaction.balance_before || '0', transaction.currency?.precision || '2')} -&gt; {formatBalance(transaction.balance_after || '0', transaction.currency?.precision || '2')}
                      </p>
                    </div>
                    <p className="text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)]">
                      {formatDate(transaction.created_at, dateFormat)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={`hidden md:flex items-center justify-center gap-4 pt-2 ${isEmptyState ? 'invisible pointer-events-none' : ''}`}>
        <button
          type="button"
          className="h-[52px] px-2 text-[14px] font-semibold tracking-[0.28px] text-white disabled:opacity-40"
          disabled={safePage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        {pageItems.map((item, index) =>
          item === '...' ? (
            <div key={`dots-${index}`} className="h-[52px] w-[52px] rounded-[6px] border border-[var(--color-secondary-4)] flex items-center justify-center text-[var(--color-secondary-5)]">
              ...
            </div>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => setPage(item)}
              className={`h-[52px] w-[52px] rounded-[6px] border text-[16px] tracking-[0.32px] ${
                item === safePage
                  ? 'border-[var(--color-main)] text-[var(--color-main)]'
                  : 'border-[var(--color-secondary-4)] text-[#BCBCBC]'
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          className="h-[52px] px-2 text-[14px] font-semibold tracking-[0.28px] text-white disabled:opacity-40"
          disabled={safePage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
};

