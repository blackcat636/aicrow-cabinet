'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { subscriptionApi } from '@/lib/apiSubscription';
import { ActiveSubscriptionData } from '@/types/subscription';
import { resolveLocalizedApiField } from '@/lib/resolve-localized-api-field';

export const useSubscription = () => {
  const locale = useLocale();
  const [activePlan, setActivePlan] = useState<ActiveSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivePlan = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const plan = await subscriptionApi.getMyActivePlan();
        setActivePlan(plan);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
        console.error('[useSubscription] Error fetching active plan:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivePlan();
  }, []);

  return {
    activePlan,
    isLoading,
    error,
    planName: activePlan?.plan?.name
      ? resolveLocalizedApiField(activePlan.plan.name, locale)
      : null,
    isTrial: activePlan?.isTrial || false,
    isActive: activePlan?.isActive || false
  };
};
