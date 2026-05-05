'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '@/lib/apiSubscription';
import { balanceApi } from '@/lib/apiBalance';
import { useAuth } from '@/contexts/AuthContext';
import { PlanCard } from './PlanCard';
import { CurrentPlanBlock } from './CurrentPlanBlock';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';
import { PageLoader } from '@/components/ui/PageLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { resolveLocalizedApiField } from '@/lib/resolve-localized-api-field';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import type {
  ActivePlanResponse,
  SubscriptionHistoryItem,
  SubscriptionPlan
} from '@/types/subscription';

interface PendingSubscriptionPayment {
  invoiceId: string;
  amount: number;
  currency: string;
  paymentMethods: string[];
}

export const BillingList: React.FC = () => {
  const locale = useLocale();
  const t = useTranslations('billing');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user } = useAuth();
  const [activeData, setActiveData] = useState<ActivePlanResponse['data'] | null>(
    null
  );
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [convertingUserPlanId, setConvertingUserPlanId] = useState<number | null>(
    null
  );
  const [balance, setBalance] = useState(0);
  const [pendingPayment, setPendingPayment] =
    useState<PendingSubscriptionPayment | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(20);
  const [historyHasNextPage, setHistoryHasNextPage] = useState(false);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [activeRes, plansRes] = await Promise.all([
        subscriptionApi.getMyActivePlan(),
        subscriptionApi.getAvailablePlans()
      ]);
      setActiveData(activeRes ?? null);
      if (plansRes?.data && Array.isArray(plansRes.data)) {
        setPlans(plansRes.data);
      } else {
        setPlans([]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('loadError');
      setError(message);
      console.error('Billing fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await subscriptionApi.getMyHistory({
          page: historyPage,
          limit: historyLimit,
          eventType: 'purchased'
        });
        const rows = Array.isArray(res.data) ? res.data : [];
        setHistory(rows);
        setHistoryHasNextPage(rows.length >= historyLimit);
        const totalPagesFromMeta =
          typeof res.meta?.totalPages === 'number' && res.meta.totalPages > 0
            ? Math.floor(res.meta.totalPages)
            : null;
        if (totalPagesFromMeta != null) {
          setHistoryTotalPages(totalPagesFromMeta);
        } else {
          setHistoryTotalPages(rows.length >= historyLimit ? historyPage + 1 : historyPage);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('historyLoadError');
        setHistoryError(message);
        setHistory([]);
        setHistoryHasNextPage(false);
        setHistoryTotalPages(1);
      } finally {
        setHistoryLoading(false);
      }
    };
    void fetchHistory();
  }, [historyLimit, historyPage, t]);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await balanceApi.getBalance();
        if (response?.data && response.data.length > 0) {
          const mainBalance = response.data[0];
          setBalance(mainBalance.available_balance);
        }
      } catch {
        setBalance(parseFloat(user?.balance ?? '0'));
      }
    };
    void fetchBalance();
  }, [user?.balance]);

  const handleSubscriptionPaid = useCallback(async () => {
    setPendingPayment(null);
    await fetchData();
    router.push('/billing/success');
  }, [fetchData, router]);

  const handleSubscribe = useCallback(
    async (planId: number, useTrial?: boolean) => {
      setPurchasingPlanId(planId);
      try {
        let result;
        try {
          result = await subscriptionApi.purchasePlan(planId, {
            useTrial: Boolean(useTrial)
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const shouldRetryWithoutTrial =
            Boolean(useTrial) &&
            message.includes(
              'Trial is only available for users without any previous plans'
            );

          if (!shouldRetryWithoutTrial) {
            throw err;
          }

          result = await subscriptionApi.purchasePlan(planId, {
            useTrial: false
          });
        }

        if (result.outcome === 'payment_required') {
          setPendingPayment({
            invoiceId: result.invoiceId,
            amount: result.amount,
            currency: result.currency,
            paymentMethods: result.paymentMethods
          });
          return;
        }
        toast.success(t('purchaseSuccess'));
        await fetchData();
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const isServerError = typeof status === 'number' && status >= 500;
        const message = isServerError
          ? t('purchaseErrorServer')
          : err instanceof Error
            ? err.message
            : t('purchaseError');
        toast.error(message);
      } finally {
        setPurchasingPlanId(null);
      }
    },
    [fetchData, t]
  );

  const handleConvertTrial = useCallback(
    async (userPlanId: number) => {
      setConvertingUserPlanId(userPlanId);
      try {
        const result = await subscriptionApi.convertTrialToPaid(userPlanId);
        if (result.outcome === 'payment_required') {
          setPendingPayment({
            invoiceId: result.invoiceId,
            amount: result.amount,
            currency: result.currency,
            paymentMethods: result.paymentMethods
          });
          return;
        }
        toast.success(t('convertSuccess'));
        await fetchData();
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const isServerError = typeof status === 'number' && status >= 500;
        const message = isServerError
          ? t('purchaseErrorServer')
          : err instanceof Error
            ? err.message
            : t('convertError');
        toast.error(message);
      } finally {
        setConvertingUserPlanId(null);
      }
    },
    [fetchData, t]
  );

  const currentPlanId = activeData?.isActive ? activeData.planId : null;
  const sortedPlans = [...plans].sort((a, b) => {
    const aValue =
      typeof a.price === 'string' ? Number.parseFloat(a.price) : Number(a.price);
    const bValue =
      typeof b.price === 'string' ? Number.parseFloat(b.price) : Number(b.price);
    if (Number.isNaN(aValue) && Number.isNaN(bValue)) return 0;
    if (Number.isNaN(aValue)) return 1;
    if (Number.isNaN(bValue)) return -1;
    return aValue - bValue;
  });

  if (isLoading) {
    return <PageLoader label={tCommon('loading')} />;
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

  const showCreditsRemaining = Boolean(activeData?.isActive && activeData?.plan);
  const creditsCount = balance;

  return (
    <div className="space-y-5 min-h-[400px]">
      <SubscriptionPaymentModal
        isOpen={pendingPayment !== null}
        onClose={() => setPendingPayment(null)}
        invoiceId={pendingPayment?.invoiceId ?? null}
        amount={pendingPayment?.amount ?? 0}
        currency={pendingPayment?.currency ?? 'USD'}
        paymentMethods={pendingPayment?.paymentMethods ?? []}
        onPaid={() => void handleSubscriptionPaid()}
      />

      <CurrentPlanBlock
        activeData={activeData}
        onConvertTrial={handleConvertTrial}
        isConverting={convertingUserPlanId !== null}
      />

      <h2 className="figma-heading-semibold text-[var(--color-secondary-10)]">
        {t('plansSectionTitle')}
      </h2>

      {showCreditsRemaining && (
        <div className="figma-body-1-regular text-[#9E9E9E]">
          {t('creditsRemainingPrefix')}
          <span className="font-semibold text-[var(--color-secondary-10)]">
            {creditsCount.toLocaleString()}
          </span>
          {t('creditsRemainingSuffix')}
          <span className="inline-flex items-center rounded-md bg-[#757575] px-2.5 py-0.5 text-[16px] font-semibold leading-[1.4] tracking-[0.32px] text-[var(--color-secondary-10)]">
            {resolveLocalizedApiField(activeData?.plan?.name, locale)}
          </span>
          {t('creditsRemainingPlan')}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0 pt-3">
        {sortedPlans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlanId={currentPlanId}
            onSubscribe={handleSubscribe}
            isPurchasing={purchasingPlanId === plan.id}
            isMostPopular={sortedPlans.length >= 3 && index === 1}
          />
        ))}
      </div>
      {sortedPlans.length === 0 && (
        <p className="text-gray-400">{t('noPlans')}</p>
      )}

      <div className="space-y-3">
        <h3 className="figma-heading-semibold text-[var(--color-secondary-10)]">
          {t('historyTitle')}
        </h3>
        <p className="text-sm text-[var(--color-secondary-6)]">
          {t('historyExplanation')}
        </p>
        {historyLoading ? (
          <p className="text-sm text-gray-400">{t('historyLoading')}</p>
        ) : historyError ? (
          <p className="text-sm text-red-400">{historyError}</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">{t('historyEmpty')}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)]">
              <table className="w-full min-w-[920px] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-secondary-4)] text-xs text-[var(--color-secondary-6)]">
                    <th className="px-4 py-3 text-left font-medium">{t('historyColPlan')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('historyColActivationDate')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('historyColPrice')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('historyColCurrency')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('historyColPaymentStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const activationDate = item.startDate
                      ? new Date(item.startDate).toLocaleDateString()
                      : '—';
                    const planName =
                      resolveLocalizedApiField(item.plan?.name, locale) ||
                      t('historyPlanFallback');
                    const rawPrice = item.plan?.price ?? item.amount;
                    const priceNum =
                      rawPrice == null
                        ? null
                        : typeof rawPrice === 'string'
                          ? Number.parseFloat(rawPrice)
                          : Number(rawPrice);
                    const price =
                      priceNum == null || Number.isNaN(priceNum)
                        ? t('historyAmountUnknown')
                        : (Math.round(priceNum * 100) / 100).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                    const currency = item.plan?.currency || item.currency || '—';
                    const paymentStatus = item.paymentStatus || '—';
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--color-secondary-4)] last:border-b-0 text-sm text-[var(--color-secondary-9)]"
                      >
                        <td className="px-4 py-3 text-[var(--color-secondary-10)]">{planName}</td>
                        <td className="px-4 py-3">{activationDate}</td>
                        <td className="px-4 py-3">{price}</td>
                        <td className="px-4 py-3">{currency}</td>
                        <td className="px-4 py-3 uppercase">{paymentStatus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-secondary-6)]">
                  {t('historyRowsPerPage')}
                </span>
                <select
                  value={String(historyLimit)}
                  onChange={(e) => {
                    const nextLimit = Number(e.target.value);
                    setHistoryPage(1);
                    setHistoryLimit(nextLimit);
                  }}
                  className="h-9 rounded-[8px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-2 text-sm text-[var(--color-secondary-10)]"
                >
                  {[10, 20, 30, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-sm text-[var(--color-secondary-6)]">
                {t('historyPageOfLabel', {
                  page: historyPage,
                  total: historyTotalPages
                })}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setHistoryPage(1)}
                  disabled={historyPage <= 1 || historyLoading}
                  className="border-[var(--color-secondary-4)] bg-transparent text-[var(--color-secondary-10)]"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage <= 1 || historyLoading}
                  className="border-[var(--color-secondary-4)] bg-transparent text-[var(--color-secondary-10)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="h-9 min-w-9 px-3 inline-flex items-center justify-center rounded-[10px] bg-[var(--color-main)] text-white text-sm font-semibold">
                  {historyPage}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setHistoryPage((p) => p + 1)}
                  disabled={!historyHasNextPage || historyLoading}
                  className="border-[var(--color-secondary-4)] bg-transparent text-[var(--color-secondary-10)]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setHistoryPage(Math.max(1, historyTotalPages))}
                  disabled={!historyHasNextPage || historyLoading}
                  className="border-[var(--color-secondary-4)] bg-transparent text-[var(--color-secondary-10)]"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
