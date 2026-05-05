import * as React from 'react';

import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  optional?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, optional, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-[15px] leading-[1.4] font-normal text-white md:font-medium md:text-[16px] md:tracking-[0.32px] md:text-[var(--color-secondary-8)]',
          className
        )}
        {...props}
      >
        {children}
        {optional ? (
          <span className="text-[var(--color-secondary-6)] font-normal"> (optional)</span>
        ) : null}
      </label>
    );
  }
);
Label.displayName = 'Label';

export { Label };
