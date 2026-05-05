'use client';

import * as React from 'react';

export interface FormFieldContextValue {
  errorId?: string;
  hintId?: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function FormFieldProvider({
  value,
  children,
}: {
  value: FormFieldContextValue;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <FormFieldContext.Provider value={value}>{children}</FormFieldContext.Provider>
  );
}

/** Merges FormField error/hint ids for aria-describedby on controls */
export function useFormFieldDescribedBy(): string | undefined {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) return undefined;
  return [ctx.errorId, ctx.hintId].filter(Boolean).join(' ') || undefined;
}
