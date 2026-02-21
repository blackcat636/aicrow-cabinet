'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import type { ActivePlanResponse } from '@/types/subscription';

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

/** Format price for display (handles API string e.g. "1000.00000000"). */
const formatPriceDisplay = (
  price: string | number | undefined,
  currency: string | undefined,
  period: string | undefined,
  durationDays?: number
): string => {
  if (price == null) return '—';
  const num = typeof price === 'string' ? parseFloat(price) : Number(price);
  if (Number.isNaN(num) || num < 0) return '—';
  if (num === 0) return 'Free';
  
  // Simple number formatting without locale-specific formatting for edge runtime compatibility
  const rounded = Math.round(num * 100) / 100;
  const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
  const formattedWithCommas = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const curr = (currency || '').trim() || 'USD';
  if (period === 'monthly') return `${formattedWithCommas} ${curr} / month`;
  if (period === 'yearly') return `${formattedWithCommas} ${curr} / year`;
  if (durationDays != null && durationDays > 0) return `${formattedWithCommas} ${curr} / ${durationDays} days`;
  return `${formattedWithCommas} ${curr}`;
};

export const CurrentPlanBlock: React.FC<CurrentPlanBlockProps> = ({
  activeData,
  onConvertTrial,
  isConverting
}) => {
  const t = useTranslations('billing');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  const hasActive = Boolean(activeData?.isActive && activeData?.plan);
  const isTrial = Boolean(activeData?.isTrial);
  const userPlanId = activeData?.id;
  const planName = activeData?.plan?.name;
  const planPrice = formatPriceDisplay(
    activeData?.plan?.price,
    activeData?.plan?.currency,
    activeData?.plan?.period,
    activeData?.plan?.durationDays
  );
  const endDate = activeData?.trialEndDate ?? activeData?.endDate ?? undefined;
  const tokensLeft = activeData?.tokensLeft;

  return (
    <div className="p-[1px] rounded-lg bg-[var(--color-main)] overflow-hidden shadow-lg shadow-purple-500/30">
      <Card
        ref={cardRef}
        className="relative w-full bg-[var(--color-secondary-2)] border-0 rounded-lg overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
          style={{
            background: isHovering
              ? `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(165,0,225,0.5), rgba(123,97,255,0.3) 40%, transparent 70%)`
              : 'none'
          }}
        />
        <CardContent className="relative z-10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3 min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white">{t('currentPlan')}</h2>
              {hasActive ? (
                <>
                  <p className="text-gray-300 font-medium">{planName}</p>
                  <p className="text-lg font-semibold text-white">{planPrice}</p>
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
                  <p className="text-gray-400">{t('selectPlanCta')}</p>
                </>
              )}
            </div>
            {hasActive && isTrial && userPlanId != null && onConvertTrial && (
              <Button
                className="flex-shrink-0 bg-[var(--color-main)] hover:opacity-90 text-white border-0"
                onClick={() => onConvertTrial(userPlanId)}
                disabled={isConverting}
              >
                {isConverting ? t('processing') : t('convertToPaid')}
              </Button>
            )}
          </div>
        </CardContent>
    </Card>
    </div>
  );
};
