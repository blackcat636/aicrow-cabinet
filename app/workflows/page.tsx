'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowList } from '@/components/workflow/WorkflowList';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { UserWorkflow } from '@/types/workflow';
import { AppLayout } from '@/components/AppLayout';

export default function WorkflowsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<UserWorkflow | undefined>();
  const [showSchedules, setShowSchedules] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);

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
  };

  const handleManageSchedules = (workflowId: number) => {
    setSelectedWorkflowId(workflowId);
    setShowSchedules(true);
  };

  const handleExecuteWorkflow = (workflowId: number) => {
    // This will be handled by WorkflowList component
  };

  return (
    <AppLayout>
      <WorkflowList
        onAddWorkflow={handleAddWorkflow}
        onEditWorkflow={handleEditWorkflow}
        onManageSchedules={handleManageSchedules}
        onExecuteWorkflow={handleExecuteWorkflow}
      />

      {/* Modals */}
      <WorkflowForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        editingWorkflow={editingWorkflow}
      />
    </AppLayout>
  );
}