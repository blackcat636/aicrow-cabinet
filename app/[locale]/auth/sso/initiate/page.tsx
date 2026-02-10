'use client';

/**
 * SSO Initiate Page (Alternative route) - Frontend entry point for SSO flow
 * 
 * IMPORTANT: This is a FRONTEND route, not a backend API endpoint.
 * External services should redirect to: {MAIN_FRONTEND_URL}/auth/sso/initiate?redirect_uri=...
 * NOT to: {MAIN_BACKEND_URL}/api/auth/sso/initiate
 * 
 * This is an alternative route to /sso/initiate for compatibility.
 * Same functionality as /sso/initiate.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

type Status = 'loading' | 'redirecting' | 'error';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function SSOInitiatePage() {
  const t = useTranslations('sso');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>(t('initializing'));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const redirectUri = searchParams.get('redirect_uri');
    const service = searchParams.get('service') || undefined;

    if (!redirectUri) {
      setStatus('error');
      setMessage(t('redirectUriNotSpecified'));
      console.error('[SSO Initiate Page /auth/sso/initiate] Missing redirect_uri in URL');
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
          setMessage(t('redirectingToService'));
          setTimeout(() => {
            window.location.href = data.data.redirectUrl;
          }, 100);
          return;
        }

        if (data?.status === 401 && data?.data?.loginUrl) {
          setStatus('redirecting');
          setMessage(t('authenticationRequired'));
          setTimeout(() => {
            window.location.href = data.data.loginUrl;
          }, 100);
          return;
        }

        setStatus('error');
        setMessage(data?.message || t('failedToInitiate'));
        console.error('[SSO Initiate Page /auth/sso/initiate] Unexpected response:', data);
      } catch (error) {
        setStatus('error');
        setMessage(t('initiationError'));
        console.error('[SSO Initiate Page /auth/sso/initiate] Fetch error:', error);
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
            {status === 'loading' && ` ${t('pleaseWait')}`}
          </p>
        </div>
        {status === 'error' && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-red-300">
              {message}
            </div>
            <div className="text-xs text-gray-400">
              <p className="font-semibold mb-1">{t('whatToDo')}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t('checkRedirectUriInUrl')}</li>
                <li>{t('correctUrlExample')}</li>
                <li>{t('externalServiceCheck')}</li>
              </ul>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => window.location.href = '/'}
                className="text-xs text-purple-400 hover:text-purple-300 underline"
              >
                {t('backToHome')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
