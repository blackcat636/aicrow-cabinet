'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';
import { AppLayout } from '@/components/AppLayout';
import { PageLoader } from '@/components/ui/PageLoader';
import { FileTextIcon, DashBoardIcon, ClockIcon } from '@/components/icons';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function Home() {
  const router = useRouter();
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Redirect authenticated users to dashboard page
  useEffect(() => {
    if (isAuthenticated && !showLoginForm && !showRegisterForm && !showVerifyForm) {
      router.replace('/dashboard', { locale: locale as any });
    }
  }, [isAuthenticated, router, showLoginForm, showRegisterForm, showVerifyForm, locale]);

  // Show loading state
  if (isLoading) {
    return <PageLoader label={tCommon('loading')} />;
  }

  // Show login/register if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        {/* Background - same gradient as main site */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: 'linear-gradient(180deg, #141519 0%, #141519 20%, rgba(20, 21, 25, 0.995) 25%, rgba(25, 22, 35, 0.9) 32%, rgba(35, 28, 50, 0.75) 40%, rgba(45, 32, 65, 0.6) 48%, rgba(70, 40, 90, 0.5) 55%, rgba(101, 43, 155, 0.45) 62%, rgba(80, 35, 110, 0.55) 68%, rgba(65, 21, 100, 0.65) 75%, rgba(45, 15, 70, 0.8) 82%, rgba(35, 10, 55, 0.9) 88%, rgba(20, 7, 35, 0.95) 94%, rgba(15, 5, 25, 1) 100%)',
          }}
        />

        {/* Centered container */}
        <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Ai Pills User Account</h1>
                <p className="text-gray-300 text-sm">Welcome to Workflow Management System</p>
              </div>
            </div>

            {/* Dynamic-height content: render only active form */}
            <div className="px-6 py-6">
              {activeTab === 'login' ? (
                <div className="max-w-sm w-full mx-auto">
                  <LoginForm
                    variant="embedded"
                    onSwitchToRegister={() => setActiveTab('register')}
                  />
                </div>
              ) : (
                <div className="max-w-sm w-full mx-auto">
                  <RegisterForm
                    variant="embedded"
                    onSwitchToLogin={() => setActiveTab('login')}
                    onRegistrationSuccess={(email) => {
                      setVerificationEmail(email);
                      setShowVerifyForm(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer actions removed to avoid duplicate register buttons */}
          </div>
        </div>

        {/* Verify Email Modal */}
        <VerifyEmailForm
          isOpen={showVerifyForm}
          onClose={() => {
            setShowVerifyForm(false);
            setVerificationEmail('');
          }}
          email={verificationEmail}
          onVerified={() => {
            setShowVerifyForm(false);
            setVerificationEmail('');
            router.push('/dashboard', { locale: locale as any });
          }}
        />
      </div>
    );
  }


  // This return statement won't be reached if authenticated (useEffect handles redirect)
  // But keeping it for TypeScript
  return null;
}

