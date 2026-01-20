'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcherCompact';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUri = searchParams?.get('redirect_uri') || undefined;
  const service = searchParams?.get('service') || undefined;
  const code = searchParams?.get('code');
  const state = searchParams?.get('state');
  
  const [ssoError, setSsoError] = useState<string | null>(null);
  const t = useTranslations('sso');
  const tCommon = useTranslations('common');

  // Handle SSO callback - if code and state are present, this means redirect_uri was wrong
  useEffect(() => {
    if (code && state) {
      setSsoError(
        `${t('redirectUriPointsToLogin')} ${t('useCorrectRedirectUri')}`
      );
    }
  }, [code, state, redirectUri, service, t]);

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'linear-gradient(180deg, #141519 0%, #141519 20%, rgba(20, 21, 25, 0.995) 25%, rgba(25, 22, 35, 0.9) 32%, rgba(35, 28, 50, 0.75) 40%, rgba(45, 32, 65, 0.6) 48%, rgba(70, 40, 90, 0.5) 55%, rgba(101, 43, 155, 0.45) 62%, rgba(80, 35, 110, 0.55) 68%, rgba(65, 21, 100, 0.65) 75%, rgba(45, 15, 70, 0.8) 82%, rgba(35, 10, 55, 0.9) 88%, rgba(20, 7, 35, 0.95) 94%, rgba(15, 5, 25, 1) 100%)',
        }}
      />

      {/* Language switcher in top right corner */}
      <div className="fixed top-4 right-4 z-30">
        <LanguageSwitcherCompact />
      </div>

      <div className="relative z-20">
        {ssoError && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
            <div className="bg-red-900/90 border border-red-600 rounded-lg p-4 shadow-lg">
              <p className="text-sm text-red-200">{ssoError}</p>
              <button
                onClick={() => setSsoError(null)}
                className="mt-2 text-xs text-red-300 hover:text-red-100 underline"
              >
                {tCommon('close')}
              </button>
            </div>
          </div>
        )}
        <LoginForm
          variant="modal"
          isOpen={true}
          redirectUri={redirectUri}
          service={service}
          onClose={() => router.push('/')}
          onSwitchToRegister={() => router.push('/signup')}
        />
      </div>
    </div>
  );
}

