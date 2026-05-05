import * as React from 'react';

import { cn } from '@/lib/utils';

export interface StatusBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: 'error' | 'success' | 'info';
}

const variantClassName: Record<StatusBannerProps['variant'], string> = {
  error:
    'rounded-[8px] border border-[#C42B2B] bg-[#C42B2B]/10 px-4 py-3 text-[14px] text-[#ff8d8d]',
  success:
    'rounded-[8px] border border-green-600 bg-green-600/10 px-4 py-3 text-[14px] text-green-400',
  info: 'rounded-[8px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] px-4 py-3 text-[14px] text-[var(--color-secondary-8)]',
};

export function StatusBanner({
  variant,
  className,
  children,
  ...props
}: StatusBannerProps): React.JSX.Element {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(variantClassName[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
