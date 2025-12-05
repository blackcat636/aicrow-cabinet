'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { workflowApi } from '@/lib/apiWorkflow';
import { WorkflowExecution, AvailableChainsResponse } from '@/types/workflow';
import { ChainToWorkflowModal } from '@/components/workflow/ChainToWorkflowModal';
import { ChainHistory } from '@/components/workflow/ChainHistory';
import { ResultDisplay } from '@/components/workflow/ResultDisplay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { XIcon, CheckIcon, ClockIcon } from '@/components/icons';
import { toast } from 'sonner';

export default function ExecutionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('executions');
  const tWorkflow = useTranslations('workflow');
  const tCommon = useTranslations('common');
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const executionId = Number(params.id);
  
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [availableChains, setAvailableChains] = useState<AvailableChainsResponse | null>(null);
  const [showChainModal, setShowChainModal] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userWorkflowId, setUserWorkflowId] = useState<number | null>(null);

  useEffect(() => {
    if (executionId && isAuthenticated) {
      fetchExecutionDetails();
    }
  }, [executionId, isAuthenticated]);

  useEffect(() => {
    if (execution?.status === 'completed' || execution?.status === '1') {
      fetchAvailableChains();
    }
  }, [execution?.status, executionId]);

  const fetchExecutionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await workflowApi.getExecutionDetails(executionId);
      
      // Handle API response structure - it might be wrapped in {status, data}
      let data: any;
      if (response && typeof response === 'object' && 'data' in response && 'status' in response) {
        data = (response as any).data;
      } else {
        data = response;
      }
      
      setExecution(data);
      
      // Find userWorkflowId if not present in execution data
      if (!data.userWorkflowId && (data.workflowId || (data as any).workflow?.id)) {
        try {
          const workflows = await workflowApi.getMyWorkflows();
          
          // Try to find by workflowId or workflow.id
          const targetWorkflowId = data.workflowId || (data as any).workflow?.id;
          
          const foundWorkflow = workflows.find(w => {
            const matchesWorkflowId = w.workflowId === targetWorkflowId;
            const matchesId = w.id === targetWorkflowId;
            return matchesWorkflowId || matchesId;
          });
          
          if (foundWorkflow) {
            setUserWorkflowId(foundWorkflow.id);
          }
        } catch (err) {
          console.error('Error loading workflows to find userWorkflowId:', err);
        }
      } else if (data.userWorkflowId) {
        setUserWorkflowId(data.userWorkflowId);
      }
    } catch (err: any) {
      console.error('Error loading execution:', err);
      setError(err.message || 'Не вдалося завантажити деталі виконання');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableChains = async () => {
    try {
      const data = await workflowApi.getAvailableChains(executionId);
      setAvailableChains(data);
    } catch (err: any) {
      console.error('Error loading available chains:', err);
      // Don't show error for chains, it's optional
    }
  };

  const handleRestart = async () => {
    try {
      setRestarting(true);
      const data = await workflowApi.restartExecution(executionId);
      
      if (data.id) {
        toast.success('Виконання перезапущено');
        router.push(`/dashboard/executions/${data.id}`, { locale });
      }
    } catch (err: any) {
      toast.error(err.message || 'Не вдалося перезапустити виконання');
    } finally {
      setRestarting(false);
      setShowRestartConfirm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case '1':
        return 'bg-green-900/30 border-green-500/50 text-green-300';
      case 'failed':
      case '2':
        return 'bg-red-900/30 border-red-500/50 text-red-300';
      case 'running':
      case '3':
        return 'bg-blue-900/30 border-blue-500/50 text-blue-300';
      case 'pending':
      case '0':
        return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300';
      default:
        return 'bg-gray-900/30 border-gray-500/50 text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
      case '1':
        return tWorkflow('status.completed');
      case 'failed':
      case '2':
        return tWorkflow('status.failed');
      case 'running':
      case '3':
        return tWorkflow('status.running');
      case 'pending':
      case '0':
        return tWorkflow('status.pending');
      default:
        return tWorkflow('status.unknown');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case '1':
        return <CheckIcon className="w-4 h-4" />;
      case 'failed':
      case '2':
        return <XIcon className="w-4 h-4" />;
      case 'running':
      case '3':
        return <ClockIcon className="w-4 h-4" />;
      case 'pending':
      case '0':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'manual':
        return tWorkflow('triggerType.manual');
      case 'cron':
        return tWorkflow('triggerType.cron');
      case 'scheduled':
        return tWorkflow('triggerType.scheduled');
      case 'telegram':
        return tWorkflow('triggerType.telegram');
      default:
        return type;
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <AppLayout>
        <div className="h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-300">{t('loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-300">{t('loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !execution) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="p-6 bg-red-900/20 rounded-lg border border-red-500/50">
            <p className="text-red-300">{error || t('noExecutions')}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              {tCommon('back')}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isCompleted = execution.status === 'completed' || execution.status === '1';
  const canChain = isCompleted && availableChains && availableChains.availableChains.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Execution Info */}
        <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{t('executionDetailsTitle', { id: execution.id })}</h2>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(execution.status)}`}>
                {getStatusIcon(execution.status)}
                <span className="font-medium">{getStatusLabel(execution.status)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-400">{tWorkflow('workflowId')}:</span>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-white">{execution.workflowId || execution.userWorkflowId}</p>
                  {userWorkflowId && (
                    <button
                      onClick={() => {
                        router.push(`/dashboard/workflows/${userWorkflowId}`, { locale });
                      }}
                      className="px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
                      title={t('viewWorkflow')}
                    >
                      ➡️ {t('viewWorkflow')}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-400">{t('triggerType')}:</span>
                <p className="text-white">{getTriggerTypeLabel(execution.triggerType)}</p>
              </div>
              {execution.startedAt && (
                <div>
                  <span className="text-sm text-gray-400">{t('started')}:</span>
                  <p className="text-white">{new Date(execution.startedAt).toLocaleString(locale)}</p>
                </div>
              )}
              {execution.completedAt && (
                <div>
                  <span className="text-sm text-gray-400">{t('completed')}:</span>
                  <p className="text-white">{new Date(execution.completedAt).toLocaleString(locale)}</p>
                </div>
              )}
              {execution.priceUsd && (
                <div>
                  <span className="text-sm text-gray-400">{t('cost')}:</span>
                  <p className="text-white">{parseFloat(execution.priceUsd).toFixed(4)} USD</p>
                </div>
              )}
            </div>

            {/* Input Data */}
            {execution.inputData && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">{t('inputData')}:</h3>
                <div className="p-3 bg-gray-800/50 rounded border border-gray-700/50">
                  {typeof execution.inputData === 'string' ? (
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
                      {execution.inputData}
                    </pre>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(execution.inputData).map(([key, value]) => (
                        <div key={key} className="text-xs text-gray-300">
                          <span className="font-medium text-gray-400">{key}:</span>{' '}
                          <span className="break-words">
                            {typeof value === 'object' && value !== null
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Result Data */}
            {execution.resultData && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">{t('result')}:</h3>
                <ResultDisplay resultData={execution.resultData} />
              </div>
            )}

            {/* Error Message */}
            {execution.errorMessage && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-red-300 mb-2">{t('error')}:</h3>
                <div className="p-3 bg-red-900/20 rounded border border-red-500/50">
                  <p className="text-sm text-red-300 break-words">{execution.errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Show only if completed */}
        {isCompleted && (
          <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t('actions')}</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowRestartConfirm(true)}
                disabled={restarting}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {restarting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('restarting')}
                  </>
                ) : (
                  <>
                    🔄 {t('restart')}
                  </>
                )}
              </button>

              {canChain && (
                <button
                  onClick={() => setShowChainModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg shadow-purple-500/25"
                >
                  ➡️ {t('chainToWorkflow')}
                </button>
              )}

              {isCompleted && availableChains && availableChains.availableChains.length === 0 && !availableChains.canChainToAny && (
                <div className="w-full p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/50">
                  <p className="text-yellow-300 text-sm">{t('noAvailableChains')}</p>
                  {availableChains.requiresAttachment && (
                    <p className="text-yellow-300 text-sm mt-1">
                      {t('requiresAttachment')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chain History - show for any execution that might have parent or children */}
        <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm p-6">
          <ChainHistory executionId={executionId} isChainExecution={execution.isChainExecution} />
        </div>

        {/* Modals */}
        <ConfirmDialog
          isOpen={showRestartConfirm}
          onClose={() => setShowRestartConfirm(false)}
          onConfirm={handleRestart}
          title={t('restartExecution')}
          message={t('restartExecutionConfirm')}
          confirmText={t('restart')}
          cancelText={tCommon('cancel')}
          type="warning"
        />

        {showChainModal && availableChains && (
          <ChainToWorkflowModal
            isOpen={showChainModal}
            executionId={executionId}
            availableChains={availableChains.availableChains}
            resultData={execution?.resultData}
            onClose={() => setShowChainModal(false)}
            onSuccess={(newExecutionId) => {
              router.push(`/dashboard/executions/${newExecutionId}`, { locale });
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

