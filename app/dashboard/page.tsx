'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowList } from '@/components/workflow/WorkflowList';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { WorkflowExecuteModal } from '@/components/workflow/WorkflowExecuteModal';
import { UserWorkflow } from '@/types/workflow';
import { AppLayout } from '@/components/AppLayout';
import { workflowApi } from '@/lib/apiWorkflow';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<UserWorkflow | undefined>();
  const [showSchedules, setShowSchedules] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [executingWorkflowId, setExecutingWorkflowId] = useState<number | null>(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [executeModalWorkflowId, setExecuteModalWorkflowId] = useState<number | null>(null);
  const [executeModalWorkflowName, setExecuteModalWorkflowName] = useState<string>('');

  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
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
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  const handleManageSchedules = (workflowId: number) => {
    setSelectedWorkflowId(workflowId);
    setShowSchedules(true);
  };

  const handleViewDetails = (workflowId: number) => {
    router.push(`/dashboard/workflows/${workflowId}`);
  };

  const handleExecuteWorkflow = async (workflowId: number) => {
    try {
      // Get the workflow to check if it's active
      const workflows = await workflowApi.getMyWorkflows();
      const workflow = workflows.find(w => w.id === workflowId);
      
      if (!workflow) {
        toast.error('Workflow not found');
        return;
      }

      // Check if workflow is active
      if (!workflow.isActive) {
        toast.error('Cannot execute inactive workflow. Please activate the workflow first.');
        return;
      }

      // Open modal with workflow info
      setExecuteModalWorkflowId(workflow.workflowId);
      setExecuteModalWorkflowName(workflow.name || workflow.workflow.name);
      setShowExecuteModal(true);
    } catch (error: any) {
      console.error('Error loading workflow:', error);
      toast.error('Failed to load workflow information');
    }
  };

  const handleExecuteWithPayload = async (payload?: Record<string, any>) => {
    if (!executeModalWorkflowId) return;
    
    try {
      setExecutingWorkflowId(executeModalWorkflowId);
      
      // Build request data
      const requestData: any = {};
      
      if (payload && Object.keys(payload).length > 0) {
        requestData.payload = payload;
      } else {
        // If no payload, get workflow and use inputDataTemplate as fallback
        const workflows = await workflowApi.getMyWorkflows();
        const workflow = workflows.find(w => w.workflowId === executeModalWorkflowId);
        if (workflow) {
          const inputData = workflow.inputDataTemplate || '{"message": "Hello", "timestamp": "' + new Date().toISOString() + '"}';
          requestData.inputData = inputData;
        }
      }
      
      // Execute the workflow
      await workflowApi.executeWorkflowManually(executeModalWorkflowId, requestData);
      
      toast.success('Workflow executed successfully!');
      setRefreshTrigger(prev => prev + 1); // Refresh the list
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      
      // Handle validation errors from backend
      if (error.message && typeof error.message === 'string' && error.message.includes('errors')) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorData.errors.forEach((err: string) => {
              toast.error(err);
            });
            return;
          }
        } catch {
          // If parsing fails, continue with normal error handling
        }
      }
      
      // Handle specific error messages
      if (error.message && error.message.includes('Workflow is not active')) {
        toast.error('Cannot execute inactive workflow. Please activate the workflow first.');
      } else if (error.message && error.message.includes('No active webhook found')) {
        toast.error('No active webhook found for this workflow. Please check your webhook configuration in the workflow settings.');
      } else if (error.message && error.message.includes('404')) {
        toast.error('Workflow endpoint not found. Please check your webhook URL configuration.');
      } else {
        toast.error(error.message || 'Failed to execute workflow');
      }
      throw error; // Re-throw to let modal handle it
    } finally {
      setExecutingWorkflowId(null);
    }
  };

  return (
    <AppLayout>
      <WorkflowList
        onAddWorkflow={handleAddWorkflow}
        onEditWorkflow={handleEditWorkflow}
        onManageSchedules={handleManageSchedules}
        onExecuteWorkflow={handleExecuteWorkflow}
        onViewDetails={handleViewDetails}
        refreshTrigger={refreshTrigger}
        executingWorkflowId={executingWorkflowId}
      />

      {/* Modals */}
      <WorkflowForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        editingWorkflow={editingWorkflow}
      />

      {/* Execute Workflow Modal */}
      {executeModalWorkflowId && (
        <WorkflowExecuteModal
          isOpen={showExecuteModal}
          onClose={() => {
            setShowExecuteModal(false);
            setExecuteModalWorkflowId(null);
            setExecuteModalWorkflowName('');
          }}
          onExecute={handleExecuteWithPayload}
          workflowId={executeModalWorkflowId}
          workflowName={executeModalWorkflowName}
        />
      )}
    </AppLayout>
  );
}


