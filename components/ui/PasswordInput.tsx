'use client';

import * as React from 'react';

import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Input, type InputProps } from '@/components/ui/Input';
import { useFormFieldDescribedBy } from '@/components/ui/form-field-context';

export type PasswordInputProps = Omit<InputProps, 'type'> & {
  /** Used when getToggleAriaLabel is omitted */
  togglePasswordAriaLabel?: string;
  /** Preferred: label depends on visibility */
  getToggleAriaLabel?: (visible: boolean) => string;
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      togglePasswordAriaLabel,
      getToggleAriaLabel,
      'aria-describedby': ariaDescribedByProp,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(false);
    const toggleLabel =
      getToggleAriaLabel?.(visible) ??
      togglePasswordAriaLabel ??
      (visible ? 'Hide password' : 'Show password');
    const formFieldDescribedBy = useFormFieldDescribedBy();
    const ariaDescribedBy = [formFieldDescribedBy, ariaDescribedByProp]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-11', className)}
          aria-describedby={ariaDescribedBy}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-secondary-6)] hover:text-[var(--color-secondary-10)] transition-colors"
          aria-label={toggleLabel}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
