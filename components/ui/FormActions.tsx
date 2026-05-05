'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface FormActionsProps {
  primary: {
    label: string;
    type?: 'submit' | 'button';
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  };
  secondary?: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
  };
  /** Mobile: primary on top; desktop: secondary left, primary right */
  mobileOrder?: 'primary-first' | 'secondary-first';
  className?: string;
}

export function FormActions({
  primary,
  secondary,
  mobileOrder = 'primary-first',
  className,
}: FormActionsProps): React.JSX.Element {
  const primaryOrder =
    mobileOrder === 'primary-first'
      ? 'order-1 md:order-2'
      : 'order-2 md:order-1';
  const secondaryOrder =
    mobileOrder === 'primary-first'
      ? 'order-2 md:order-1'
      : 'order-1 md:order-2';

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-4 md:flex-row md:gap-3 md:pt-4',
        className
      )}
    >
      {secondary ? (
        <Button
          type="button"
          variant="figma-outline"
          className={cn('h-12 w-full rounded-[10px] md:flex-1 md:rounded-[8px]', secondaryOrder)}
          onClick={secondary.onClick}
          disabled={secondary.disabled}
        >
          {secondary.label}
        </Button>
      ) : null}
      <Button
        type={primary.type ?? 'submit'}
        variant="figma"
        className={cn('h-12 w-full rounded-[10px] md:flex-1 md:rounded-[8px]', primaryOrder)}
        onClick={primary.onClick}
        disabled={primary.disabled || primary.loading}
      >
        {primary.loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Spinner size="sm" className="text-white" label="Loading" />
            {primary.label}
          </span>
        ) : (
          primary.label
        )}
      </Button>
    </div>
  );
}
