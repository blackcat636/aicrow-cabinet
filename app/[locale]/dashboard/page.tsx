'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowList } from '@/components/workflow/WorkflowList';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { WorkflowExecuteModal } from '@/components/workflow/WorkflowExecuteModal';
import { UserWorkflow } from '@/types/workflow';
import { UserAutomation } from '@/lib/apiAutomation';
import { AppLayout } from '@/components/AppLayout';
import { workflowApi } from '@/lib/apiWorkflow';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tWorkflow = useTranslations('workflow');
  const tCommon = useTranslations('common');
  
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<UserWorkflow | undefined>();
  const [showSchedules, setShowSchedules] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [executingWorkflowId, setExecutingWorkflowId] = useState<number | null>(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [executeModalWorkflowId, setExecuteModalWorkflowId] = useState<number | null>(null);
  const [executeModalWorkflowName, setExecuteModalWorkflowName] = useState<string>('');
  const [executeUserWorkflowId, setExecuteUserWorkflowId] = useState<number | null>(null);

  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-300">{tCommon('loading')}</p>
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

  const handleGoToAutomation = (automation: UserAutomation) => {
    const url = automation.goToUrl || automation.link;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.info(t('automationGoToNotConfigured'));
    }
  };

  const handleExecuteWorkflow = async (workflowId: number) => {
    try {
      // Get the workflow to check if it's active
      const workflows = await workflowApi.getMyWorkflows();
      const workflow = workflows.find(w => w.id === workflowId);
      
      if (!workflow) {
        toast.error(t('workflowNotFound'));
        return;
      }

      // Check if workflow is active
      if (!workflow.isActive) {
        toast.error(t('executeErrorInactive'));
        return;
      }

      // Open modal with workflow info
      setExecuteModalWorkflowId(workflow.workflowId);
      setExecuteUserWorkflowId(workflow.id);
      setExecuteModalWorkflowName(workflow.name || workflow.workflow.name);
      setShowExecuteModal(true);
    } catch (error: any) {
      console.error('Error loading workflow:', error);
      toast.error(t('executeError'));
    }
  };

  const handleExecuteWithPayload = async (payload?: Record<string, any>) => {
    if (!executeUserWorkflowId) return;
    
    try {
      setExecutingWorkflowId(executeUserWorkflowId);
      
      // Build request data
      const requestData: any = {};
      
      if (payload && Object.keys(payload).length > 0) {
        requestData.payload = payload;
      } else {
        // If no payload, get workflow and use inputDataTemplate as fallback
        const workflows = await workflowApi.getMyWorkflows();
        const workflow = workflows.find(w => w.id === executeUserWorkflowId);
        if (workflow) {
      const inputData = workflow.inputDataTemplate || '{"message": "Hello", "timestamp": "' + new Date().toISOString() + '"}';
          requestData.inputData = inputData;
        }
      }
      
      // Execute the workflow
      await workflowApi.executeWorkflowManually(executeUserWorkflowId, requestData);
      
      toast.success(t('executeSuccess'));
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      
      const errorMessage = error?.message || String(error) || t('executeError');
      
      // Handle validation errors (array of errors)
      if (typeof errorMessage === 'string' && errorMessage.includes('errors')) {
        try {
          const errorData = JSON.parse(errorMessage);
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorData.errors.forEach((err: string) => {
              toast.error(err);
            });
            return;
          }
        } catch (parseErr) {
          // If parsing fails, continue with normal error handling
        }
      }
      
      // Handle specific error messages
      if (errorMessage.includes('Workflow is not active') || errorMessage.includes('not active')) {
        toast.error(t('executeErrorInactive'));
      } else if (errorMessage.includes('No active webhook found') || errorMessage.includes('webhook')) {
        toast.error(t('executeErrorNoWebhook'));
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error(t('executeErrorNotFound'));
      } else {
        toast.error(errorMessage);
      }
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
        onGoToAutomation={handleGoToAutomation}
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
            setExecuteUserWorkflowId(null);
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


