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
      <div className="h-full bg-black flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-sm p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">AiPills CRM</h1>
            <p className="text-gray-300">Welcome to Workflow Management System</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => setShowLoginForm(true)}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg shadow-purple-500/25"
            >
              Sign In
            </button>
            
            <button
              onClick={() => setShowRegisterForm(true)}
              className="w-full py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors font-medium"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Auth Forms */}
        <LoginForm
          isOpen={showLoginForm}
          onClose={() => setShowLoginForm(false)}
          onSwitchToRegister={() => {
            setShowLoginForm(false);
            setShowRegisterForm(true);
          }}
        />
        
        <RegisterForm
          isOpen={showRegisterForm}
          onClose={() => {
            setShowRegisterForm(false);
            setVerificationEmail('');
          }}
          onSwitchToLogin={() => {
            setShowRegisterForm(false);
            setShowLoginForm(true);
          }}
          onRegistrationSuccess={(email) => {
            setShowRegisterForm(false);
            setVerificationEmail(email);
            setShowVerifyForm(true);
          }}
        />
        
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
            // Redirect to workflows page instead of reload
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
