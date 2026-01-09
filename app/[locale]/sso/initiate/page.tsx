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
    const originalRedirectUri = redirectUri;
    try {
      redirectUri = normalizeRedirectUri(redirectUri);
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Невірний формат redirect_uri');
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
          // Small delay to ensure the user sees the status before redirect
          setTimeout(() => {
            window.location.href = data.data.redirectUrl;
          }, 100);
          return;
        }

        if (data?.status === 401 && data?.data?.loginUrl) {
          setStatus('redirecting');
          setMessage('Необхідна автентифікація. Перенаправлення на логін...');
          // Small delay to ensure the user sees the status before redirect
          setTimeout(() => {
            window.location.href = data.data.loginUrl;
          }, 100);
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
          <div className="mt-4 space-y-2">
            <div className="text-xs text-red-300">
              {message}
            </div>
            <div className="text-xs text-gray-400">
              <p className="font-semibold mb-1">Що робити:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Перевірте, що <code className="bg-white/10 px-1 rounded">redirect_uri</code> вказує на зовнішній сервіс (callback URL)</li>
                <li>Приклад правильного <code className="bg-white/10 px-1 rounded">redirect_uri</code>: <code className="bg-white/10 px-1 rounded">https://external-service.com/callback</code> або <code className="bg-white/10 px-1 rounded">/callback</code></li>
                <li>Не використовуйте внутрішні маршрути: <code className="bg-white/10 px-1 rounded">/login</code>, <code className="bg-white/10 px-1 rounded">/signup</code>, <code className="bg-white/10 px-1 rounded">/dashboard</code></li>
              </ul>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => window.location.href = '/'}
                className="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                Повернутися на головну
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
