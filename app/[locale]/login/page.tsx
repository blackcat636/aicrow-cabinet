'use client';

import React from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcherCompact';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUri = searchParams?.get('redirect_uri') || undefined;
  const service = searchParams?.get('service') || undefined;

  return (
    <div className="min-h-screen min-h-[100dvh] relative overflow-hidden bg-[#1A1A1A] md:bg-[var(--color-secondary-1)]">
      {/* Mobile: subtle purple gradient from bottom; Desktop: original gradients */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 100%, rgba(141,46,226,0.4) 0%, rgba(141,46,226,0) 70%), linear-gradient(180deg, #1A1A1A 0%, #1A1A1A 100%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0 hidden md:block"
        style={{
          background:
            'radial-gradient(70% 80% at 100% 0%, rgba(141,46,226,0.65) 0%, rgba(141,46,226,0) 85%), radial-gradient(65% 75% at 0% 100%, rgba(141,46,226,0.55) 0%, rgba(141,46,226,0) 90%), linear-gradient(180deg, #0F0F10 0%, #0F0F10 100%)',
        }}
      />

      <div className="fixed top-4 left-4 right-4 z-30 flex justify-start md:justify-end">
        <LanguageSwitcherCompact />
      </div>

      <div className="relative z-20 min-h-screen min-h-[100dvh] flex items-center justify-center p-0 md:px-4 md:py-8">
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

