'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import {
  FileTextIcon,
  LogOutIcon,
  DashBoardIcon,
  ClockIcon
} from '@/components/icons';

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (username: string) => {
    if (!username) return 'U';
    return username
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
            <h1 className="text-3xl font-bold text-white mb-2">AiCrow CRM</h1>
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
    <div className='min-h-screen bg-gray-900'>
      {/* Desktop Layout */}
      <div className='hidden md:flex min-h-screen ml-8'>
        {/* Sidebar */}
        <div className='w-[320px] xl:w-[360px] 2xl:w-[390px] 3xl:w-[420px] 4xl:w-[450px] pt-[40px] bg-gray-800 shadow-sm border-r border-gray-700 flex-shrink-0'>
          <div className='ml-7'>
            <div className='text-center mb-6 border rounded-lg border-gray-600 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px] p-5 bg-gray-700'>
              <Avatar className='w-16 h-16 mx-auto mb-3'>
                <AvatarImage
                  src={user?.photo || undefined}
                />
                <AvatarFallback className='bg-purple-600 text-white text-lg font-semibold'>
                  {getInitials(user?.username || 'User')}
                </AvatarFallback>
              </Avatar>
              <h2 className='text-lg font-semibold text-white'>
                {user?.username || 'User'}
              </h2>
              <Badge
                variant='secondary'
                className='bg-purple-600 text-white mt-1'
              >
                {user?.role || 'User'}
              </Badge>
            </div>

                    <nav className='space-y-2 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px]'>
                      <Link
                        href="/"
                        className="w-full flex items-center gap-3 p-3 rounded-lg border bg-purple-600 text-white border-l-4 border-purple-500 transition-colors shadow-lg shadow-purple-500/25"
                      >
                        <DashBoardIcon className='w-5 h-5' />
                        <span className='font-medium'>Dashboard</span>
                      </Link>
                      <Link
                        href="/workflows"
                        className="w-full flex items-center gap-3 p-3 rounded-lg border text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-gray-600"
                      >
                        <FileTextIcon className='w-5 h-5' />
                        <span className='font-medium'>Workflows</span>
                      </Link>
                      <Link
                        href="/executions"
                        className="w-full flex items-center gap-3 p-3 rounded-lg border text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-gray-600"
                      >
                        <ClockIcon className='w-5 h-5' />
                        <span className='font-medium'>Executions</span>
                      </Link>
                    </nav>

            <div className='mt-4 border rounded-lg border-gray-600 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px]'>
              <button
                onClick={handleLogout}
                className='w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors'
              >
                <LogOutIcon className='w-5 h-5' />
                <span className='font-medium'>Log-out</span>
              </button>
            </div>
          </div>
        </div>

                {/* Main Content */}
                <div className='flex-1 pt-[40px] pb-8 xl:pr-[278px] ml-[120px] pr-[40px] bg-gray-900'>
                  <div className="max-w-6xl mx-auto text-center">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                          <div className="text-center p-4 bg-gray-700 rounded-lg border border-gray-600">
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/25">
                              <FileTextIcon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-white mb-2">Attach Workflows</h3>
                            <p className="text-sm text-gray-300">Connect available workflows to your account and configure credentials</p>
                          </div>
                          <div className="text-center p-4 bg-gray-700 rounded-lg border border-gray-600">
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/25">
                              <ClockIcon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-white mb-2">Schedule Execution</h3>
                            <p className="text-sm text-gray-300">Set up cron schedules or one-time executions for your workflows</p>
                          </div>
                          <div className="text-center p-4 bg-gray-700 rounded-lg border border-gray-600">
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/25">
                              <DashBoardIcon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-white mb-2">Monitor Results</h3>
                            <p className="text-sm text-gray-300">Track execution history and receive notifications via multiple channels</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
      </div>

      {/* Mobile Layout */}
      <div className='md:hidden bg-gray-900'>
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4 text-white">Profile</h1>
          <p className="text-gray-300">Profile functionality is under development.</p>
        </div>
      </div>
    </div>
  );
}
