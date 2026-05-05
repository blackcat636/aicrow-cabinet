'use client';

import * as React from 'react';

import { Input, type InputProps } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export interface VerificationCodeInputProps
  extends Omit<InputProps, 'maxLength' | 'inputMode' | 'autoComplete'> {
  /** Omit for no maxLength attribute */
  maxLength?: number;
  normalizeUppercase?: boolean;
  inputMode?: 'numeric' | 'text' | 'tel' | 'search' | 'email' | 'url';
}

const VerificationCodeInput = React.forwardRef<HTMLInputElement, VerificationCodeInputProps>(
  ({ maxLength = 6, normalizeUppercase, inputMode = 'numeric', onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;
      if (normalizeUppercase) {
        const next = e.target.value.toUpperCase();
        onChange({
          ...e,
          target: { ...e.target, value: next },
          currentTarget: { ...e.currentTarget, value: next },
        } as React.ChangeEvent<HTMLInputElement>);
        return;
      }
      onChange(e);
    };

    return (
      <Input
        ref={ref}
        {...props}
        {...(maxLength !== undefined ? { maxLength } : {})}
        inputMode={inputMode}
        autoComplete="one-time-code"
        spellCheck={false}
        data-lpignore="true"
        data-form-type="other"
        className={cn(normalizeUppercase && 'uppercase', className)}
        onChange={handleChange}
      />
    );
  }
);
VerificationCodeInput.displayName = 'VerificationCodeInput';

export { VerificationCodeInput };
