'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { PageLoader } from '@/components/ui/PageLoader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type Status = 'loading' | 'success' | 'error';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('auth');
  const { loginWithFacebook, linkFacebook, isAuthenticated } = useAuth();

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('');
  const processedCodeRef = React.useRef<string | null>(null);

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
      if (providerError) {
        setStatus('error');
        setMessage(providerError);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage(t('socialLoginError'));
        return;
      }

      // Prevent processing the same code twice
      if (processedCodeRef.current === code) {
        console.warn('[AuthCallback] Code already processed, skipping...');
        return;
      }

      try {
        setStatus('loading');
        processedCodeRef.current = code;
        
        if (isLinkMode) {
          if (!isAuthenticated) {
            throw new Error('You must be logged in to link your Facebook account');
          }
          await linkFacebook(code);
          toast.success(t('profile.facebookLinked'));
          setStatus('success');
          router.replace('/profile');
        } else {
          await loginWithFacebook(code);
          toast.success(t('loginSuccess'));
          setStatus('success');
          router.replace('/dashboard');
        }
      } catch (err: any) {
        setStatus('error');
        // Handle specific error messages
        const errorMessage = err?.message || '';
        console.error('[AuthCallback] Error details:', {
          message: errorMessage,
          status: err?.status,
          data: err?.data,
          responseText: err?.responseText
        });
        
        if (errorMessage.includes('already linked to another user') || errorMessage.includes('already linked')) {
          setMessage(t('facebookAlreadyLinked'));
        } else if (errorMessage.includes('Failed to exchange Facebook code') || errorMessage.includes('status code 400')) {
          // More specific error for Facebook code exchange failure
          setMessage('Facebook authentication failed. The authorization code may have expired or been used already. Please try logging in again.');
        } else {
          setMessage(errorMessage || t('socialLoginError'));
        }
        
        // Reset processed code on error so user can retry
        processedCodeRef.current = null;
      }
    };

    processAuth();
  }, [code, isLinkMode, linkFacebook, loginWithFacebook, providerError, router, t, isAuthenticated]);

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <PageLoader label={isLinkMode ? t('verifying') : t('signingIn')} />;
    }

    if (status === 'error') {
      return (
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-red-400">{message || t('socialLoginError')}</p>
          <Button
            onClick={handleBackToLogin}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {t('signIn')}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xl font-semibold text-white">
          {isLinkMode ? t('profile.facebookLinked') : t('loginSuccess')}
        </p>
        <p className="text-sm text-gray-400">
          {isLinkMode ? t('profile.facebookManage') : t('youAreSignedIn')}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1115] px-4">
      <div className="bg-[#141519] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-purple-500/10">
        {renderContent()}
      </div>
    </div>
  );
}

