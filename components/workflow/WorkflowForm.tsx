'use client';

import React, { useState, useEffect } from 'react';
import { Workflow, AttachWorkflowRequest, CredentialType, CredentialData } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { XIcon, CheckIcon } from '@/components/icons';

interface WorkflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingWorkflow?: any; // UserWorkflow for editing
}

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingWorkflow
}) => {
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<AttachWorkflowRequest>({
    workflowId: 0,
    credentialType: 'telegram',
    credentialData: {},
    inputDataTemplate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadAvailableWorkflows();
      if (editingWorkflow) {
        setFormData({
          workflowId: editingWorkflow.workflowId,
          credentialType: editingWorkflow.credentialType,
          credentialData: editingWorkflow.credentialData,
          inputDataTemplate: editingWorkflow.inputDataTemplate
        });
      } else {
        setFormData({
          workflowId: 0,
          credentialType: 'telegram',
          credentialData: {},
          inputDataTemplate: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, editingWorkflow]);

  const loadAvailableWorkflows = async () => {
    try {
      setLoading(true);
      const workflows = await workflowApi.getAvailableWorkflows();
      const workflowsArray = Array.isArray(workflows) ? workflows : ((workflows as any)?.workflows || (workflows as any)?.data || []);
      setAvailableWorkflows(workflowsArray);
    } catch (err) {
      console.error('Error loading workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.workflowId) {
      newErrors.workflowId = 'Please select a workflow';
    }

    if (!formData.credentialType) {
      newErrors.credentialType = 'Please select a credential type';
    }

    if (formData.credentialType === 'telegram' && !formData.credentialData.chatId) {
      newErrors.chatId = 'Telegram Chat ID is required';
    }

    if (formData.credentialType === 'email' && !formData.credentialData.email) {
      newErrors.email = 'Email address is required';
    }

    if (formData.credentialType === 'webhook' && !formData.credentialData.webhookUrl) {
      newErrors.webhookUrl = 'Webhook URL is required';
    }

    if (!formData.inputDataTemplate.trim()) {
      newErrors.inputDataTemplate = 'Input data template is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingWorkflow) {
        await workflowApi.updateUserWorkflow(editingWorkflow.id, formData);
      } else {
        await workflowApi.attachWorkflow(formData.workflowId, formData);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving workflow:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCredentialTypeChange = (type: CredentialType) => {
    setFormData({
      ...formData,
      credentialType: type,
      credentialData: {}
    });
  };

  const handleCredentialDataChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      credentialData: {
        ...formData.credentialData,
        [field]: value
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {editingWorkflow ? 'Edit Workflow' : 'Attach New Workflow'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-red-900/20"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Workflow Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Workflow *
            </label>
            {loading ? (
              <div className="p-3 bg-gray-800 rounded border border-gray-600 text-center text-gray-300">
                Loading workflows...
              </div>
            ) : (
              <select
                value={formData.workflowId}
                onChange={(e) => setFormData({ ...formData, workflowId: parseInt(e.target.value) })}
                className={`w-full p-3 border rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.workflowId ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value={0} className="bg-gray-800">Choose a workflow...</option>
                {availableWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id} className="bg-gray-800">
                    {workflow.name} - {workflow.description}
                  </option>
                ))}
              </select>
            )}
            {errors.workflowId && (
              <p className="mt-1 text-sm text-red-400">{errors.workflowId}</p>
            )}
          </div>

          {/* Credential Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Credential Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['telegram', 'email', 'webhook'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleCredentialTypeChange(type as CredentialType)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    formData.credentialType === type
                      ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'border-gray-600 hover:bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium capitalize">{type}</div>
                </button>
              ))}
            </div>
            {errors.credentialType && (
              <p className="mt-1 text-sm text-red-400">{errors.credentialType}</p>
            )}
          </div>

          {/* Credential Data */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {formData.credentialType === 'telegram' && 'Telegram Chat ID *'}
              {formData.credentialType === 'email' && 'Email Address *'}
              {formData.credentialType === 'webhook' && 'Webhook URL *'}
            </label>
            <input
              type={formData.credentialType === 'email' ? 'email' : 'text'}
              value={
                formData.credentialType === 'telegram' ? formData.credentialData.chatId || '' :
                formData.credentialType === 'email' ? formData.credentialData.email || '' :
                formData.credentialData.webhookUrl || ''
              }
              onChange={(e) => {
                const field = formData.credentialType === 'telegram' ? 'chatId' :
                           formData.credentialType === 'email' ? 'email' : 'webhookUrl';
                handleCredentialDataChange(field, e.target.value);
              }}
              placeholder={
                formData.credentialType === 'telegram' ? 'Enter Telegram Chat ID' :
                formData.credentialType === 'email' ? 'Enter email address' :
                'Enter webhook URL'
              }
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors[formData.credentialType === 'telegram' ? 'chatId' : 
                      formData.credentialType === 'email' ? 'email' : 'webhookUrl'] 
                  ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors[formData.credentialType === 'telegram' ? 'chatId' : 
                   formData.credentialType === 'email' ? 'email' : 'webhookUrl'] && (
              <p className="mt-1 text-sm text-red-400">
                {errors[formData.credentialType === 'telegram' ? 'chatId' : 
                       formData.credentialType === 'email' ? 'email' : 'webhookUrl']}
              </p>
            )}
          </div>

          {/* Input Data Template */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Input Data Template *
            </label>
            <textarea
              value={formData.inputDataTemplate}
              onChange={(e) => setFormData({ ...formData, inputDataTemplate: e.target.value })}
              placeholder='{"userId": "{userId}", "action": "daily_report"}'
              rows={4}
              className={`w-full p-3 border rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm ${
                errors.inputDataTemplate ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            <p className="mt-1 text-xs text-gray-400">
              JSON template for workflow input data. Use {"{userId}"} for dynamic user ID.
            </p>
            {errors.inputDataTemplate && (
              <p className="mt-1 text-sm text-red-400">{errors.inputDataTemplate}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-500/25"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {editingWorkflow ? 'Updating...' : 'Attaching...'}
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  {editingWorkflow ? 'Update Workflow' : 'Attach Workflow'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
