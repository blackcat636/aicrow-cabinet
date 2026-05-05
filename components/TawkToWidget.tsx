'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    Tawk_API?: {
      setAttributes: (
        attributes: { name?: string; email?: string; id?: string },
        callback?: (error: any) => void
      ) => void;
      onLoad?: () => void;
      i18next?: () => { t: (key: string) => string; language: string; changeLanguage?: () => Promise<unknown> };
      [key: string]: unknown;
    };
    Tawk_LoadStart?: Date;
    /** Stub for Tawk embed when it expects i18next (app uses next-intl). */
    i18next?: () => { t: (key: string) => string; language: string; changeLanguage?: () => Promise<unknown> };
  }
}

export function TawkToWidget({ cspNonce }: { cspNonce?: string }) {
  const { user, isAuthenticated } = useAuth();

  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim();
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim();

  // Allow disabling Tawk.to via environment variable
  const isTawkEnabled = process.env.NEXT_PUBLIC_TAWK_ENABLED !== 'false';

  // Set i18next stub before Script loads so Tawk embed does not throw "i18next is not a function" (app uses next-intl).
  if (typeof window !== 'undefined') {
    const i18nextStub = () => ({
      t: (key: string) => key,
      language: 'en',
      changeLanguage: () => Promise.resolve()
    });
    if (!window.Tawk_API) {
      window.Tawk_API = {} as unknown as typeof window.Tawk_API;
    }
    const tawkApi = window.Tawk_API as Record<string, unknown>;
    if (typeof tawkApi.i18next !== 'function') {
      tawkApi.i18next = i18nextStub;
    }
    if (typeof window.i18next !== 'function') {
      window.i18next = i18nextStub;
    }
  }

  if (!isTawkEnabled || !propertyId || !widgetId) {
    return null;
  }

  const buildVisitorAttributes = () => {
    if (!user) return null;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '';
    const email = typeof user.email === 'string' ? user.email.trim() : '';
    const id = user.id != null ? String(user.id).trim() : '';
    const name = fullName || email || 'User';

    const attributes: { name: string; email?: string; id?: string } = { name };
    if (email) attributes.email = email;
    if (id) attributes.id = id;
    return attributes;
  };

  // Apply visitor attributes when user data changes
  useEffect(() => {
    if (!isAuthenticated || !user || typeof window === 'undefined' || !window.Tawk_API) {
      return;
    }

    const applyAttributes = () => {
      if (window.Tawk_API?.setAttributes) {
        const attributes = buildVisitorAttributes();
        if (!attributes) return;
        window.Tawk_API.setAttributes(attributes);
      }
    };

    // Try to apply immediately
    applyAttributes();
  }, [user, isAuthenticated]);

  // Initialize Tawk_API before script loads
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.Tawk_LoadStart = new Date();

    // Initialize Tawk_API if it doesn't exist
    if (!window.Tawk_API) {
      window.Tawk_API = {} as unknown as typeof window.Tawk_API;
    }

    // Set up onLoad callback to apply user attributes when widget loads
    const currentUser = user;
    const currentIsAuthenticated = isAuthenticated;
    
    if (window.Tawk_API) {
      window.Tawk_API.onLoad = () => {
        if (currentIsAuthenticated && currentUser && window.Tawk_API?.setAttributes) {
          setTimeout(() => {
            if (window.Tawk_API?.setAttributes) {
              const fullName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.username || '';
              const email = typeof currentUser.email === 'string' ? currentUser.email.trim() : '';
              const id = currentUser.id != null ? String(currentUser.id).trim() : '';
              const name = fullName || email || 'User';
              const attributes: { name: string; email?: string; id?: string } = { name };
              if (email) attributes.email = email;
              if (id) attributes.id = id;
              window.Tawk_API.setAttributes(attributes);
            }
          }, 1000);
        }
      };
    }
  }, [isAuthenticated, user]);

  return (
    <Script
      id="tawk-to-script"
      strategy="afterInteractive"
      src={`https://embed.tawk.to/${propertyId}/${widgetId}`}
      nonce={cspNonce}
      crossOrigin="anonymous"
      onLoad={() => {
        // Apply attributes after script loads if user is authenticated
        if (isAuthenticated && user && window.Tawk_API) {
          setTimeout(() => {
            if (window.Tawk_API) {
              const attributes = buildVisitorAttributes();
              if (!attributes) return;
              window.Tawk_API.setAttributes(attributes);
            }
          }, 1000);
        }
      }}
      onError={(e) => {
        // Silently handle Tawk.to loading errors to avoid console spam
        console.warn('[TawkToWidget] Failed to load Tawk.to widget:', e);
      }}
    />
  );
}
