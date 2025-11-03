'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';
import { AppLayout } from '@/components/AppLayout';
import { FileTextIcon, DashBoardIcon, ClockIcon } from '@/components/icons';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  useEffect(() => {
    // Debug logs for background image availability
    const bgUrl = '/auth_background.png';
    console.log('[AuthBG] Using background:', bgUrl);
    fetch(bgUrl, { method: 'HEAD' })
      .then(res => {
        console.log('[AuthBG] HEAD status:', res.status, res.ok);
        const size = res.headers.get('content-length');
        const type = res.headers.get('content-type');
        console.log('[AuthBG] content-length:', size, 'content-type:', type);
      })
      .catch(err => console.error('[AuthBG] HEAD error:', err));
  }, []);

  
  // Redirect authenticated users to workflows page
  useEffect(() => {
    if (isAuthenticated && !showLoginForm && !showRegisterForm && !showVerifyForm) {
      router.replace('/workflows');
    }
  }, [isAuthenticated, router, showLoginForm, showRegisterForm, showVerifyForm]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/auth_background.png"
            alt="auth background"
            className="absolute inset-0 w-full h-full object-cover z-0"
            onLoad={() => console.log('[AuthBG] onLoad fired: /auth_background.png')}
            onError={(e) => console.error('[AuthBG] onError for /auth_background.png', e)}
          />
          <div className="absolute inset-0 bg-black/30 z-10" />
        </div>

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
            router.push('/workflows');
          }}
        />
      </div>
    );
  }


  // This return statement won't be reached if authenticated (useEffect handles redirect)
  // But keeping it for TypeScript
  return null;
}
