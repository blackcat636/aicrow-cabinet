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

type Status = 'loading' | 'redirecting' | 'error';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function SSOInitiatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('Ініціалізація SSO...');

  useEffect(() => {
    const redirectUri = searchParams.get('redirect_uri');
    const service = searchParams.get('service') || undefined;

    if (!redirectUri) {
      setStatus('error');
      setMessage('redirect_uri не вказано');
      return;
    }

    const initiate = async () => {
      try {
        const params = new URLSearchParams();
        params.set('redirect_uri', redirectUri);
        if (service) {
          params.set('service', service);
        }

        const res = await fetch(`/api/auth/sso/initiate-check?${params.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include'
        });
        const data = await res.json();

        if (data?.status === 200 && data?.data?.redirectUrl) {
          setStatus('redirecting');
          setMessage('Перенаправлення до сервісу...');
          window.location.href = data.data.redirectUrl;
          return;
        }

        if (data?.status === 401 && data?.data?.loginUrl) {
          setStatus('redirecting');
          setMessage('Необхідна автентифікація. Перенаправлення на логін...');
          window.location.href = data.data.loginUrl;
          return;
        }

        setStatus('error');
        setMessage(data?.message || 'Не вдалося ініціювати SSO');
      } catch (error) {
        setStatus('error');
        setMessage('Помилка під час ініціації SSO');
      }
    };

    void initiate();
  }, [router, searchParams]);

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
