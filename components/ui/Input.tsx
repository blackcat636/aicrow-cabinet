import * as React from 'react';

import { cn } from '@/lib/utils';

import { useFormFieldDescribedBy } from '@/components/ui/form-field-context';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, 'aria-describedby': ariaDescribedByProp, ...props }, ref) => {
    const formFieldDescribedBy = useFormFieldDescribedBy();
    const ariaDescribedBy = [formFieldDescribedBy, ariaDescribedByProp]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <input
        ref={ref}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'h-12 w-full rounded-[8px] border px-4 text-[16px] leading-[1.4] text-white placeholder:text-[var(--color-secondary-6)] focus:outline-none focus:border-[var(--color-secondary-5)] md:bg-transparent md:text-[var(--color-secondary-10)]',
          'bg-[#1E1E1E] border-[var(--color-secondary-5)]',
          invalid
            ? 'border-[#C42B2B]'
            : 'border-[var(--color-secondary-4)] md:border-[var(--color-secondary-4)]',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
