'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '@/lib/apiSubscription';
import { CurrentPlanBlock } from './CurrentPlanBlock';
import { PlanCard } from './PlanCard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { ActivePlanResponse, SubscriptionPlan } from '@/types/subscription';

export const BillingList: React.FC = () => {
  const t = useTranslations('billing');
  const [activeData, setActiveData] = useState<ActivePlanResponse['data'] | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

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

  const handleSubscribe = useCallback(
    async (planId: number, useTrial?: boolean) => {
      setPurchasingPlanId(planId);
      try {
        await subscriptionApi.purchasePlan(planId, { useTrial: useTrial ?? false });
        toast.success(t('purchaseSuccess'));
        await fetchData();
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const isServerError = typeof status === 'number' && status >= 500;
        const message = isServerError
          ? t('purchaseErrorServer')
          : (err instanceof Error ? err.message : t('purchaseError'));
        toast.error(message);
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.error('[Billing] Purchase failed:', err);
        }
      } finally {
        setPurchasingPlanId(null);
      }
    },
    [t, fetchData]
  );

  const handleConvertTrial = useCallback(
    async (userPlanId: number) => {
      setIsConverting(true);
      try {
        await subscriptionApi.convertTrialToPaid(userPlanId);
        toast.success(t('convertSuccess'));
        await fetchData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('convertError');
        toast.error(message);
      } finally {
        setIsConverting(false);
      }
    },
    [t, fetchData]
  );

  const currentPlanId = activeData?.isActive ? activeData.planId : null;

  if (isLoading) {
    return (
      <div className="space-y-6 min-h-[400px]">
        <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm animate-pulse">
          <div className="h-32 rounded-lg bg-gray-700/50 m-6" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-lg border border-gray-700 bg-gray-700/30 animate-pulse min-w-0" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-[#141519] border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('loadingError')}</h3>
          <p className="text-gray-400 text-center mb-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 min-h-[400px]">
      <CurrentPlanBlock
        activeData={activeData}
        onConvertTrial={handleConvertTrial}
        isConverting={isConverting}
      />

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">{t('availablePlans')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={currentPlanId}
              onSubscribe={handleSubscribe}
              isPurchasing={purchasingPlanId === plan.id}
            />
          ))}
        </div>
        {plans.length === 0 && (
          <p className="text-gray-400">{t('noPlans')}</p>
        )}
      </div>
    </div>
  );
};

