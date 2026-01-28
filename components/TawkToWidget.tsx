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
      [key: string]: any;
    };
    Tawk_LoadStart?: Date;
  }
}

export function TawkToWidget() {
  const { user, isAuthenticated } = useAuth();
  
  // Get IDs from env or use fallback values from embed script
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '69677baf020bfc1979148986';
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || '1jeu3ma3k';
  
  // Allow disabling Tawk.to via environment variable
  const isTawkEnabled = process.env.NEXT_PUBLIC_TAWK_ENABLED !== 'false';
  
  if (!isTawkEnabled || !propertyId || !widgetId) {
    return null;
  }

  // Apply visitor attributes when user data changes
  useEffect(() => {
    if (!isAuthenticated || !user || typeof window === 'undefined' || !window.Tawk_API) {
      return;
    }

    const applyAttributes = () => {
      if (window.Tawk_API?.setAttributes) {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '';
        
        window.Tawk_API.setAttributes({
          name: fullName || user.email || 'User',
          email: user.email || '',
          id: user.id || ''
        });
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
              
              window.Tawk_API.setAttributes({
                name: fullName || currentUser.email || 'User',
                email: currentUser.email || '',
                id: currentUser.id || ''
              });
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
      crossOrigin="anonymous"
      onLoad={() => {
        // Apply attributes after script loads if user is authenticated
        if (isAuthenticated && user && window.Tawk_API) {
          setTimeout(() => {
            if (window.Tawk_API) {
              const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '';
              
              window.Tawk_API.setAttributes({
                name: fullName || user.email || 'User',
                email: user.email || '',
                id: user.id || ''
              });
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
