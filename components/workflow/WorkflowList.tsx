'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserWorkflow } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { WorkflowCard } from './WorkflowCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PlusIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';

interface WorkflowListProps {
  onAddWorkflow: () => void;
  onEditWorkflow: (workflow: UserWorkflow) => void;
  onManageSchedules: (workflowId: number) => void;
  onExecuteWorkflow: (workflowId: number) => void;
  onViewDetails: (workflowId: number) => void; // Add view details handler
  refreshTrigger?: number; // Add refresh trigger
  executingWorkflowId?: number | null; // Add executing state
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  onAddWorkflow,
  onEditWorkflow,
  onManageSchedules,
  onExecuteWorkflow,
  onViewDetails,
  refreshTrigger,
  executingWorkflowId
}) => {
  const { isAuthenticated } = useAuth();
  const [workflows, setWorkflows] = useState<UserWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    workflowId: number | null;
    workflowName: string;
  }>({
    isOpen: false,
    workflowId: null,
    workflowName: ''
  });

  const isMountedRef = React.useRef(false);
  const prevRefreshTriggerRef = React.useRef<number | undefined>(undefined);

  const loadWorkflows = React.useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setWorkflows([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const data = await workflowApi.getMyWorkflows();
      const workflowsArray = Array.isArray(data) ? data : ((data as any)?.userWorkflows || (data as any)?.data || []);
      setWorkflows(workflowsArray);
    } catch (err) {
      setError('Failed to load workflows');
      console.error('Error loading workflows:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load workflows once after authentication is confirmed (guards StrictMode double invoke)
  useEffect(() => {
    if (isAuthenticated && !isMountedRef.current) {
      isMountedRef.current = true;
      loadWorkflows();
    }
  }, [isAuthenticated, loadWorkflows]);

  // Refresh when refreshTrigger changes (but not on initial mount when it's 0)
  useEffect(() => {
    if (isMountedRef.current && refreshTrigger !== undefined && prevRefreshTriggerRef.current !== refreshTrigger) {
      prevRefreshTriggerRef.current = refreshTrigger;
      loadWorkflows();
    }
  }, [refreshTrigger, loadWorkflows]);

  const handleToggle = useCallback(async (id: number) => {
    try {
      await workflowApi.toggleUserWorkflow(id);
      await loadWorkflows(); // Reload to get updated data
    } catch (err) {
      console.error('Error toggling workflow:', err);
    }
  }, [loadWorkflows]);

  const handleDelete = useCallback((id: number, name: string) => {
    setDeleteDialog({
      isOpen: true,
      workflowId: id,
      workflowName: name
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteDialog.workflowId) {
      try {
        await workflowApi.deleteUserWorkflow(deleteDialog.workflowId);
        await loadWorkflows(); // Reload to get updated data
      } catch (err) {
        console.error('Error deleting workflow:', err);
      }
    }
    setDeleteDialog({ isOpen: false, workflowId: null, workflowName: '' });
  }, [deleteDialog.workflowId, loadWorkflows]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    if (workflows.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0
      };
    }
    
    return {
      total: workflows.length,
      active: workflows.filter(w => w.isActive).length,
      inactive: workflows.filter(w => !w.isActive).length
    };
  }, [workflows]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog({ isOpen: false, workflowId: null, workflowName: '' });
  }, []);

  const deleteMessage = useMemo(() => 
    `Are you sure you want to delete the workflow "${deleteDialog.workflowName}"? This action cannot be undone.`,
    [deleteDialog.workflowName]
  );

  // Skeleton loader component - reserves space to prevent layout shift
  const SkeletonLoader = () => (
    <div className="space-y-6 relative min-h-[400px]">
      <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
        {/* Header skeleton - reserves space for header with fixed height */}
        <div className="flex items-center justify-between p-6 min-h-[100px]">
          <div className="ml-6">
            <div className="h-8 w-48 bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-64 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="mr-6">
            <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        {/* Cards skeleton - reserves space for 2 cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
                <div className="bg-black rounded-lg p-5 h-64 animate-pulse">
                  <div className="h-6 w-3/4 bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-5/6 bg-gray-700 rounded mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-20 bg-gray-700 rounded"></div>
                    <div className="h-6 w-16 bg-gray-700 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-700 rounded"></div>
                    <div className="h-4 w-4/5 bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadWorkflows}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors mx-auto shadow-lg shadow-purple-500/25"
        >
          <PlusIcon className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative min-h-[400px]">
      {/* Stats */}
      {workflows.length > 0 && (
        <div className="bg-[#141519]/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {stats.total}
              </div>
              <div className="text-sm text-gray-300">Total Workflows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <div className="text-sm text-gray-300">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.inactive}
              </div>
              <div className="text-sm text-gray-300">Inactive</div>
            </div>
          </div>
        </div>
      )}

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
          {/* Header - fixed height to prevent layout shift */}
          <div className="flex items-center justify-between p-6 min-h-[100px]">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">My Workflows</h2>
              <p className="text-gray-300 mt-1">Create, manage and run your workflows</p>
            </div>
            {/* No header button when empty */}
            <div className="mr-6" />
          </div>
          <div className="p-6">
            <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
              <div className="bg-black rounded-lg p-10 text-center h-full w-full">
              <button
                onClick={onAddWorkflow}
                aria-label="Add Workflow"
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25 hover:opacity-90 transition"
              >
                <PlusIcon className="w-8 h-8" />
              </button>
              <h3 className="text-lg font-medium text-white mb-2">No workflows yet</h3>
              <p className="text-gray-300">Get started by attaching your first workflow to automate your tasks.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
          {/* Header - fixed height to prevent layout shift */}
          <div className="flex items-center justify-between p-6 min-h-[100px]">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">My Workflows</h2>
              <p className="text-gray-300 mt-1">Create, manage and run your workflows</p>
            </div>
            <div className="flex items-center gap-3 mr-6">
              <button
                onClick={onAddWorkflow}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
              >
                <PlusIcon className="w-4 h-4" />
                Add Workflow
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onToggle={handleToggle}
                onEdit={onEditWorkflow}
                onDelete={(id, name) => handleDelete(id, name)}
                onExecute={onExecuteWorkflow}
                onManageSchedules={onManageSchedules}
                onViewDetails={onViewDetails}
                isExecuting={executingWorkflowId === workflow.id}
              />
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Workflow"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};
