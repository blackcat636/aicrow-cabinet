'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import { UserWorkflow, WorkflowExecution, ExecutionsResponse } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeftIcon,
  PlayIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  CalendarDetailedIcon,
  SettingsIcon,
  PauseIcon,
  TrashIcon
} from '@/components/icons';
import { Search, X, ChevronDown } from 'lucide-react';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfDay, endOfDay } from 'date-fns';
import { type DateRange, useDayRender, type DayProps } from 'react-day-picker';
import { toast } from 'sonner';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { WorkflowExecuteModal } from '@/components/workflow/WorkflowExecuteModal';
import { ResultDisplay } from '@/components/workflow/ResultDisplay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ChainToWorkflowModal } from '@/components/workflow/ChainToWorkflowModal';
import { AvailableChainsResponse } from '@/types/workflow';
import { Spinner } from '@/components/ui/spinner';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const RUNNING_STATUSES = ['3', 'running', '0', 'pending'];

// Truncated text component with expand/collapse
const TruncatedText: React.FC<{
  text: string | any;
  maxLength?: number;
  className?: string;
}> = ({ text, maxLength = 50, className = '' }) => {
  const tCommon = useTranslations('common');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Ensure text is converted to string
  const textString = typeof text === 'string' ? text : (text ? String(text) : '');
  const textLength = textString.length;
  const shouldTruncate = textLength > maxLength;
  const displayText = isExpanded || !shouldTruncate 
    ? textString 
    : `${textString.slice(0, maxLength)}...`;

  if (!shouldTruncate) {
    return <div className={className}>{textString}</div>;
  }
  return (
    <div className="w-full">
      <div className={className}>
        {displayText}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-purple-500 hover:bg-purple-600 transition-colors rounded-md border border-purple-400 shadow-sm"
        type="button"
      >
        {isExpanded ? tCommon('less') : tCommon('more')}
      </button>
    </div>
  );
};

// Execution Card component with mouse tracking
const ExecutionCard: React.FC<{
  execution: WorkflowExecution;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusLabel: (status: string) => string;
  getTriggerTypeLabel: (triggerType: string) => string;
}> = ({ execution, getStatusColor, getStatusIcon, getStatusLabel, getTriggerTypeLabel }) => {
  const t = useTranslations('workflow');
  const tExecutions = useTranslations('executions');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [availableChains, setAvailableChains] = useState<AvailableChainsResponse | null>(null);
  const [showChainModal, setShowChainModal] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const formatDateTime = useCallback(
    (value?: string | null) => (value ? new Date(value).toLocaleString(locale) : '-'),
    [locale]
  );

  // Mouse tracking for interactive background on card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
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

  const isCompleted = execution.status === 'completed' || execution.status === '1';
  const isRunning = RUNNING_STATUSES.includes(execution.status);

  // Load available chains when execution is completed
  useEffect(() => {
    if (isCompleted && execution.id) {
      workflowApi.getAvailableChains(execution.id)
        .then(data => setAvailableChains(data))
        .catch(() => {
          // Silently fail - chains are optional
        });
    }
  }, [isCompleted, execution.id]);

  const handleRestart = async () => {
    try {
      setRestarting(true);
      const data = await workflowApi.restartExecution(execution.id);
      if (data.id) {
        toast.success(tExecutions('restart'));
        router.push(`/dashboard/executions/${data.id}`, { locale });
      }
    } catch (err: any) {
      toast.error(err.message || 'Не вдалося перезапустити виконання');
    } finally {
      setRestarting(false);
      setShowRestartConfirm(false);
    }
  };

  const canChain = isCompleted && availableChains && availableChains.availableChains.length > 0;

  return (
    <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden shadow-lg shadow-purple-500/30">
      <div 
        ref={cardRef}
        className="relative bg-black rounded-lg p-4 hover:shadow-md transition-shadow h-full w-full overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Interactive gradient overlay that follows mouse */}
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
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary" 
                className={getStatusColor(execution.status)}
              >
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <>
                      <Spinner size="md" className="text-chart-2" label="Running spinner" speed="slow" />
                      <span>{getStatusLabel(execution.status)}</span>
                    </>
                  ) : (
                    <>
                      {getStatusIcon(execution.status)}
                      <span>{getStatusLabel(execution.status)}</span>
                    </>
                  )}
                </div>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getTriggerTypeLabel(execution.triggerType)}
              </Badge>
              {execution.notificationSent && (
                <Badge variant="outline" className="text-xs bg-green-600 text-white">
                  {t('notified')}
                </Badge>
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 flex flex-col items-end gap-1">
              <div>
                <span className="text-gray-500 mr-1">{t('started')}:</span>
                <span>{formatDateTime(execution.startedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 mr-1">{t('completed')}:</span>
                <span>{formatDateTime(execution.completedAt)}</span>
              </div>
            </div>
          </div>

          {/* Input Data */}
          {(execution.inputData &&
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">{t('inputData')}:</h4>
              <div className="p-2 bg-gray-700 rounded text-xs text-gray-300">
                {typeof execution.inputData === 'string' ? (
                  <TruncatedText 
                    text={execution.inputData} 
                    maxLength={50}
                    className="break-all whitespace-pre-wrap font-mono"
                  />
                ) : (
                  <div className="space-y-1">
                    {Object.entries(
                      (execution.inputData || {}) as Record<string, unknown>
                    ).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="break-all">
                        <span className="font-medium text-gray-400">{key}:</span>{' '}
                        <span>
                          {typeof value === 'object' && value !== null
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                    {Object.keys(
                      (execution.inputData || {}) as Record<string, unknown>
                    ).length > 3 && (
                      <div className="text-gray-400 text-xs">
                        ... і ще {Object.keys(
                          (execution.inputData || {}) as Record<string, unknown>
                        ).length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>) as any}

          {/* Output Data */}
          {execution.outputData && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">{t('outputData')}:</h4>
              <div className="p-2 bg-green-900/20 rounded text-xs font-mono text-green-300">
                <TruncatedText 
                  text={execution.outputData} 
                  maxLength={50}
                  className="break-all whitespace-pre-wrap"
                />
              </div>
            </div>
          )}

          {/* Result Data */}
          {execution.resultData && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">{t('result')}:</h4>
              <ResultDisplay resultData={execution.resultData} className="text-xs" />
            </div>
          )}

          {/* Error Message */}
          {execution.errorMessage && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">{t('error')}:</h4>
              <div className="p-2 bg-red-900/20 rounded text-xs font-mono text-red-300 break-all">
                {execution.errorMessage}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isCompleted && (
            <div className="mb-3 pt-3 border-t border-gray-600">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRestartConfirm(true);
                  }}
                  disabled={restarting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {restarting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      {tExecutions('restarting')}
                    </>
                  ) : (
                    <>
                      🔄 {tExecutions('restart')}
                    </>
                  )}
                </button>

                {canChain && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChainModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all"
                  >
                    ➡️ {tExecutions('chainToWorkflow')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Execution Details */}
          <div className={`${isCompleted ? '' : 'pt-3 border-t border-gray-600'}`}>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{t('executionId')}: {execution.id}</span>
              <div className="flex items-center gap-3">
                <span>{t('workflowId')}: {(execution.workflowId ?? execution.userWorkflowId) as number}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/executions/${execution.id}`, { locale });
                  }}
                  className="px-2 py-1 text-xs text-purple-300 border border-purple-500/50 rounded hover:bg-purple-900/20 hover:border-purple-500 transition-all"
                  title={t('details')}
                >
                  {t('details')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Running overlay with spinner */}
        {isRunning && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 px-6 py-6 rounded-lg border border-purple-500/40 bg-[#141519]/80 shadow-lg shadow-purple-500/30">
              <Spinner
                size="4xl"
                gradient
                gradientFrom="#A500E1"
                gradientTo="#7B61FF"
                label="Running spinner"
                speed="slow"
              />
              <div className="text-base font-medium text-purple-100">{getStatusLabel(execution.status)}...</div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmDialog
        isOpen={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        onConfirm={handleRestart}
        title={tExecutions('restartExecution')}
        message={tExecutions('restartExecutionConfirm')}
        confirmText={tExecutions('restart')}
        cancelText={tCommon('cancel')}
        type="warning"
      />

      {showChainModal && availableChains && (
        <ChainToWorkflowModal
          isOpen={showChainModal}
          executionId={execution.id}
          availableChains={availableChains.availableChains}
          onClose={() => setShowChainModal(false)}
          onSuccess={(newExecutionId) => {
            router.push(`/dashboard/executions/${newExecutionId}`, { locale });
          }}
        />
      )}
    </div>
  );
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const t = useTranslations('workflow');
  const tCommon = useTranslations('common');
  const tExecutions = useTranslations('executions');
  const tWorkflows = useTranslations('workflows');
  const locale = useLocale();
  
  const [workflow, setWorkflow] = useState<UserWorkflow | null>(null);
  const [executions, setExecutions] = useState<ExecutionsResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  
  // Filters for executions
  const [appliedRange, setAppliedRange] = useState<DateRange | undefined>(undefined);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [inputDataSearch, setInputDataSearch] = useState<string>('');
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for Workflow Information card
  const [workflowInfoMousePosition, setWorkflowInfoMousePosition] = useState({ x: 0, y: 0 });
  const [isWorkflowInfoHovering, setIsWorkflowInfoHovering] = useState(false);
  const workflowInfoRef = useRef<HTMLDivElement>(null);
  const didInitialLoadRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const executionsRef = useRef<WorkflowExecution[]>([]);
  
  // Mouse tracking for "No executions" card
  const [noExecutionsMousePosition, setNoExecutionsMousePosition] = useState({ x: 0, y: 0 });
  const [isNoExecutionsHovering, setIsNoExecutionsHovering] = useState(false);
  const noExecutionsRef = useRef<HTMLDivElement>(null);

  const workflowId = params?.id ? parseInt(params.id as string) : null;

  // Mouse tracking handlers for Workflow Information card
  const handleWorkflowInfoMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setWorkflowInfoMousePosition({ x, y });
  }, []);

  const handleWorkflowInfoMouseEnter = useCallback(() => {
    setIsWorkflowInfoHovering(true);
  }, []);

  const handleWorkflowInfoMouseLeave = useCallback(() => {
    setIsWorkflowInfoHovering(false);
  }, []);

  // Mouse tracking handlers for "No executions" card
  const handleNoExecutionsMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNoExecutionsMousePosition({ x, y });
  }, []);

  const handleNoExecutionsMouseEnter = useCallback(() => {
    setIsNoExecutionsHovering(true);
  }, []);

  const handleNoExecutionsMouseLeave = useCallback(() => {
    setIsNoExecutionsHovering(false);
  }, []);

  useEffect(() => {
    if (workflowId && isAuthenticated && !didInitialLoadRef.current) {
      didInitialLoadRef.current = true;
      loadWorkflow();
    }
  }, [workflowId, isAuthenticated]);

  // Load executions when workflow is loaded
  useEffect(() => {
    if (workflow && isAuthenticated) {
      setExecutionsLoading(true);
      loadExecutions();
    }
  }, [workflow, isAuthenticated]);

  const sortExecutions = useCallback((items: WorkflowExecution[]) => {
    return [...items].sort((a, b) => {
      const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, []);

  useEffect(() => {
    executionsRef.current = executions.items;
  }, [executions.items]);

  const refreshRunningExecutions = useCallback(async () => {
    if (!workflow) return;

    const runningExecutions = executionsRef.current.filter(exec =>
      RUNNING_STATUSES.includes(exec.status)
    );

    if (runningExecutions.length === 0) {
      return;
    }

    try {
      const updates = await Promise.all(
        runningExecutions.map(exec =>
          workflowApi
            .getExecutionDetails(exec.id)
            .catch(err => {
              console.error(`Error refreshing execution ${exec.id}:`, err);
              return null;
            })
        )
      );

      const validUpdates = updates.filter(Boolean) as WorkflowExecution[];
      if (validUpdates.length === 0) {
        return;
      }

      setExecutions(prev => {
        const updatedMap = new Map(prev.items.map(exec => [getExecutionMapKey(exec), exec]));
        let hasChanges = false;

        validUpdates.forEach(exec => {
          const mapKey = getExecutionMapKey(exec);
          const prevExec = updatedMap.get(mapKey);
          const statusChanged = !prevExec || prevExec.status !== exec.status;
          const completionChanged = prevExec?.completedAt !== exec.completedAt;

          if (statusChanged || completionChanged) {
            updatedMap.set(mapKey, exec);
            hasChanges = true;
          }
        });

        if (!hasChanges) {
          return prev;
        }

        const items = sortExecutions(Array.from(updatedMap.values()));

        const nextState = {
          ...prev,
          items,
          total: items.length,
          limit: items.length,
          totalPages: 1
        };

        const stillRunning = items.some(item => RUNNING_STATUSES.includes(item.status));
        if (!stillRunning && refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }

        return nextState;
      });
    } catch (err) {
      console.error('Error refreshing running executions:', err);
    }
  }, [workflow, sortExecutions]);

  // Auto-refresh only running/pending executions every 5 seconds
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (!workflow || !isAuthenticated) return;

    const hasRunningExecutions = executions.items.some(exec =>
      RUNNING_STATUSES.includes(exec.status)
    );

    if (!hasRunningExecutions) return;

    refreshIntervalRef.current = setInterval(() => {
      refreshRunningExecutions();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [workflow?.id, isAuthenticated, executions.items, refreshRunningExecutions]);

  const loadWorkflow = async () => {
    if (!workflowId) {
      setError(t('notFound'));
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // Use getUserWorkflow to fetch only the specific workflow instead of all workflows
      const foundWorkflow = await workflowApi.getUserWorkflow(workflowId);
      
      if (!foundWorkflow) {
        setError(t('notFound'));
        return;
      }
      
      setWorkflow(foundWorkflow);
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError(t('notFound'));
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    if (!workflow) return;
    
    try {
      setExecutionsLoading(true);
      const data = await workflowApi.getMyExecutions();
      const filteredItems = data.items.filter(execution => {
        return (execution.workflowId === workflow.id) || (execution.userWorkflowId === workflow.id);
      });
      
      const sortedItems = sortExecutions(filteredItems);
      
      const executionsData: ExecutionsResponse = {
        items: sortedItems,
        total: sortedItems.length,
        page: 1,
        limit: sortedItems.length,
        totalPages: 1
      };
      setExecutions(executionsData);
    } catch (err) {
      console.error('Error loading executions:', err);
      toast.error(tExecutions('loadError'));
    } finally {
      setExecutionsLoading(false);
    }
  };

  const handleExecute = () => {
    if (!workflow) return;
      
      if (!workflow.isActive) {
        toast.error(t('executeErrorInactive'));
        return;
      }

    // Open modal instead of executing directly
    setShowExecuteModal(true);
  };

  const handleExecuteWithPayload = async (payload?: Record<string, any>) => {
    if (!workflow) return;
    
    try {
      setExecuting(true);
      
      // Build request data
      const requestData: any = {};
      
      if (payload && Object.keys(payload).length > 0) {
        requestData.payload = payload;
      } else {
        // If no payload, use inputDataTemplate as fallback
      const inputData = workflow.inputDataTemplate || '{"message": "Hello", "timestamp": "' + new Date().toISOString() + '"}';
        requestData.inputData = inputData;
      }
      
      await workflowApi.executeWorkflowManually(workflow.id, requestData);
      
      toast.success(t('executeSuccess'));
      setShowExecuteModal(false);
      // Reload workflow to get updated totalExecutions
      await loadWorkflow();
      await loadExecutions();
    } catch (error: any) {
      const message = error?.message as string | undefined;

      if (message && message.includes('Workflow is not active')) {
        toast.error(t('executeErrorInactive'));
      } else if (message && message.includes('No active webhook found')) {
        toast.error(t('executeErrorNoWebhook'));
      } else if (message && message.includes('404')) {
        toast.error(t('executeErrorNotFound'));
      } else {
        toast.error(message ?? t('executeError'));
      }
    } finally {
      setExecuting(false);
    }
  };

  const handleToggle = async () => {
    if (!workflow || !workflow.id) return;
    
    try {
      setToggling(true);
      const updated = await workflowApi.toggleUserWorkflow(workflow.id);
      // Preserve id and workflow object if they exist, otherwise keep the existing ones
      const updatedWithWorkflow = {
        ...updated,
        id: updated.id || workflow.id, // Ensure id is preserved
        workflow: updated.workflow || workflow.workflow
      };
      setWorkflow(updatedWithWorkflow);
      const statusKey = updated.isActive ? 'toggleSuccessActivated' : 'toggleSuccessDeactivated';
      toast.success(t('toggleSuccess', { status: t(statusKey as 'toggleSuccessActivated' | 'toggleSuccessDeactivated') }));
    } catch (error: any) {
      toast.error(error?.message ?? t('toggleError'));
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!workflow) return;
    
    try {
      await workflowApi.deleteUserWorkflow(workflow.id);
      toast.success(t('deleteSuccess'));
      router.push('/dashboard', { locale });
    } catch (error: any) {
      toast.error(error?.message ?? t('deleteError'));
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    loadWorkflow();
  };

  const appliedRangeLabel = useMemo(() => {
    if (!appliedRange?.from) return '';
    if (!appliedRange.to) return format(appliedRange.from, 'dd.MM.yyyy');
    return `${format(appliedRange.from, 'dd.MM.yyyy')} - ${format(appliedRange.to, 'dd.MM.yyyy')}`;
  }, [appliedRange]);

  // Filter executions by date and input data search
  const filteredExecutions = useMemo(() => {
    let filtered = executions.items;

    if (appliedRange?.from) {
      const fromDate = startOfDay(appliedRange.from);
      const toDate = endOfDay(appliedRange.to ?? appliedRange.from);
      filtered = filtered.filter((execution) => {
        const executionDateRaw = execution.startedAt || execution.createdAt;
        if (!executionDateRaw) return false;
        const executionDate = new Date(executionDateRaw);
        if (Number.isNaN(executionDate.getTime())) return false;
        return executionDate >= fromDate && executionDate <= toDate;
      });
    }

    // Filter by input data search
    if (inputDataSearch.trim()) {
      const searchValue = inputDataSearch.trim().toLowerCase();
      filtered = filtered.filter(execution => {
        const inputData = execution.inputData || '';
        const inputDataString = typeof inputData === 'string' 
          ? inputData 
          : JSON.stringify(inputData);
        return inputDataString.toLowerCase().includes(searchValue);
      });
    }

    // Sort by startedAt descending (newest first)
    filtered.sort((a, b) => {
      const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });

    return filtered;
  }, [executions.items, appliedRange, inputDataSearch]);

  const getExecutionKey = (execution: WorkflowExecution) =>
    execution.id ??
    execution.n8nExecutionId ??
    `${execution.workflowId ?? execution.userWorkflowId ?? 'wf'}-${execution.startedAt ?? execution.createdAt ?? 'na'}`;

  const getExecutionMapKey = (execution: WorkflowExecution) => String(getExecutionKey(execution));

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
        return <XIcon className="w-4 h-4 text-black" />;
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '1':
      case 'completed':
        return t('status.completed');
      case '2':
      case 'failed':
        return t('status.failed');
      case '3':
      case 'running':
        return t('status.running');
      case '0':
      case 'pending':
        return t('status.pending');
      default:
        return t('status.unknown');
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'manual':
        return t('triggerType.manual');
      case 'cron':
        return t('triggerType.cron');
      case 'scheduled':
        return t('triggerType.scheduled');
      case 'telegram':
        return t('triggerType.telegram');
      default:
        return type;
    }
  };

  const getCredentialTypeLabel = (type: string) => {
    switch (type) {
      case 'telegram':
        return t('credentialType.telegram');
      case 'email':
        return t('credentialType.email');
      case 'webhook':
        return t('credentialType.webhook');
      default:
        return type;
    }
  };

  const getCredentialData = () => {
    if (!workflow) return '';
    const notSet = t('credentialData.notSet');

    switch (workflow.credentialType) {
      case 'telegram':
        return t('credentialData.chatId', { value: workflow.credentialData?.chatId ?? notSet });
      case 'email':
        return t('credentialData.email', { value: workflow.credentialData?.email ?? notSet });
      case 'webhook':
        return t('credentialData.webhookUrl', { value: workflow.credentialData?.webhookUrl ?? notSet });
      default:
        return t('credentialData.none');
    }
  };

  // Skeleton loader for workflow detail page
  const DetailSkeleton = () => (
    <div className="h-full">
      <div className="max-w-6xl mx-auto p-6 min-h-[600px]">
        <div className="rounded-lg border border-gray-700 bg-[#141519]">
          {/* Header skeleton */}
          <div className="p-6 min-h-[120px]">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-28 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 w-64 bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-96 bg-gray-700 rounded animate-pulse"></div>
          </div>
          {/* Content skeleton */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {[1, 2].map((i) => (
                <div key={i} className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
                  <div className="bg-black rounded-lg p-6 h-64 animate-pulse">
                    <div className="h-6 w-48 bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-700 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
                      <div className="h-4 w-5/6 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Executions skeleton */}
            <div className="mt-8">
              <div className="h-6 w-48 bg-gray-700 rounded mb-4 animate-pulse"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
                    <div className="bg-black rounded-lg p-6 h-32 animate-pulse">
                      <div className="h-4 w-32 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 w-48 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading state for auth or initial workflow loading
  if (isLoading || loading) {
    return (
      <AppLayout>
        <DetailSkeleton />
      </AppLayout>
    );
  }

  // Show error state only if not loading and workflow is not found
  if (error || !workflow) {
    return (
      <AppLayout>
        <div className="h-full bg-gray-900">
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">{t('notFound')}</h1>
              <p className="text-gray-300 mb-6">{error ?? t('notFoundDescription')}</p>
              <button
                onClick={() => router.push('/dashboard', { locale })}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors mx-auto"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                {t('backToDashboard')}
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full">
        <div className="mx-auto w-full max-w-[1260px] px-4 md:px-6 pb-8 pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard', { locale })}
              className="h-8 w-8 rounded-[10px] border border-[var(--color-secondary-4)] flex items-center justify-center text-[var(--color-secondary-10)]"
              aria-label={t('backToDashboard')}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <h1 className="text-[32px] leading-[1.4] tracking-[0.64px] font-semibold text-[var(--color-secondary-10)] break-words">
              {workflow.name || workflow.workflow?.name || tWorkflows('unnamedWorkflow')}
            </h1>
          </div>

          <p className="mt-2 text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-8)]">
            {workflow.description || workflow.workflow?.description || t('noDescription')}
          </p>

          <div className="mt-4 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-4 py-3">
            <div className="md:hidden space-y-4">
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] font-semibold text-[var(--color-secondary-10)]">
                {t('workflowInformation')}
              </p>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[12px] leading-[1.4] tracking-[0.24px] font-semibold text-[var(--color-secondary-10)]">
                    {t('price')}:
                  </p>
                  <span className="inline-flex h-6 min-w-[25px] items-center justify-center rounded-[7px] border border-[#34C759] px-2 text-[12px] text-[#34C759]">
                    {workflow.workflow?.priceUsd ? Math.round(Number(workflow.workflow.priceUsd)).toString() : '60'}
                  </span>
                </div>
                <p className="text-right text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-8)]">
                  <span className="text-[12px] font-semibold text-[var(--color-secondary-10)]">{t('credentialData.label')}:</span>
                  <br />
                  {getCredentialData()}
                </p>
              </div>
              <div className="flex items-start justify-between">
                <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-8)]">
                  <span className="text-[12px] font-semibold text-[var(--color-secondary-10)]">{t('created')}:</span>
                  <br />
                  {new Date(workflow.createdAt).toLocaleDateString('en-GB')}
                </p>
                <p className="text-right text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-8)]">
                  <span className="text-[12px] font-semibold text-[var(--color-secondary-10)]">{t('lastUpdated')}:</span>
                  <br />
                  {new Date(workflow.updatedAt).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            <div className="hidden md:flex md:items-center md:justify-between gap-3">
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] font-semibold text-[var(--color-secondary-10)]">
                {t('workflowInformation')}:
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-semibold text-[var(--color-secondary-10)]">{t('price')}:</p>
                <span className="inline-flex h-6 min-w-[25px] items-center justify-center rounded-[7px] border border-[#34C759] px-2 text-[12px] text-[#34C759]">
                  {workflow.workflow?.priceUsd ? Math.round(Number(workflow.workflow.priceUsd)).toString() : '60'}
                </span>
              </div>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-8)]">
                <span className="text-[12px] font-semibold text-[var(--color-secondary-10)]">{t('created')}:</span>{' '}
                {new Date(workflow.createdAt).toLocaleDateString('en-GB')}
              </p>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-8)]">
                <span className="text-[12px] font-semibold text-[var(--color-secondary-10)]">{t('lastUpdated')}:</span>{' '}
                {new Date(workflow.updatedAt).toLocaleDateString('en-GB')}
              </p>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-8)] md:text-right">
                <span className="text-[12px] font-semibold text-[var(--color-secondary-10)]">{t('credentialData.label')}:</span>{' '}
                {getCredentialData()}
              </p>
            </div>
          </div>

          <h2 className="mt-7 text-[20px] leading-[1.4] tracking-[0.4px] font-medium text-[var(--color-secondary-6)]">
            {t('executionHistory')}
          </h2>

          <div className="mt-3 flex flex-row gap-2 md:gap-3 items-center">
            <div className="relative flex-1 md:w-[446px]">
              <input
                type="text"
                placeholder="Search"
                value={inputDataSearch}
                onChange={(e) => setInputDataSearch(e.target.value)}
                className="w-full h-12 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] px-4 pr-12 text-[14px] text-[var(--color-secondary-10)] placeholder:text-[var(--color-secondary-6)]"
              />
              <div className="absolute right-12 top-2 h-8 w-px bg-[var(--color-secondary-4)]" />
              {inputDataSearch ? (
                <button
                  type="button"
                  onClick={() => setInputDataSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-secondary-6)]"
                  aria-label={tCommon('clear')}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-secondary-6)]" />
              )}
            </div>

            <div className="relative w-[72px] md:w-[147px]" ref={calendarRef}>
              <button
                type="button"
                onClick={() => {
                  setPendingRange(appliedRange);
                  setIsCalendarOpen((prev) => !prev);
                }}
                className="w-full h-12 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] px-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-[5px]">
                  <CalendarDetailedIcon className="h-5 w-5 shrink-0" />
                  <span className="hidden md:inline text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-9)] font-medium">
                    Calendar
                  </span>
                </div>
                <ChevronDown className="h-5 w-5 text-[var(--color-secondary-6)]" />
              </button>

              {isCalendarOpen && (
                <Card className="absolute right-0 top-[56px] z-50 w-[288px] rounded-[10px] border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-0 shadow-[0px_0px_7px_0px_rgba(255,255,255,0.04)]">
                  <CardContent className="p-0">
                    <Calendar
                      mode="range"
                      defaultMonth={pendingRange?.from ?? appliedRange?.from ?? calendarMonth}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      selected={pendingRange}
                      onSelect={setPendingRange}
                      numberOfMonths={1}
                      toDate={new Date()}
                      captionLayout="dropdown"
                      className="p-3 text-[var(--color-secondary-10)]"
                      classNames={{
                        months: 'space-y-4',
                        month: 'space-y-4',
                        caption: 'flex justify-center pt-1 relative items-center',
                        caption_label: 'text-[16px] leading-[1.4] tracking-[0.32px] font-semibold',
                        nav: 'space-x-1 flex items-center',
                        nav_button: 'h-7 w-7 bg-transparent p-0 text-[var(--color-secondary-10)]',
                        nav_button_previous: 'absolute left-1',
                        nav_button_next: 'absolute right-1',
                        table: 'w-full border-collapse space-y-1',
                        head_row: 'flex',
                        head_cell: 'text-[var(--color-secondary-10)] rounded-md w-9 font-semibold text-[12px]',
                        row: 'flex w-full mt-2',
                        cell: 'h-9 w-9 text-center text-sm p-0 relative',
                        day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                        day_range_start: 'bg-[var(--color-main)] text-white rounded-[10px]',
                        day_range_end: 'bg-[var(--color-main)] text-white rounded-[10px]',
                        day_selected: 'bg-[var(--color-main)] text-white rounded-[10px]',
                        day_today: 'text-[var(--color-secondary-10)]',
                        day_outside: 'text-[var(--color-secondary-5)] opacity-50',
                        day_disabled: 'text-[var(--color-secondary-5)] opacity-45',
                        day_range_middle: 'bg-[var(--color-main)]/20 text-[var(--color-secondary-10)]',
                        day_hidden: 'invisible',
                      }}
                      formatters={{
                        formatMonthCaption: (date) => {
                          return date.toLocaleString('default', { month: 'long' });
                        },
                      }}
                      components={{
                        Day: (props: DayProps) => {
                          const buttonRef = React.useRef<HTMLButtonElement>(null);
                          const dayRender = useDayRender(props.date, props.displayMonth, buttonRef);
                          if (dayRender.isHidden) return <div role="gridcell" />;
                          if (!dayRender.isButton) return <div {...dayRender.divProps} />;
                          return (
                            <CalendarDayButton ref={buttonRef} name="day" {...dayRender.buttonProps} />
                          );
                        },
                      }}
                    />
                    <div className="px-6 py-4 flex flex-col items-center gap-3 border-t border-[var(--color-secondary-4)]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingRange(undefined);
                          setAppliedRange(undefined);
                          setIsCalendarOpen(false);
                        }}
                        className="h-[48px] px-4 rounded-[10px] border border-[var(--color-secondary-4)] text-[var(--color-secondary-9)] text-[14px] leading-[1.4] tracking-[0.28px] font-semibold"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedRange(pendingRange);
                          setIsCalendarOpen(false);
                        }}
                        className="h-[48px] w-[129px] rounded-[10px] bg-[var(--color-main)] text-white text-[14px] leading-[1.4] tracking-[0.28px] font-semibold"
                      >
                        Apply Now
                      </button>
                    </div>
                    <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)] opacity-80">
                      *Choose start and end date
                    </p>
                  </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {appliedRange?.from && (
            <div className="mt-3 flex items-center gap-4">
              <div className="h-[36px] rounded-[47px] border border-[var(--color-secondary-4)] px-3 inline-flex items-center gap-2">
                <span className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-10)] font-medium">
                  {appliedRangeLabel}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedRange(undefined);
                    setPendingRange(undefined);
                    setIsCalendarOpen(false);
                  }}
                  className="text-[var(--color-secondary-6)] hover:text-[var(--color-secondary-10)]"
                  aria-label="Clear selected dates"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppliedRange(undefined);
                  setPendingRange(undefined);
                  setIsCalendarOpen(false);
                }}
                className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-main)] font-medium"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {executionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-main)]" />
              </div>
            ) : executions.items.length === 0 ? (
              <>
                <div className="md:hidden rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] h-[174px] flex items-center justify-center text-center px-4">
                  <div>
                    <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">
                      No transactions yet
                    </p>
                    <p className="mt-2 text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-8)]">
                      Lorem impus dolor amet
                    </p>
                  </div>
                </div>
                <div className="hidden md:block rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-4 py-6 text-center">
                  <p className="text-[14px] text-[var(--color-secondary-8)]">{t('noExecutionsDescription')}</p>
                </div>
              </>
            ) : filteredExecutions.length === 0 ? (
              <div className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-4 py-6 text-center">
                <p className="text-[14px] text-[var(--color-secondary-8)]">{t('noMatchingExecutions')}</p>
              </div>
            ) : (
              filteredExecutions.map((execution) => (
                <ExecutionCard
                  key={getExecutionKey(execution)}
                  execution={execution}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getStatusLabel={getStatusLabel}
                  getTriggerTypeLabel={getTriggerTypeLabel}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <WorkflowForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={handleEditSuccess}
        editingWorkflow={workflow}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('deleteConfirm')}
        message={t('deleteConfirmMessage', { name: workflow.name || workflow.workflow?.name || tWorkflows('unnamedWorkflow') })}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        type="danger"
      />

      {/* Execute Workflow Modal */}
      {workflow && (
        <WorkflowExecuteModal
          isOpen={showExecuteModal}
          onClose={() => setShowExecuteModal(false)}
          onExecute={handleExecuteWithPayload}
          workflowId={workflow.workflowId}
          workflowName={workflow.name || workflow.workflow?.name || tWorkflows('unnamedWorkflow')}
        />
      )}
    </AppLayout>
  );
}
