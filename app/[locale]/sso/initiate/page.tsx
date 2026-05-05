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
 * 2. This page calls internal API /api/auth/sso/initiate (backend URL hidden from user)
 * 3. If authenticated: redirects to external service with SSO code
 * 4. If not authenticated: redirects to login page
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageLoader } from '@/components/ui/PageLoader';

type Status = 'loading' | 'redirecting' | 'error';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function SSOInitiatePage() {
  const t = useTranslations('sso');
  const searchParams = useSearchParams();
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
      return;
    }

    const initiate = async () => {
      try {
        const params = new URLSearchParams();
        params.set('redirect_uri', redirectUri);
        if (service) {
          params.set('service', service);
        }

        const res = await fetch(`/api/auth/sso/initiate?${params.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include'
        });

        const data = await res.json();

        // Redirect when authenticated: backend may return redirectUrl in data.data or at top level
        const redirectUrl =
          data?.data?.redirectUrl ?? data?.redirectUrl;

        if (res.ok && redirectUrl) {
          setStatus('redirecting');
          setMessage(t('redirectingToService'));
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 100);
          return;
        }

        if ((res.status === 401 || data?.status === 401) && data?.data?.loginUrl) {
          setStatus('redirecting');
          setMessage(t('authenticationRequired'));
          // Small delay to ensure the user sees the status before redirect
          setTimeout(() => {
            window.location.href = data.data.loginUrl;
          }, 100);
          return;
        }

        setStatus('error');
        setMessage(data?.message || t('failedToInitiate'));
      } catch (error) {
        setStatus('error');
        setMessage(t('initiationError'));
      }
    };

    void initiate();
  }, [searchParams, isMounted, t]);

  if (status === 'loading' || status === 'redirecting') {
    const label =
      status === 'loading' ? `${message} ${t('pleaseWait')}` : message;
    return <PageLoader label={label} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="rounded-lg border border-white/10 bg-white/5 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <p className="text-sm">{message}</p>
        </div>
        {status === 'error' && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-red-300">
              {message}
            </div>
            <div className="text-xs text-gray-400">
              <p className="font-semibold mb-1">{t('whatToDo')}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t('checkRedirectUriExternal')}</li>
                <li>{t('redirectUriExample')}</li>
                <li>{t('dontUseInternalRoutes')}</li>
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
