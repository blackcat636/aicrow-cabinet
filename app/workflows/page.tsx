'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowList } from '@/components/workflow/WorkflowList';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { UserWorkflow } from '@/types/workflow';
import {
  FileTextIcon,
  LogOutIcon,
  DashBoardIcon,
  ClockIcon
} from '@/components/icons';

export default function WorkflowsPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<UserWorkflow | undefined>();
  const [showSchedules, setShowSchedules] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to access workflows.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleAddWorkflow = () => {
    setEditingWorkflow(undefined);
    setShowForm(true);
  };

  const handleEditWorkflow = (workflow: UserWorkflow) => {
    setEditingWorkflow(workflow);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingWorkflow(undefined);
    // The WorkflowList component will automatically refresh
  };

  const handleManageSchedules = (workflowId: number) => {
    setSelectedWorkflowId(workflowId);
    setShowSchedules(true);
  };

  const handleExecuteWorkflow = (workflowId: number) => {
    // TODO: Implement execution modal or redirect to execution page
    console.log('Execute workflow:', workflowId);
  };

  return (
    <div className='min-h-screen bg-gray-900'>
      {/* Desktop Layout */}
      <div className='hidden md:flex min-h-screen ml-8'>
        {/* Sidebar */}
        <div className='w-[320px] xl:w-[360px] 2xl:w-[390px] 3xl:w-[420px] 4xl:w-[450px] pt-[40px] bg-gray-800 shadow-sm border-r border-gray-700 flex-shrink-0'>
          <div>
            <div className='text-center mb-6 border rounded-lg border-gray-600 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px] p-5 bg-gray-700'>
              <div className='w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3'>
                <span className='text-white text-lg font-semibold'>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <h2 className='text-lg font-semibold text-white'>
                {user?.username || 'User'}
              </h2>
              <div className='bg-purple-600 text-white px-2 py-1 rounded text-sm mt-1 inline-block'>
                {user?.role || 'User'}
              </div>
            </div>

            <nav className='space-y-2 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px]'>
              <Link
                href="/"
                className='w-full flex items-center gap-3 p-3 rounded-lg border text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-gray-600'
              >
                <DashBoardIcon className='w-5 h-5' />
                <span className='font-medium'>Dashboard</span>
              </Link>
              <div className='w-full flex items-center gap-3 p-3 rounded-lg border bg-purple-600 text-white border-l-4 border-purple-500 transition-colors shadow-lg shadow-purple-500/25'>
                <FileTextIcon className='w-5 h-5' />
                <span className='font-medium'>Workflows</span>
              </div>
              <Link
                href="/executions"
                className='w-full flex items-center gap-3 p-3 rounded-lg border text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-gray-600'
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
          <div className="max-w-7xl mx-auto">
            <WorkflowList
              onAddWorkflow={handleAddWorkflow}
              onEditWorkflow={handleEditWorkflow}
              onManageSchedules={handleManageSchedules}
              onExecuteWorkflow={handleExecuteWorkflow}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className='md:hidden bg-gray-900'>
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4 text-white">Workflows</h1>
          <p className="text-gray-300">Workflow functionality is under development for mobile.</p>
        </div>
      </div>

      {/* Modals */}
      <WorkflowForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        editingWorkflow={editingWorkflow}
      />
    </div>
  );
}
