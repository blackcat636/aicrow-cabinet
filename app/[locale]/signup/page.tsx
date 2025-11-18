'use client';

import React from 'react';
import { useRouter } from '@/i18n/routing';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcherCompact';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function SignupPage() {
  const router = useRouter();

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
        <RegisterForm
          variant="modal"
          isOpen={true}
          onClose={() => router.push('/')}
          onSwitchToLogin={() => router.push('/login')}
        />
      </div>
    </div>
  );
}

