'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type Status = 'loading' | 'success' | 'error';

export default function AuthCallbackRoot() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('auth');
  const { loginWithFacebook, linkFacebook, isAuthenticated } = useAuth();

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('');

  const { code, isLinkMode, providerError } = useMemo(() => {
    const oauthCode = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    return {
      code: oauthCode,
      isLinkMode: state === 'link',
      providerError: errorParam
    };
  }, [searchParams]);

  useEffect(() => {
    const processAuth = async () => {
      console.log('[AuthCallback-root] start', { code, isLinkMode, providerError });
      if (providerError) {
        console.error('[AuthCallback-root] providerError', providerError);
        setStatus('error');
        setMessage(providerError);
        return;
      }

      if (!code) {
        console.error('[AuthCallback-root] missing code');
        setStatus('error');
        setMessage(t('socialLoginError'));
        return;
      }

      try {
        setStatus('loading');
        if (isLinkMode) {
          console.log('[AuthCallback-root] link flow', { isAuthenticated });
          if (!isAuthenticated) {
            throw new Error('You must be logged in to link your Facebook account');
          }
          await linkFacebook(code);
          toast.success(t('profile.facebookLinked'));
          setStatus('success');
          router.replace('/profile');
        } else {
          console.log('[AuthCallback-root] login flow');
          await loginWithFacebook(code);
          toast.success(t('loginSuccess'));
          setStatus('success');
          router.replace('/dashboard');
        }
      } catch (err: any) {
        console.error('[AuthCallback-root] error', err);
        setStatus('error');
        setMessage(err?.message || t('socialLoginError'));
      }
    };

    processAuth();
  }, [code, isLinkMode, linkFacebook, loginWithFacebook, providerError, router, t, isAuthenticated]);

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1115] px-4">
        <div className="bg-[#141519] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-purple-500/10 flex flex-col items-center gap-4 text-center">
          <Spinner size="xl" gradient aria-label="Processing OAuth" />
          <div className="space-y-1">
            <p className="text-white font-semibold">{t('signingIn')}</p>
            <p className="text-sm text-gray-400">
              {isLinkMode ? t('verifying') : t('signingIn')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1115] px-4">
        <div className="bg-[#141519] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-purple-500/10 text-center space-y-4">
          <p className="text-lg font-semibold text-red-400">{message || t('socialLoginError')}</p>
          <Button
            onClick={handleBackToLogin}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {t('signIn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1115] px-4">
      <div className="bg-[#141519] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-purple-500/10 flex flex-col items-center gap-3 text-center">
        <p className="text-xl font-semibold text-white">
          {isLinkMode ? t('profile.facebookLinked') : t('loginSuccess')}
        </p>
        <p className="text-sm text-gray-400">
          {isLinkMode ? t('profile.facebookManage') : t('youAreSignedIn')}
        </p>
      </div>
    </div>
  );
}

