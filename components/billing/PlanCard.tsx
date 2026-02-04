'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon } from '@/components/icons';
import { useTranslations } from 'next-intl';
import type { SubscriptionPlan, PlanFeature } from '@/types/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  /** ID of the user's current active plan (planId). */
  currentPlanId: number | null;
  onSubscribe: (planId: number, useTrial?: boolean) => void;
  isPurchasing?: boolean;
}

const formatPeriod = (period: string, durationDays: number): string => {
  if (period === 'monthly') return '/ month';
  if (period === 'yearly') return '/ year';
  return `${durationDays} days`;
};

/** Format price for display (handles API string or number). */
const formatPriceDisplay = (
  price: string | number | undefined,
  currency: string | undefined,
  period: string,
  durationDays: number
): string => {
  const num = price == null ? NaN : typeof price === 'string' ? parseFloat(price) : Number(price);
  if (Number.isNaN(num) || num < 0) return '—';
  if (num === 0) return 'Free';
  const formatted = Number.isInteger(num) ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const curr = (currency || '').trim() || 'USD';
  return `${formatted} ${curr} ${formatPeriod(period, durationDays)}`;
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
  isPurchasing = false
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

  const isCurrent = currentPlanId !== null && currentPlanId === plan.id;
  const hasTrial = plan.trialDays != null && plan.trialDays > 0;
  const tokenLimit = plan.tokenLimit ?? 0;
  const features = Array.isArray(plan.features) ? plan.features : [];

  // Always show price; add trial line when plan has trial days
  const priceLine1 = formatPriceDisplay(
    plan.price as string | number,
    plan.currency,
    plan.period,
    plan.durationDays
  );
  const priceLine2 = hasTrial ? `${plan.trialDays} days trial` : null;

  return (
    <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden shadow-lg shadow-purple-500/30 min-w-0 flex flex-col">
      <Card
        ref={cardRef}
        className="relative w-full bg-[#141519] border-0 rounded-lg h-full overflow-hidden group flex flex-col"
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
        <div className="relative z-10 flex flex-col flex-1 min-w-0">
          <CardHeader className="space-y-4 p-6 pb-4">
            <h3 className="text-lg font-semibold text-white leading-tight">{plan.name}</h3>
            {plan.description && (
              <p className="text-sm text-gray-400 leading-snug">{plan.description}</p>
            )}
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white leading-tight">{priceLine1}</p>
              {priceLine2 && (
                <p className="text-sm text-gray-400">{priceLine2}</p>
              )}
            </div>
            {tokenLimit > 0 && (
              <p className="text-sm text-gray-400">{t('tokensIncluded', { count: tokenLimit.toLocaleString() })}</p>
            )}
          </CardHeader>
          <CardContent className="flex-1 px-6 pt-0 pb-4">
            {features.length > 0 && (
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
                    <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="break-words">{getFeatureLabel(f)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter className="p-6 pt-4">
            {isCurrent ? (
              <Button className="w-full" variant="secondary" disabled>
                {t('current')}
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-[#A500E1] to-[#7B61FF] hover:opacity-90 text-white border-0"
                onClick={() => onSubscribe(plan.id, hasTrial)}
                disabled={isPurchasing}
              >
                {isPurchasing ? t('processing') : hasTrial ? t('startTrial') : t('subscribe')}
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    </div>
  );
};
