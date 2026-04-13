'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from 'next-intl';
import type { ActivePlanResponse } from '@/types/subscription';
import { formatPlanDescriptionForDisplay } from '@/lib/format-plan-description';
import { resolveLocalizedApiField } from '@/lib/resolve-localized-api-field';

interface CurrentPlanBlockProps {
  /** Active subscription data from GET /subscription-plans/my/active. Null when no plan or expired. */
  activeData: ActivePlanResponse['data'] | null;
  /** Called when user clicks "Convert to paid" (trial only). */
  onConvertTrial?: (userPlanId: number) => void;
  /** True while convert request is in progress. */
  isConverting?: boolean;
}

const formatDate = (iso: string | undefined): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
};

export const CurrentPlanBlock: React.FC<CurrentPlanBlockProps> = ({
  activeData,
  onConvertTrial,
  isConverting
}) => {
  const locale = useLocale();
  const t = useTranslations('billing');

  /** Format price for display (handles API string e.g. "1000.00000000"). */
  const formatPriceDisplay = (price: string | number | undefined): string => {
    if (price == null) return '—';
    const num = typeof price === 'string' ? parseFloat(price) : Number(price);
    if (Number.isNaN(num) || num < 0) return '—';
    if (num === 0) return t('priceFree');

    // Simple number formatting without locale-specific formatting for edge runtime compatibility
    const rounded = Math.round(num * 100) / 100;
    const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
    const formattedWithCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formattedWithCommas;
  };

  const hasActive = Boolean(activeData?.isActive && activeData?.plan);
  const isTrial = Boolean(activeData?.isTrial);
  const userPlanId = activeData?.id;
  const planName = resolveLocalizedApiField(activeData?.plan?.name, locale);
  const planDescriptionRaw = activeData?.plan?.description;
  const planDescriptionText = formatPlanDescriptionForDisplay(
    planDescriptionRaw,
    locale
  );
  const planPrice = formatPriceDisplay(activeData?.plan?.price);
  const planCurrency = (activeData?.plan?.currency || 'USD').toUpperCase();
  const planPeriodResolved = resolveLocalizedApiField(
    activeData?.plan?.period,
    locale
  );
  const planPeriod = planPeriodResolved.toLowerCase();
  const planPeriodLabel =
    planPeriod === 'monthly'
      ? t('periodMonthly')
      : planPeriod === 'yearly'
        ? t('periodYearly')
        : planPeriodResolved || undefined;
  const endDate = activeData?.trialEndDate ?? activeData?.endDate ?? undefined;
  const tokensLeft = activeData?.tokensLeft;
  const showSideColumn = Boolean(
    planDescriptionText.trim() !== '' ||
      (hasActive && isTrial && userPlanId != null && onConvertTrial)
  );

  return (
    <div className="relative min-w-0 w-full">
      <Card className="relative w-full bg-[var(--color-secondary-2)] border border-[var(--color-secondary-4)] rounded-[10px] overflow-hidden flex flex-col">
        <CardContent className="relative p-6">
          <div
            className={`grid grid-cols-1 ${showSideColumn ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]' : ''} gap-4 items-start`}
          >
            <div className="space-y-3 min-w-0 flex-1">
              <h2 className="figma-heading-semibold text-[var(--color-secondary-10)]">
                {t('currentPlan')}
              </h2>
              {hasActive ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs tracking-wide text-[var(--color-secondary-10)]">
                      {t('fieldPlan')}
                    </p>
                    <p className="figma-body-1-medium text-[var(--color-secondary-5)]">{planName}</p>
                  </div>
                  <p className="figma-body-1-medium text-[var(--color-secondary-5)]">
                    <span className="text-xs tracking-wide text-[var(--color-secondary-10)]">
                      {t('fieldPrice')}:{' '}
                    </span>
                    <span className="figma-heading-medium text-[var(--color-secondary-10)]">{planPrice}</span>
                    {` ${planCurrency}`}
                    {planPeriodLabel ? `/${planPeriodLabel}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {t('statusActive')}
                    </Badge>
                    {isTrial && (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {t('trial')}
                      </Badge>
                    )}
                    {endDate && (
                      <span className="text-sm text-gray-400">
                        {t('validUntil')} {formatDate(endDate)}
                      </span>
                    )}
                  </div>
                  {typeof tokensLeft === 'number' && (
                    <p className="text-sm text-gray-400">
                      {t('tokensLeft')}: {tokensLeft.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    {t('statusExpired')}
                  </Badge>
                  <p className="figma-body-1-regular text-[var(--color-secondary-5)]">
                    {t('selectPlanCta')}
                  </p>
                </>
              )}
            </div>
            <div className="min-w-0 space-y-3">
              {planDescriptionText.trim() !== '' ? (
                <div className="space-y-1">
                  <p className="text-xs tracking-wide text-[var(--color-secondary-10)]">
                    {t('fieldDescription')}
                  </p>
                  <p className="figma-body-3-regular text-[var(--color-secondary-10)] break-words whitespace-pre-line">
                    {planDescriptionText}
                  </p>
                </div>
              ) : null}
              {hasActive && isTrial && userPlanId != null && onConvertTrial && (
                <Button
                  className="bg-[var(--color-main)] hover:opacity-90 text-white border-0"
                  onClick={() => onConvertTrial(userPlanId)}
                  disabled={isConverting}
                >
                  {isConverting ? t('processing') : t('convertToPaid')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
    </Card>
    </div>
  );
};
