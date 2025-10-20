'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AppLayout } from '@/components/AppLayout';
import { FileTextIcon, DashBoardIcon, ClockIcon } from '@/components/icons';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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
          onClose={() => setShowRegisterForm(false)}
          onSwitchToLogin={() => {
            setShowRegisterForm(false);
            setShowLoginForm(true);
          }}
        />
      </div>
    );
  }


  return (
    <AppLayout>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-8">Workflow Management</h1>
        <div className="bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-700">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
              <FileTextIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Workflow Management System</h2>
            <p className="text-gray-300 text-lg mb-6">
              Automate your tasks with powerful workflows. Attach workflows, schedule executions, and receive results via Telegram, email, or webhooks.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center p-6 bg-gray-700 rounded-lg border border-gray-600">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                  <FileTextIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-3 text-lg">Attach Workflows</h3>
                <p className="text-gray-300 leading-relaxed">Connect available workflows to your account and configure credentials for seamless automation</p>
              </div>
              <div className="text-center p-6 bg-gray-700 rounded-lg border border-gray-600">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-3 text-lg">Schedule Execution</h3>
                <p className="text-gray-300 leading-relaxed">Set up cron schedules or one-time executions for your workflows with flexible timing options</p>
              </div>
              <div className="text-center p-6 bg-gray-700 rounded-lg border border-gray-600">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                  <DashBoardIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-3 text-lg">Monitor Results</h3>
                <p className="text-gray-300 leading-relaxed">Track execution history and receive notifications via multiple channels including Telegram and email</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
