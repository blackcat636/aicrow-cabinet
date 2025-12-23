'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { facebookApi } from '@/lib/apiFacebook';
import { setTokens } from '@/lib/auth';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type CallbackStatus = 'pending' | 'success' | 'error';

const AuthCallbackPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('auth.oauth');
  const [status, setStatus] = useState<CallbackStatus>('pending');
  const [error, setError] = useState<string | null>(null);

  const redirectUri = useMemo(() => {
    if (process.env.NEXT_PUBLIC_FACEBOOK_CALLBACK_URL) {
      return process.env.NEXT_PUBLIC_FACEBOOK_CALLBACK_URL;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return '';
  }, []);

  useEffect(() => {
    const code = searchParams.get('code');
    const providerError = searchParams.get('error');
    const stateRaw = searchParams.get('state');

    let state: { action?: string; returnTo?: string } = {};
    if (stateRaw) {
      try {
        state = JSON.parse(decodeURIComponent(stateRaw));
      } catch {
        state = {};
      }
    }

    const returnTo = state.returnTo || '/dashboard';
    const isLinkFlow = state.action === 'link';

    if (providerError) {
      console.error('[Facebook][callback] providerError', providerError);
      setStatus('error');
      setError(providerError);
      return;
    }

    if (!code) {
      console.error('[Facebook][callback] missing code');
      setStatus('error');
      setError(t('missingCode'));
      return;
    }

    const verify = async () => {
      console.log('[Facebook][callback] verify:start', {
        codePresent: !!code,
        redirectUri,
        isLinkFlow,
        returnTo
      });
      setStatus('pending');
      setError(null);
      try {
        const result = await facebookApi.verifyCode(code, redirectUri, {
          link: isLinkFlow
        });
        console.log('[Facebook][callback] verify:success', {
          hasTokens: Boolean(result.data?.accessToken && result.data?.refreshToken),
          emailDiffers: result.data?.emailDiffers,
          userEmail: result.data?.userEmail,
          socialEmail: result.data?.socialEmail,
          linked: result.data?.linked
        });

        if (result.data?.accessToken && result.data.refreshToken) {
          setTokens({
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            deviceId: result.data.deviceId
          });
        }

        setStatus('success');
        toast.success(
          isLinkFlow ? t('linkSuccess') : t('loginSuccess'),
          { duration: 4000 }
        );
        router.replace(returnTo);
      } catch (err: any) {
        console.error('[Facebook][callback] verify:error', {
          status: err?.status,
          message: err?.message,
          stack: err?.stack
        });
        setStatus('error');
        setError(
          err?.status === 403
            ? t('providerDisabled')
            : err?.message || t('genericError')
        );
      }
    };

    void verify();
  }, [redirectUri, router, searchParams, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0c10] text-white px-4">
      <div className="max-w-md w-full bg-[#141519] border border-gray-700 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
            {status === 'pending' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : status === 'success' ? (
              <span className="text-2xl">✓</span>
            ) : (
              <span className="text-2xl">!</span>
            )}
          </div>

          <h1 className="text-xl font-semibold">
            {status === 'pending'
              ? t('processing')
              : status === 'success'
              ? t('successTitle')
              : t('errorTitle')}
          </h1>

          {status === 'pending' && (
            <p className="text-gray-300">{t('processingMessage')}</p>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-sm">
              {error || t('genericError')}
            </p>
          )}
          {status === 'success' && (
            <p className="text-gray-300">{t('successMessage')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;

