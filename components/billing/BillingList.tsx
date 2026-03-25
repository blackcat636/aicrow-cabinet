'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '@/lib/apiSubscription';
import { balanceApi } from '@/lib/apiBalance';
import { useAuth } from '@/contexts/AuthContext';
import { PlanCard } from './PlanCard';
import { CurrentPlanBlock } from './CurrentPlanBlock';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import type { ActivePlanResponse, SubscriptionPlan } from '@/types/subscription';

interface PendingSubscriptionPayment {
  invoiceId: string;
  amount: number;
  currency: string;
  paymentMethods: string[];
}

export const BillingList: React.FC = () => {
  const t = useTranslations('billing');
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
    return (
      <div className="space-y-5 min-h-[400px]">
        <h2 className="figma-heading-semibold text-[var(--color-secondary-10)]">
          Subscription
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[430px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)]/80 animate-pulse min-w-0"
            />
          ))}
        </div>
      </div>
    );
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
        Subscription
      </h2>

      {showCreditsRemaining && (
        <div className="figma-body-1-regular text-[#9E9E9E]">
          {t('creditsRemainingPrefix')}
          <span className="font-semibold text-[var(--color-secondary-10)]">
            {creditsCount.toLocaleString()}
          </span>
          {t('creditsRemainingSuffix')}
          <span className="inline-flex items-center rounded-md bg-[#757575] px-2.5 py-0.5 text-[16px] font-semibold leading-[1.4] tracking-[0.32px] text-[var(--color-secondary-10)]">
            {activeData?.plan?.name ?? ''}
          </span>
          {t('creditsRemainingPlan')}
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 min-w-0 pt-3">
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
    </div>
  );
};
