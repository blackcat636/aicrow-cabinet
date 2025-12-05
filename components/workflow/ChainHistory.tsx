'use client';

import React, { useState, useEffect } from 'react';
import { workflowApi } from '@/lib/apiWorkflow';
import { ChainHistoryData, WorkflowExecution } from '@/types/workflow';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

interface ChainHistoryProps {
  executionId: number;
  isChainExecution?: boolean;
}

interface ExecutionCardProps {
  execution: WorkflowExecution;
  isCurrent?: boolean;
  onClick?: () => void;
}

const ExecutionCard: React.FC<ExecutionCardProps> = ({ execution, isCurrent, onClick }) => {
  const t = useTranslations('executions');
  const tWorkflow = useTranslations('workflow');
  
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

  return (
    <div
      className={`p-4 rounded-lg border ${getStatusColor(execution.status)} ${
        isCurrent ? 'ring-2 ring-purple-500' : ''
      } ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Виконання #{execution.id}</span>
          {isCurrent && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
              {t('currentExecution')}
            </span>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded border">
          {getStatusLabel(execution.status)}
        </span>
      </div>
      {execution.startedAt && (
        <div className="text-xs opacity-75 mt-1">
          Почато: {new Date(execution.startedAt).toLocaleString('uk-UA')}
        </div>
      )}
      {execution.completedAt && (
        <div className="text-xs opacity-75 mt-1">
          Завершено: {new Date(execution.completedAt).toLocaleString('uk-UA')}
        </div>
      )}
    </div>
  );
};

export const ChainHistory: React.FC<ChainHistoryProps> = ({ executionId, isChainExecution = false }) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('executions');
  const [chainData, setChainData] = useState<ChainHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always fetch chain history to check if there are parent or children executions
    fetchChainHistory();
  }, [executionId]);

  const fetchChainHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getExecutionChain(executionId);
      setChainData(data);
    } catch (err: any) {
      // Silently handle errors - execution might not have chain history
      console.debug('Could not load chain history:', err.message);
      setChainData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show loading state, just return nothing
  }

  if (error) {
    return null; // Don't show error state, just return nothing
  }

  if (!chainData) {
    return null;
  }

  const hasParent = chainData.parent !== null;
  const hasChildren = chainData.children && chainData.children.length > 0;

  // Only render if there's a parent or children (or if this is marked as chain execution)
  if (!hasParent && !hasChildren && !isChainExecution) {
    return null;
  }

  return (
    <div className="chain-history space-y-4">
      <h3 className="text-lg font-semibold text-white">{t('chainHistory')}</h3>
      
      <div className="space-y-4">
        {/* Parent Execution */}
        {hasParent && (
          <div className="chain-item">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-gray-400 text-xl">⬆️</div>
              <span className="text-sm text-gray-400">{t('parentExecution')}</span>
            </div>
            <ExecutionCard
              execution={chainData.parent!}
              onClick={() => router.push(`/dashboard/executions/${chainData.parent!.id}`, { locale })}
            />
          </div>
        )}

        {/* Current Execution */}
        <div className="chain-item">
          {hasParent && (
            <div className="flex items-center gap-3 mb-2">
              <div className="text-gray-400 text-xl">↓</div>
              <span className="text-sm text-gray-400">{t('currentExecution')}</span>
            </div>
          )}
          <ExecutionCard
            execution={chainData.execution}
            isCurrent
          />
        </div>

        {/* Children Executions */}
        {hasChildren && (
          <div className="chain-item">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-gray-400 text-xl">⬇️</div>
              <span className="text-sm text-gray-400">{t('childExecutions')}</span>
            </div>
            <div className="space-y-3">
              {chainData.children.map((child, index) => (
                <div key={child.id}>
                  <ExecutionCard
                    execution={child}
                    onClick={() => router.push(`/dashboard/executions/${child.id}`, { locale })}
                  />
                  {index < chainData.children.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-px h-4 bg-gray-600"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

