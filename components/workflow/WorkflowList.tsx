'use client';

import React, { useState, useEffect } from 'react';
import { UserWorkflow } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { WorkflowCard } from './WorkflowCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PlusIcon } from '@/components/icons';

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

  const loadWorkflows = async () => {
    try {
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
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadWorkflows();
    }
  }, [refreshTrigger]);

  const handleToggle = async (id: number) => {
    try {
      await workflowApi.toggleUserWorkflow(id);
      await loadWorkflows(); // Reload to get updated data
    } catch (err) {
      console.error('Error toggling workflow:', err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    setDeleteDialog({
      isOpen: true,
      workflowId: id,
      workflowName: name
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.workflowId) {
      try {
        await workflowApi.deleteUserWorkflow(deleteDialog.workflowId);
        await loadWorkflows(); // Reload to get updated data
      } catch (err) {
        console.error('Error deleting workflow:', err);
      }
    }
    setDeleteDialog({ isOpen: false, workflowId: null, workflowName: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading workflows...</p>
        </div>
      </div>
    );
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
    <div className="space-y-6">
      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-[#141519]">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
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
        <div className="rounded-lg border border-gray-700 bg-[#141519]">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
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

      {/* Stats */}
      {workflows.length > 0 && (
        <div className="bg-[#141519] rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {workflows.length}
              </div>
              <div className="text-sm text-gray-300">Total Workflows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {workflows.filter(w => w.isActive).length}
              </div>
              <div className="text-sm text-gray-300">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {workflows.filter(w => !w.isActive).length}
              </div>
              <div className="text-sm text-gray-300">Inactive</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, workflowId: null, workflowName: '' })}
        onConfirm={confirmDelete}
        title="Delete Workflow"
        message={`Are you sure you want to delete the workflow "${deleteDialog.workflowName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};
