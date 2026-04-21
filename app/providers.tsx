"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { TawkToWidget } from "@/components/TawkToWidget";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  /** CSP nonce from middleware (x-nonce) for third-party Script tags. */
  cspNonce?: string;
}

export function Providers({ children, themeProps, cspNonce }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <AuthProvider>
        {children}
        <TawkToWidget cspNonce={cspNonce} />
      </AuthProvider>
    </NextThemesProvider>
  );
}
