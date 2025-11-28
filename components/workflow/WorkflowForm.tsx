'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Workflow, AttachWorkflowRequest, CredentialType, CredentialData } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { telegramApi } from '@/lib/apiTelegram';
import { TelegramStatusResponse } from '@/types/telegram';
import { XIcon, CheckIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface WorkflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingWorkflow?: any; // UserWorkflow for editing
  preselectedWorkflow?: Workflow; // Preselected workflow from workflows page
}

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingWorkflow,
  preselectedWorkflow
}) => {
  const t = useTranslations('workflowForm');
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusResponse['data'] | null>(null);
  
  const [formData, setFormData] = useState<AttachWorkflowRequest>({
    workflowId: 0,
    name: '',
    description: '',
    credentialType: 'telegram',
    credentialData: {},
    inputDataTemplate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  // Get selected workflow details - prioritize preselected workflow, then check editingWorkflow.workflow, then formData.workflowId
  const selectedWorkflow = preselectedWorkflow 
    || (editingWorkflow?.workflow ? {
        id: editingWorkflow.workflow.id,
        name: editingWorkflow.workflow.name,
        description: editingWorkflow.workflow.description,
        priceUsd: editingWorkflow.workflow.priceUsd
      } as Workflow : null)
    || availableWorkflows.find(w => w.id === formData.workflowId);
  
  // Check if we're editing and have a workflow selected
  const isWorkflowSelected = editingWorkflow && formData.workflowId > 0 && (selectedWorkflow || editingWorkflow?.workflow);

  useEffect(() => {
    if (isOpen) {
      // Always load available workflows when editing to find the workflow
      if (!preselectedWorkflow || editingWorkflow) {
        loadAvailableWorkflows();
      }
      // Load telegram status
      telegramApi.getStatus()
        .then(response => setTelegramStatus(response.data))
        .catch(() => setTelegramStatus({ isLinked: false, notificationsEnabled: false }));
      if (editingWorkflow) {
        setFormData({
          workflowId: editingWorkflow.workflowId,
          name: editingWorkflow.name || '',
          description: editingWorkflow.description || '',
          credentialType: editingWorkflow.credentialType,
          credentialData: editingWorkflow.credentialData || {},
          inputDataTemplate: editingWorkflow.inputDataTemplate
        });
        setIsActive(editingWorkflow.isActive || false);
      } else if (preselectedWorkflow) {
        setFormData({
          workflowId: preselectedWorkflow.id,
          name: '',
          description: '',
          credentialType: 'telegram',
          credentialData: {},
          inputDataTemplate: ''
        });
        setIsActive(false); // New workflows start inactive
      } else {
        setFormData({
          workflowId: 0,
          name: '',
          description: '',
          credentialType: 'telegram',
          credentialData: {},
          inputDataTemplate: ''
        });
        setIsActive(false);
      }
      setErrors({});
    }
  }, [isOpen, editingWorkflow, preselectedWorkflow]);

  // On Esc show confirmation instead of closing immediately
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [isOpen]);

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
      newErrors.workflowId = t('selectWorkflowRequired');
    }

    // Credential validation removed - using default values

    // Validate length limits
    if (formData.name && formData.name.length > 100) {
      newErrors.name = t('nameMaxLength');
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = t('descriptionMaxLength');
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
      
      // Ensure credentialData has chatId for telegram
      if (formData.credentialType === 'telegram' && !formData.credentialData.chatId) {
        // Try to get chatId from telegram status if available
        // For now, we'll use empty object and let backend handle it
        formData.credentialData = formData.credentialData || {};
      }
      
      if (editingWorkflow) {
        await workflowApi.updateUserWorkflow(editingWorkflow.id, formData);
        // Toggle active status if changed
        if (isActive !== editingWorkflow.isActive) {
          await workflowApi.toggleUserWorkflow(editingWorkflow.id);
        }
      } else {
        const newWorkflow = await workflowApi.attachWorkflow(formData);
        // Activate workflow if isActive is true
        if (isActive && newWorkflow.id) {
          await workflowApi.toggleUserWorkflow(newWorkflow.id);
        }
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

  return createPortal(
    <>
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
      onClick={(e) => {
        // Open confirm dialog when clicking on overlay (background)
        if (e.target === e.currentTarget) {
          setConfirmOpen(true);
        }
      }}
    >
      <div 
        className="p-[1px] rounded-2xl bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => {
          // Prevent closing when clicking inside modal
          e.stopPropagation();
        }}
      >
        <div className="bg-[#141519] rounded-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/10 to-transparent">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
              {editingWorkflow ? t('editWorkflow') : t('attachNewWorkflow')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-400 transition-all rounded-full hover:bg-red-900/20 hover:scale-110"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

        {/* Form Container */}
        <div className="flex flex-col flex-1 min-h-0 bg-[#141519]">
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Workflow Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('selectWorkflow')} *
            </label>
            {preselectedWorkflow || isWorkflowSelected ? (
              <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)]">
                <div className="p-3 rounded-lg bg-[#141519] border border-purple-500/20 text-white flex items-center justify-between">
                  <span className="text-left truncate w-full font-medium" title={selectedWorkflow?.name || editingWorkflow?.workflow?.name}>
                    {selectedWorkflow?.name || editingWorkflow?.workflow?.name || t('loading')}
                  </span>
                  <svg className="w-4 h-4 flex-shrink-0 ml-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ) : loading ? (
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                  <span className="text-gray-300">{t('loadingWorkflows')}</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  className={`w-full p-3.5 border rounded-lg bg-gray-800/50 text-white flex items-center justify-between overflow-hidden transition-all hover:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    errors.workflowId ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <span className="text-left truncate w-full" title={selectedWorkflow ? selectedWorkflow.name : undefined}>
                    {selectedWorkflow ? selectedWorkflow.name : t('chooseWorkflow')}
                  </span>
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isSelectOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsSelectOpen(false)}
                    ></div>
                    <div className="absolute z-20 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, workflowId: 0 });
                          setIsSelectOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-purple-900/20 transition-colors border-b border-gray-700/50"
                      >
                        <span className="text-gray-300 font-medium">{t('chooseWorkflow')}</span>
                      </button>
                      {availableWorkflows.map((workflow) => (
                        <button
                          key={workflow.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, workflowId: workflow.id });
                            setIsSelectOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-purple-900/20 transition-colors border-b border-gray-700/50 last:border-b-0"
                        >
                          <div className="text-white font-medium truncate" title={workflow.name}>{workflow.name}</div>
                          {workflow.description && (
                            <div className="text-gray-400 text-sm mt-1 break-words">
                              {workflow.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {errors.workflowId && (
              <p className="mt-1 text-sm text-red-400">{errors.workflowId}</p>
            )}
          </div>

          {/* Selected Workflow Info */}
          {selectedWorkflow && (
            <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)]">
              <div className="p-4 rounded-lg bg-[#141519] border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-300">{t('price')}:</span>
                {selectedWorkflow.priceUsd ? (
                  <div className="px-4 py-1.5 bg-green-900/30 border border-green-500/50 rounded-lg text-green-300 text-sm font-semibold shadow-lg shadow-green-500/20">
                    {parseFloat(selectedWorkflow.priceUsd).toFixed(2)}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">{t('noPrice')}</div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Workflow Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('customWorkflowName')}
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('customWorkflowNamePlaceholder')}
              maxLength={100}
              className={`w-full p-3.5 border rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-600 hover:border-gray-500'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              <p className={`text-xs ${errors.name ? 'text-red-400' : 'text-gray-400'}`}>
                {errors.name || t('customWorkflowNameHint')}
              </p>
              <p className="text-xs text-gray-500">
                {(formData.name || '').length}/100
              </p>
            </div>
          </div>

          {/* Custom Workflow Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('customWorkflowDescription')}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('customWorkflowDescriptionPlaceholder')}
              rows={3}
              maxLength={500}
              className={`w-full p-3.5 border rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-600 hover:border-gray-500'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              <p className={`text-xs ${errors.description ? 'text-red-400' : 'text-gray-400'}`}>
                {errors.description || t('customWorkflowDescriptionHint')}
              </p>
              <p className="text-xs text-gray-500">
                {(formData.description || '').length}/500
              </p>
            </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-700/50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800/50 hover:border-gray-500 transition-all font-medium"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {editingWorkflow ? t('updating') : t('attaching')}
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  {editingWorkflow ? t('updateWorkflow') : t('attachWorkflow')}
                </>
              )}
            </button>
          </div>
        </form>
        </div>
        </div>
      </div>
    </div>
    <ConfirmDialog
      isOpen={confirmOpen}
      onClose={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false);
        onClose();
      }}
      title={t('discardChanges')}
      message={t('discardChangesMessage')}
      confirmText={t('discard')}
      cancelText={t('keepEditing')}
      type="warning"
    />
    </>,
    typeof document !== 'undefined' ? document.body : ({} as any)
  ) as unknown as JSX.Element;
};
