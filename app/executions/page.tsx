'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ExecutionHistory } from '@/components/workflow/ExecutionHistory';
import { AppLayout } from '@/components/AppLayout';

export default function ExecutionsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  return (
    <AppLayout>
      <ExecutionHistory />
    </AppLayout>
  );
}
