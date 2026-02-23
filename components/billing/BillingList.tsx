'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '@/lib/apiSubscription';
import { balanceApi } from '@/lib/apiBalance';
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { PlanCard } from './PlanCard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { ActivePlanResponse, SubscriptionPlan } from '@/types/subscription';

export const BillingList: React.FC = () => {
  const t = useTranslations('billing');
  const { user } = useAuth();
  const [activeData, setActiveData] = useState<ActivePlanResponse['data'] | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);

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
    fetchData();
  }, [fetchData]);

  // Fetch balance from same API as header (balanceApi.getBalance)
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
    fetchBalance();
  }, [user?.balance]);

  const handleSubscribe = useCallback(
    async (planId: number, useTrial?: boolean) => {
      setPurchasingPlanId(planId);
      try {
        const plan = plans.find((p) => p.id === planId);
        if (!plan) {
          toast.error(t('purchaseError'));
          return;
        }

        const amount =
          typeof plan.price === 'string' ? parseFloat(plan.price) : Number(plan.price);
        const currency = (plan.currency || 'UAH').trim();
        const description = plan.name
          ? `Subscription: ${plan.name}`
          : undefined;

        const localePrefix =
          typeof window !== 'undefined' &&
          typeof window.location?.pathname === 'string' &&
          /^\/(uk|en|fr|es)(\/|$)/.test(window.location.pathname)
            ? window.location.pathname.slice(0, 3)
            : '';
        const baseUrl =
          typeof window !== 'undefined' ? window.location.origin : '';
        const successUrl = `${baseUrl}${localePrefix}/billing/success`;
        const cancelUrl = `${baseUrl}${localePrefix}/billing/cancel`;

        let redirectUrl: string | undefined;
        const invoicePayload = {
          amount,
          currency,
          paymentMethod: 'STRIPE',
          paymentDetails: { successUrl, cancelUrl },
          description
        };
        console.log('[Billing] createInvoice request:', JSON.stringify(invoicePayload, null, 2));

        const res = await balanceApi.createInvoice(invoicePayload);

        console.log('[Billing] createInvoice response:', JSON.stringify(res, null, 2));

        const invoiceData = res?.data as Record<string, unknown> | undefined;
        const invoiceId = invoiceData?.invoice_id as string | undefined;
        if (!invoiceId) {
          throw new Error('No invoice_id in response');
        }

        const payRes = await balanceApi.payInvoice(invoiceId, {
          paymentMethod: 'STRIPE',
          paymentDetails: { successUrl, cancelUrl }
        });

        console.log('[Billing] payInvoice response:', JSON.stringify(payRes, null, 2));

        const payData = payRes?.data as Record<string, unknown> | undefined;
        redirectUrl =
          (payData?.checkoutUrl as string) ??
          (payData?.url as string) ??
          (payData?.checkout_url as string) ??
          (payData?.redirect_url as string) ??
          (payData?.paymentUrl as string) ??
          (payData?.sessionUrl as string) ??
          (payData?.payment_url as string);

        if (redirectUrl && typeof window !== 'undefined') {
          if (redirectUrl.startsWith('/')) {
            redirectUrl = `${API_CONFIG.BASE_URL.replace(/\/$/, '')}${redirectUrl}`;
          }
          window.location.href = redirectUrl;
          return;
        }
        throw new Error('No checkout URL returned by payment API');
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const isServerError = typeof status === 'number' && status >= 500;
        const message = isServerError
          ? t('purchaseErrorServer')
          : (err instanceof Error ? err.message : t('purchaseError'));
        toast.error(message);
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.error('[Billing] Checkout failed:', err);
        }
      } finally {
        setPurchasingPlanId(null);
      }
    },
    [t, plans]
  );

  const currentPlanId = activeData?.isActive ? activeData.planId : null;
  const sortedPlans = [...plans].sort((a, b) => {
    const aValue = typeof a.price === 'string' ? Number.parseFloat(a.price) : Number(a.price);
    const bValue = typeof b.price === 'string' ? Number.parseFloat(b.price) : Number(b.price);
    if (Number.isNaN(aValue) && Number.isNaN(bValue)) return 0;
    if (Number.isNaN(aValue)) return 1;
    if (Number.isNaN(bValue)) return -1;
    return aValue - bValue;
  });

  if (isLoading) {
    return (
      <div className="space-y-5 min-h-[400px]">
        <h2 className="figma-heading-semibold text-[var(--color-secondary-10)]">Subscription</h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[430px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)]/80 animate-pulse min-w-0" />
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
      <h2 className="figma-heading-semibold text-[var(--color-secondary-10)]">Subscription</h2>
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

