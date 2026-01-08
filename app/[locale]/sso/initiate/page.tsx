'use client';

/**
 * SSO Initiate Page - Frontend entry point for SSO flow
 * 
 * IMPORTANT: This is a FRONTEND route, not a backend API endpoint.
 * External services should redirect to: {MAIN_FRONTEND_URL}/sso/initiate?redirect_uri=...
 * NOT to: {MAIN_BACKEND_URL}/api/auth/sso/initiate
 * 
 * Flow:
 * 1. External service redirects user to this frontend page
 * 2. This page calls internal API /api/auth/sso/initiate-check (backend URL hidden from user)
 * 3. If authenticated: redirects to external service with SSO code
 * 4. If not authenticated: redirects to login page
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { normalizeRedirectUri } from '@/config/site';

type Status = 'loading' | 'redirecting' | 'error';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function SSOInitiatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('Ініціалізація SSO...');
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're on client side before normalizing redirect_uri
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let redirectUri = searchParams.get('redirect_uri');
    const service = searchParams.get('service') || undefined;

    if (!redirectUri) {
      setStatus('error');
      setMessage('redirect_uri не вказано');
      return;
    }

    // Normalize redirect_uri - convert relative paths to absolute URLs
    // This allows using paths like "/callback" which will be automatically
    // converted to the correct URL based on the current environment
    // Only normalize on client side to avoid hydration mismatch
    try {
      redirectUri = normalizeRedirectUri(redirectUri);
    } catch (error) {
      setStatus('error');
      setMessage('Невірний формат redirect_uri');
      return;
    }

    const initiate = async () => {
      const logPrefix = '[SSO Initiate Page]';
      
      try {
        console.log(`${logPrefix} Starting SSO flow:`, {
          redirectUri: redirectUri,
          service: service,
          currentUrl: window.location.href
        });

        const params = new URLSearchParams();
        params.set('redirect_uri', redirectUri);
        if (service) {
          params.set('service', service);
        }

        const apiUrl = `/api/auth/sso/initiate-check?${params.toString()}`;
        console.log(`${logPrefix} Calling API:`, apiUrl);

        const res = await fetch(apiUrl, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include'
        });
        
        console.log(`${logPrefix} API response status:`, res.status);
        
        const data = await res.json();
        console.log(`${logPrefix} API response data:`, {
          status: data?.status,
          hasRedirectUrl: !!data?.data?.redirectUrl,
          hasLoginUrl: !!data?.data?.loginUrl,
          redirectUrl: data?.data?.redirectUrl,
          loginUrl: data?.data?.loginUrl,
          message: data?.message
        });

        if (data?.status === 200 && data?.data?.redirectUrl) {
          console.log(`${logPrefix} User authenticated, redirecting to:`, data.data.redirectUrl);
          setStatus('redirecting');
          setMessage('Перенаправлення до сервісу...');
          window.location.href = data.data.redirectUrl;
          return;
        }

        if (data?.status === 401 && data?.data?.loginUrl) {
          console.log(`${logPrefix} User not authenticated, redirecting to login:`, data.data.loginUrl);
          setStatus('redirecting');
          setMessage('Необхідна автентифікація. Перенаправлення на логін...');
          window.location.href = data.data.loginUrl;
          return;
        }

        console.error(`${logPrefix} Unexpected response:`, data);
        setStatus('error');
        setMessage(data?.message || 'Не вдалося ініціювати SSO');
      } catch (error) {
        console.error(`${logPrefix} Error:`, error);
        setStatus('error');
        setMessage('Помилка під час ініціації SSO');
      }
    };

    void initiate();
  }, [router, searchParams, isMounted]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="rounded-lg border border-white/10 bg-white/5 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-purple-400" />
          <p className="text-sm">
            {message}
            {status === 'loading' && ' Будь ласка, зачекайте...'}
          </p>
        </div>
        {status === 'error' && (
          <div className="mt-2 text-xs text-red-300">
            Спробуйте ще раз або поверніться на головну.
          </div>
        )}
      </div>
    </div>
  );
}
