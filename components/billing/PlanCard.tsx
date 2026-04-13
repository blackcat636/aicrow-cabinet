'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { SubscriptionPlan, PlanFeature } from '@/types/subscription';
import { formatPlanDescriptionForDisplay } from '@/lib/format-plan-description';
import { resolveLocalizedApiField } from '@/lib/resolve-localized-api-field';

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

const formatAmount = (value: number | null): string => {
  if (value == null) return '—';
  const rounded = Math.round(value * 100) / 100;
  const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
  const grouped = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return grouped;
};

const getFeatureLabel = (f: PlanFeature, locale: string): string => {
  if (typeof f === 'string') return f;
  const fromName = f?.name != null ? resolveLocalizedApiField(f.name, locale) : '';
  if (fromName !== '') return fromName;
  const fromKey = f?.key != null ? resolveLocalizedApiField(f.key, locale) : '';
  if (fromKey !== '') return fromKey;
  return '—';
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlanId,
  onSubscribe,
  isPurchasing = false,
  isMostPopular = false
}) => {
  const locale = useLocale();
  const t = useTranslations('billing');
  const planName = resolveLocalizedApiField(plan.name, locale);
  const periodResolved = resolveLocalizedApiField(plan.period, locale);
  const period = periodResolved.toLowerCase();
  const periodLabel =
    period === 'monthly'
      ? t('periodMonthly')
      : period === 'yearly'
        ? t('periodYearly')
        : periodResolved || '—';

  const isCurrent = currentPlanId !== null && currentPlanId === plan.id;
  const hasTrial = plan.trialDays != null && plan.trialDays > 0;
  const features = Array.isArray(plan.features) ? plan.features : [];

  const planPrice = formatAmount(formatAmountValue(plan.price));
  const planCurrency = (plan.currency || 'USD').toUpperCase();
  const descriptionDisplay = formatPlanDescriptionForDisplay(
    plan.description,
    locale
  );

  return (
    <div className={`relative min-w-0 flex flex-col ${isMostPopular ? 'mt-5 xl:mt-0' : ''}`}>
      {isMostPopular && (
        <div className="absolute -top-[22px] left-0 right-0 h-[22px] rounded-t-[10px] bg-[var(--color-main)] flex items-center justify-center gap-1">
          <span className="text-[11px] leading-[1.4] tracking-[0.22px] text-white">★</span>
          <span className="text-[14px] leading-[1.4] tracking-[0.28px] text-white">
            {t('mostPopular')}
          </span>
        </div>
      )}
      <Card
        className={`relative w-full bg-[var(--color-secondary-2)] border border-[var(--color-secondary-4)] h-full overflow-hidden group flex flex-col ${
          isMostPopular ? 'rounded-b-[10px] rounded-t-none' : 'rounded-[10px]'
        }`}
      >
        <div className="relative z-10 flex flex-col flex-1 min-w-0">
          <CardHeader className="p-4 pb-3">
            <div className="space-y-1">
              <h3 className="figma-heading-medium text-[var(--color-secondary-10)] uppercase">
                {planName}
              </h3>
              <p className="figma-body-1-medium text-[var(--color-secondary-5)]">
                <span className="figma-heading-medium text-[var(--color-secondary-10)]">{planPrice}</span> {planCurrency}/{periodLabel}
              </p>
            </div>
          </CardHeader>
          <CardFooter className="px-4 pt-0 pb-4 flex flex-col gap-2">
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
            {descriptionDisplay.trim() !== '' ? (
              <p className="figma-body-3-regular text-[var(--color-secondary-6)] break-words whitespace-pre-line">
                {descriptionDisplay}
              </p>
            ) : null}
            {features.length > 0 && (
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 min-w-0">
                    <Camera className="w-4 h-4 text-[var(--color-secondary-10)] flex-shrink-0" strokeWidth={1.75} />
                    <span className="figma-body-3-regular text-[var(--color-secondary-10)] break-words">
                      {getFeatureLabel(f, locale)}
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
