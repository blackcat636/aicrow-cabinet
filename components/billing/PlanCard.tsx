'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SubscriptionPlan, PlanFeature } from '@/types/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  /** ID of the user's current active plan (planId). */
  currentPlanId: number | null;
  onSubscribe: (planId: number, useTrial?: boolean) => void;
  isPurchasing?: boolean;
  isMostPopular?: boolean;
}

const formatAmountValue = (
  price: string | number | undefined,
): number | null => {
  if (price == null) return null;
  const num = typeof price === 'string' ? parseFloat(price) : Number(price);
  if (Number.isNaN(num) || num < 0) return null;
  return num;
};

const formatCurrencyPrefix = (currency: string | undefined): string => {
  const code = (currency || 'USD').toUpperCase();
  if (code === 'CAD') return 'C$';
  if (code === 'USD') return '$';
  if (code === 'EUR') return 'EUR ';
  if (code === 'UAH') return 'UAH ';
  return `${code} `;
};

const formatAmount = (value: number | null, currency: string | undefined): string => {
  if (value == null) return '—';
  const rounded = Math.round(value * 100) / 100;
  const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
  const grouped = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formatCurrencyPrefix(currency)}${grouped}`;
};

const getFeatureLabel = (f: PlanFeature): string => {
  if (typeof f === 'string') return f;
  if (f?.name) return f.name;
  if (f?.key) return String(f.key);
  return '—';
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlanId,
  onSubscribe,
  isPurchasing = false,
  isMostPopular = false
}) => {
  const t = useTranslations('billing');

  const isCurrent = currentPlanId !== null && currentPlanId === plan.id;
  const hasTrial = plan.trialDays != null && plan.trialDays > 0;
  const features = Array.isArray(plan.features) ? plan.features : [];

  const setupPrice = formatAmount(formatAmountValue(plan.price), plan.currency);
  const supportPriceRaw = (plan as SubscriptionPlan & { supportPrice?: string | number }).supportPrice;
  const supportPrice = formatAmount(
    formatAmountValue(supportPriceRaw ?? plan.price),
    plan.currency
  );

  return (
    <div className="relative min-w-0 flex flex-col">
      {isMostPopular && (
        <div className="absolute -top-[22px] left-0 right-0 h-[22px] rounded-t-[10px] bg-[var(--color-main)] flex items-center justify-center gap-1">
          <span className="text-[11px] leading-[1.4] tracking-[0.22px] text-white">★</span>
          <span className="text-[14px] leading-[1.4] tracking-[0.28px] text-white">Most popular</span>
        </div>
      )}
      <Card
        className="relative w-full bg-[var(--color-secondary-2)] border border-[var(--color-secondary-4)] rounded-[10px] h-full overflow-hidden group flex flex-col"
      >
        <div className="relative z-10 flex flex-col flex-1 min-w-0">
          <CardHeader className="p-4 pb-3">
            <div className="space-y-1">
              <h3 className="figma-heading-medium text-[var(--color-secondary-10)] uppercase">
                {plan.name}
              </h3>
              <p className="figma-body-1-medium text-[var(--color-secondary-5)]">
                Setup from <span className="figma-heading-medium text-[var(--color-secondary-10)]">{setupPrice}</span> /one-time
              </p>
              <p className="figma-body-1-medium text-[var(--color-secondary-5)]">
                Support from <span className="figma-heading-medium text-[var(--color-secondary-10)]">{supportPrice}</span> /monthly
              </p>
            </div>
          </CardHeader>
          <CardFooter className="px-4 pt-0 pb-4">
            <Button
              className="w-full h-12 rounded-[10px] border border-[var(--color-main)] bg-transparent figma-body-1-semibold text-[var(--color-main)] hover:bg-[var(--color-main)] hover:text-[var(--color-secondary-10)] transition-colors"
              onClick={() => onSubscribe(plan.id, hasTrial)}
              disabled={isPurchasing || isCurrent}
            >
              {isCurrent ? t('current') : isPurchasing ? t('processing') : t('subscribe')}
            </Button>
          </CardFooter>
          <div className="h-px bg-[var(--color-secondary-4)] w-full" />
          <CardContent className="flex-1 px-4 py-4">
            {features.length > 0 && (
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 min-w-0">
                    <Camera className="w-4 h-4 text-[var(--color-secondary-10)] flex-shrink-0" strokeWidth={1.75} />
                    <span className="figma-body-3-regular text-[var(--color-secondary-10)] break-words">
                      {getFeatureLabel(f)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
};
