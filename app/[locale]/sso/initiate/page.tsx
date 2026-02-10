'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface SSOCheckResponse {
  status: number;
  data?: {
    redirectUrl?: string;
    loginUrl?: string;
    code?: string;
    state?: string;
  };
  message?: string;
}

export default function SSOInitiatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('sso');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const redirectUri = searchParams?.get('redirect_uri');
  const service = searchParams?.get('service');
  const state = searchParams?.get('state');

  useEffect(() => {
    const checkSSO = async () => {
      if (!redirectUri) {
        setError(t('redirectUriNotSpecified'));
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          redirect_uri: redirectUri
        });
        if (service) params.set('service', service);
        if (state) params.set('state', state);

        const apiUrl = `/api/auth/sso/initiate-check?${params.toString()}`;
        console.log('[SSO Initiate] Fetching:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-cache'
        });

        const responseText = await response.text();
        console.log('[SSO Initiate] Response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          bodyPreview: responseText.slice(0, 500)
        });

        let data: SSOCheckResponse;
        try {
          data = JSON.parse(responseText) as SSOCheckResponse;
        } catch (parseErr) {
          console.error('[SSO Initiate] JSON parse failed:', parseErr);
          setError(`API returned invalid JSON (status ${response.status}). Check server logs.`);
          setLoading(false);
          return;
        }

        if (data.status === 200 && data.data?.redirectUrl) {
          console.log('[SSO Initiate] Redirecting to callback with code');
          window.location.href = data.data.redirectUrl;
          return;
        }

        if (data.status === 401 && data.data?.loginUrl) {
          console.log('[SSO Initiate] Not authenticated, redirecting to login');
          window.location.href = data.data.loginUrl;
          return;
        }

        console.warn('[SSO Initiate] Unexpected response:', { data, status: response.status });
        if (response.status === 400) {
          setError(data.message || t('invalidRedirectUriFormat'));
        } else {
          setError(data.message || t('initiationError'));
        }
        setLoading(false);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errStack = err instanceof Error ? err.stack : undefined;
        console.error('[SSO Initiate] Fetch error:', errMsg, errStack);
        setError(`${t('initiationError')}: ${errMsg}`);
        setLoading(false);
      }
    };

    checkSSO();
  }, [redirectUri, service, state, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141519]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-300">{t('initializing')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('pleaseWait')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141519] p-4">
        <div className="max-w-md w-full bg-white/5 rounded-xl border border-red-500/30 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">{t('failedToInitiate')}</h2>
          <p className="text-gray-300 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
