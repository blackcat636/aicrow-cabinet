'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { BalanceData, Currency } from '@/types/balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface BalanceCardProps {
  balanceData: BalanceData;
}

// Move helper functions outside component
const formatAmount = (amount: number, precision: string) => {
  return amount.toFixed(3);
};

export const BalanceCard: React.FC<BalanceCardProps> = React.memo(({ balanceData }) => {
  const t = useTranslations('balance');
  const { currency, balance, frozen_balance, available_balance, total_deposited, total_withdrawn } = balanceData;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [iconError, setIconError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for interactive background on card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Check if icon should be displayed - skip invalid local paths that don't exist
  const shouldShowIcon = (url: string | null | undefined): boolean => {
    if (!url) return false;
    
    // Always try absolute URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }
    
    // For local paths, check if file likely exists
    // Skip known non-existent paths to prevent 404 errors
    const invalidPaths = ['/icons/usd.png', '/icons/usd']; // Add more if needed
    if (invalidPaths.some(path => url.includes(path))) {
      return false;
    }
    
    // Try other local paths, onError will handle if they don't exist
    return url.startsWith('/');
  };

  const getCurrencyIcon = (currency: Currency) => {
    // Only render image if URL is valid and should be shown
    if (currency.icon_url && shouldShowIcon(currency.icon_url) && !iconError) {
      return (
        <img
          src={currency.icon_url}
          alt={currency.name}
          className="w-6 h-6 rounded-full flex-shrink-0"
          width={24}
          height={24}
          loading="lazy"
          onError={(e) => {
            // Silently handle error - hide image and show fallback
            e.currentTarget.style.display = 'none';
            setIconError(true);
          }}
          onLoad={() => {
            // Reset error state on successful load
            setIconError(false);
          }}
        />
      );
    }
    // Don't render anything if URL is invalid or error occurred
    return null;
  };

  const formattedBalance = useMemo(() => formatAmount(balance, currency.precision), [balance, currency.precision]);
  const currencyIconElement = useMemo(() => getCurrencyIcon(currency), [currency, iconError]);
  
  // Reset icon error when currency changes
  React.useEffect(() => {
    setIconError(false);
  }, [currency.id]);

  return (
    <div 
      className="p-[1px] rounded-lg bg-[var(--color-main)] overflow-hidden shadow-lg shadow-purple-500/30"
    >
      <Card 
        ref={cardRef}
        className="relative w-full bg-[var(--color-secondary-2)] border-0 rounded-lg h-full overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Interactive gradient overlay that follows mouse - more visible */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
          style={{
            background: isHovering
              ? `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(165,0,225,0.5), rgba(123,97,255,0.3) 40%, transparent 70%)`
              : 'none'
          }}
        />
        
        {/* Content with relative z-index */}
        <div className="relative z-10">
          <CardHeader className="pb-3 bg-transparent rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-white min-h-[28px]">
              {currencyIconElement && currency.icon_url && !iconError && (
                currencyIconElement
              )}
              <span className="text-lg font-semibold leading-tight min-h-[28px] flex items-center">
                {currency.name || t('token')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Balance */}
            <div className="text-center p-6 bg-black/40 backdrop-blur-sm rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">{t('totalBalance')}</p>
              <p className="text-4xl font-bold text-white">
                {formattedBalance}
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
});

BalanceCard.displayName = 'BalanceCard';
