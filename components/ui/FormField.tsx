'use client';

import * as React from 'react';
import { useId } from 'react';

import { Label } from '@/components/ui/Label';
import { FormFieldProvider } from '@/components/ui/form-field-context';

export { useFormFieldDescribedBy } from '@/components/ui/form-field-context';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps): React.JSX.Element {
  const baseId = useId();
  const errorId = error ? `${baseId}-error` : undefined;
  const hintId = hint ? `${baseId}-hint` : undefined;

  return (
    <FormFieldProvider value={{ errorId, hintId }}>
      <div className={className ?? 'space-y-2'}>
        {label ? (
          <Label htmlFor={htmlFor}>
            {label}
            {required ? ' *' : null}
          </Label>
        ) : null}
        {children}
        {error ? (
          <p id={errorId} role="alert" className="text-[12px] text-[#ff8d8d]">
            {error}
          </p>
        ) : null}
        {hint ? (
          <p id={hintId} className="text-[14px] leading-[1.5] text-[var(--color-secondary-6)]">
            {hint}
          </p>
        ) : null}
      </div>
    </FormFieldProvider>
  );
}
