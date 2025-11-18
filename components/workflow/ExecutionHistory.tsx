'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowExecution, ExecutionsResponse } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { Badge } from '@/components/ui/badge';
import {
  ClockIcon,
  CheckIcon, 
  XIcon, 
  PlayIcon,
  EyeIcon
} from '@/components/icons';
import { useTranslations } from 'next-intl';

// Move helper functions outside component to prevent recreation
const getStatusColor = (status: string) => {
  switch (status) {
    case '1':
    case 'completed':
      return 'bg-green-600 text-white';
    case '2':
    case 'failed':
      return 'bg-red-600 text-white';
    case '3':
    case 'running':
      return 'bg-purple-600 text-white';
    case '0':
    case 'pending':
      return 'bg-yellow-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case '1':
    case 'completed':
      return <CheckIcon className="w-4 h-4" />;
    case '2':
    case 'failed':
      return <XIcon className="w-4 h-4" />;
    case '3':
    case 'running':
      return <PlayIcon className="w-4 h-4" />;
    case '0':
    case 'pending':
      return <ClockIcon className="w-4 h-4" />;
    default:
      return <ClockIcon className="w-4 h-4" />;
  }
};

export const ExecutionHistory: React.FC = () => {
  const router = useRouter();
  const t = useTranslations('executions');
  const tWorkflow = useTranslations('workflow');
  
  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case '1':
      case 'completed':
        return tWorkflow('status.completed');
      case '2':
      case 'failed':
        return tWorkflow('status.failed');
      case '3':
      case 'running':
        return tWorkflow('status.running');
      case '0':
      case 'pending':
        return tWorkflow('status.pending');
      default:
        return tWorkflow('status.unknown');
    }
  }, [tWorkflow]);

  const getTriggerTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'manual': return tWorkflow('triggerType.manual');
      case 'cron': return tWorkflow('triggerType.cron');
      case 'scheduled': return tWorkflow('triggerType.scheduled');
      case 'telegram': return tWorkflow('triggerType.telegram');
      default: return type;
    }
  }, [tWorkflow]);
  const [executionsData, setExecutionsData] = useState<ExecutionsResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = React.useRef(false);

  const loadExecutions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getMyExecutions();
      setExecutionsData(data);
    } catch (err) {
      console.error('❌ Error loading executions:', err);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      loadExecutions();
    }
  }, [loadExecutions]);

  // Memoize stats calculations to prevent recalculation on every render
  const stats = useMemo(() => {
    if (executionsData.items.length === 0) {
      return {
        total: 0,
        completed: 0,
        failed: 0,
        inProgress: 0
      };
    }
    
    return {
      total: executionsData.total,
      completed: executionsData.items.filter(e => e.status === '1' || e.status === 'completed').length,
      failed: executionsData.items.filter(e => e.status === '2' || e.status === 'failed').length,
      inProgress: executionsData.items.filter(e => e.status === '3' || e.status === '0' || e.status === 'running' || e.status === 'pending').length
    };
  }, [executionsData]);

  // Memoize view workflow handler
  const handleViewWorkflow = useCallback((workflowId: number) => {
    router.push(`/dashboard/workflows/${workflowId}`);
  }, [router]);

  // Skeleton loader to prevent layout shift
  const SkeletonLoader = () => (
    <div className="space-y-6 min-h-[400px]">
      <div className="rounded-lg border border-gray-700 bg-[#141519]">
        {/* Header skeleton - fixed height */}
        <div className="flex items-center justify-between p-6 min-h-[100px]">
          <div className="ml-6">
            <div className="h-8 w-48 bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-64 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        {/* Execution cards skeleton */}
        <div className="p-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
              <div className="bg-black rounded-lg p-4 h-32 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-6 w-24 bg-gray-700 rounded"></div>
                  <div className="h-4 w-32 bg-gray-700 rounded"></div>
                </div>
                <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
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
          onClick={loadExecutions}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors mx-auto shadow-lg shadow-purple-500/25"
        >
          <PlayIcon className="w-4 h-4" />
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-[400px]">
      {/* Stats */}
      {executionsData.items.length > 0 && (
        <div className="bg-[#141519]/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {stats.total}
              </div>
              <div className="text-sm text-gray-300">{t('totalExecutions')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-300">{tWorkflow('status.completed')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.failed}
              </div>
              <div className="text-sm text-gray-300">{tWorkflow('status.failed')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.inProgress}
              </div>
              <div className="text-sm text-gray-300">{t('inProgress')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Executions List */}
      {executionsData.items.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-[#141519]">
          {/* Header - fixed height */}
          <div className="flex items-center justify-between p-6 min-h-[100px]">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
              <p className="text-gray-300 mt-1">{t('description')}</p>
            </div>
          </div>
          <div className="p-6">
            <div className="ml-6 mr-6 p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
              <div className="bg-black rounded-lg p-10 text-center h-full w-full">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                <ClockIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{t('noExecutions')}</h3>
              <p className="text-gray-300">{t('noExecutionsDescription')}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-[#141519]">
          {/* Header - fixed height */}
          <div className="flex items-center justify-between p-6 min-h-[100px]">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
              <p className="text-gray-300 mt-1">{t('description')}</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4 ml-6 mr-6">
              {executionsData.items.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} onViewWorkflow={handleViewWorkflow} getStatusLabel={getStatusLabel} getTriggerTypeLabel={getTriggerTypeLabel} t={t} tWorkflow={tWorkflow} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Execution Card Component with interactive hover effect
const ExecutionCard: React.FC<{
  execution: WorkflowExecution;
  onViewWorkflow: (workflowId: number) => void;
  getStatusLabel: (status: string) => string;
  getTriggerTypeLabel: (type: string) => string;
  t: any;
  tWorkflow: any;
}> = React.memo(({ execution, onViewWorkflow, getStatusLabel, getTriggerTypeLabel, t, tWorkflow }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for interactive background on card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <div 
      className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden shadow-lg shadow-purple-500/30"
    >
      <div 
        ref={cardRef}
        className="relative bg-black rounded-lg p-6 hover:shadow-md transition-shadow h-full w-full overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Interactive gradient overlay that follows mouse - more visible */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
          style={{
            background: isHovering
              ? `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(165,0,225,0.4), rgba(123,97,255,0.2) 40%, transparent 70%)`
              : 'none'
          }}
        />
        
        {/* Content with relative z-index */}
        <div className="relative z-10">
          {/* Single row layout */}
          <div className="flex items-center pb-6 justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge 
                variant="secondary" 
                className={getStatusColor(execution.status)}
              >
                <div className="flex items-center gap-1">
                  {getStatusIcon(execution.status)}
                  <span>{getStatusLabel(execution.status)}</span>
                </div>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getTriggerTypeLabel(execution.triggerType)}
              </Badge>
              {execution.notificationSent && (
                <Badge variant="outline" className="text-xs bg-green-600 text-white">
                  {tWorkflow('notified')}
                </Badge>
              )}
            </div>
            <button
              onClick={() => onViewWorkflow((execution.workflowId ?? execution.userWorkflowId) as number)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all font-medium hover:brightness-110 shadow-lg shadow-[#A500E1]/25 bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)]"
            >
              <EyeIcon className="w-4 h-4" />
              <span>{t('viewWorkflow')}</span>
            </button>
          </div>

          {/* Input Data */}
          {execution.inputData && (
            <div className="mb-4 mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">{tWorkflow('inputData')}:</h4>
              <div className="p-3 bg-gray-700 rounded text-sm font-mono text-gray-300 break-all">
                {execution.inputData}
              </div>
            </div>
          )}

          {/* Output Data */}
          {execution.outputData && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">{tWorkflow('outputData')}:</h4>
              <div className="p-3 bg-green-900/20 rounded text-sm font-mono text-green-300 break-all">
                {execution.outputData}
              </div>
            </div>
          )}

          {/* Result Data */}
          {execution.resultData && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">{tWorkflow('result')}:</h4>
              <div className="p-3 bg-gray-800 rounded text-sm font-mono text-gray-200 break-all">
                {typeof execution.resultData === 'object' ? (execution.resultData.message ?? JSON.stringify(execution.resultData)) : String(execution.resultData)}
              </div>
            </div>
          )}

          {/* Error Message */}
          {execution.errorMessage && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">{tWorkflow('error')}:</h4>
              <div className="p-3 bg-red-900/20 rounded text-sm font-mono text-red-300 break-all">
                {execution.errorMessage}
              </div>
            </div>
          )}

          {/* Execution ID */}
          <div className="pt-4 border-t border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{tWorkflow('executionId')}: {execution.id}</span>
              <span>{tWorkflow('workflowId')}: {execution.workflowId ?? execution.userWorkflowId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ExecutionCard.displayName = 'ExecutionCard';
