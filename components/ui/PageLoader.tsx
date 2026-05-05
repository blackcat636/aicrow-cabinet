'use client';

import React from 'react';

import { Spinner } from '@/components/ui/spinner';

interface PageLoaderProps {
  label: string;
  className?: string;
}

export function PageLoader({
  label,
  className,
}: PageLoaderProps): React.JSX.Element {
  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-[var(--color-secondary-1)]/95 ${className ?? ''}`}
    >
      <div className="flex items-center gap-3 text-[var(--color-secondary-6)]">
        <Spinner size="md" className="text-[var(--color-main)]" label={label} />
        <span className="text-[16px] leading-[1.4] tracking-[0.32px]">{label}</span>
      </div>
    </div>
  );
}
