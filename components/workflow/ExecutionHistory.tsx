'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { WorkflowExecution, ExecutionsResponse, UserWorkflow, GetExecutionsParams } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { Badge } from '@/components/ui/badge';
import { ResultDisplay } from '@/components/workflow/ResultDisplay';
import {
  ClockIcon,
  CheckIcon, 
  XIcon, 
  PlayIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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

  // Generate page numbers with ellipsis
  const getPageNumbers = useCallback((currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = [];
    const delta = 1; // Number of pages to show on each side of current page
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('...');
        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, []);
  const [executionsData, setExecutionsData] = useState<ExecutionsResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userWorkflows, setUserWorkflows] = useState<UserWorkflow[]>([]);
  const [filters, setFilters] = useState<GetExecutionsParams>({
    page: 1,
    limit: 20
  });

  const isMountedRef = React.useRef(false);

  const loadUserWorkflows = React.useCallback(async () => {
    try {
      const workflows = await workflowApi.getMyWorkflows();
      setUserWorkflows(workflows);
    } catch (err) {
      console.error('❌ Error loading user workflows:', err);
    }
  }, []);

  const loadExecutions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getMyExecutions(filters);
      setExecutionsData(data);
    } catch (err) {
      console.error('❌ Error loading executions:', err);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  const handleFilterChange = useCallback((key: keyof GetExecutionsParams, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === undefined || value === null) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      // Reset to page 1 when filters change
      if (key !== 'page' && key !== 'limit') {
        newFilters.page = 1;
      }
      return newFilters;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ page: 1, limit: 20 });
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      loadUserWorkflows();
      loadExecutions();
    }
  }, [loadExecutions, loadUserWorkflows]);

  useEffect(() => {
    if (isMountedRef.current) {
      loadExecutions();
    }
  }, [filters, loadExecutions]);

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
          {/* Filters */}
          <div className="px-6 pb-4">
            <FiltersSection
              filters={filters}
              executionsData={executionsData}
              userWorkflows={userWorkflows}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              getStatusLabel={getStatusLabel}
              getTriggerTypeLabel={getTriggerTypeLabel}
              t={t}
              tWorkflow={tWorkflow}
            />
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
          {/* Filters */}
          <div className="px-6 pb-4">
            <FiltersSection
              filters={filters}
              executionsData={executionsData}
              userWorkflows={userWorkflows}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              getStatusLabel={getStatusLabel}
              getTriggerTypeLabel={getTriggerTypeLabel}
              t={t}
              tWorkflow={tWorkflow}
            />
          </div>
          <div className="p-6">
            <div className="space-y-4 ml-6 mr-6">
              {executionsData.items.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} onViewWorkflow={handleViewWorkflow} getStatusLabel={getStatusLabel} getTriggerTypeLabel={getTriggerTypeLabel} t={t} tWorkflow={tWorkflow} />
              ))}
            </div>
            
            {/* Pagination at bottom */}
            {executionsData.totalPages > 1 && (() => {
              const currentPage = filters.page || 1;
              const pageNumbers = getPageNumbers(currentPage, executionsData.totalPages);
              
              return (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700 ml-6 mr-6">
                  <div className="text-sm text-gray-400">
                    {t('pagination.showing', {
                      from: ((currentPage - 1) * (filters.limit || 20) + 1),
                      to: Math.min(currentPage * (filters.limit || 20), executionsData.total),
                      total: executionsData.total
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Previous button */}
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-[#141519] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-500 transition-colors"
                      aria-label={t('pagination.previous')}
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {pageNumbers.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        
                        const pageNum = page as number;
                        const isActive = pageNum === currentPage;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handleFilterChange('page', pageNum)}
                            className={`min-w-[36px] px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              isActive
                                ? 'bg-purple-600 text-white border border-purple-500'
                                : 'bg-[#141519] border border-gray-600 text-white hover:border-purple-500'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Next button */}
                    <button
                      onClick={() => handleFilterChange('page', Math.min(executionsData.totalPages, currentPage + 1))}
                      disabled={currentPage >= executionsData.totalPages}
                      className="p-2 bg-[#141519] border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-500 transition-colors"
                      aria-label={t('pagination.next')}
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

// Filters Section Component
const FiltersSection: React.FC<{
  filters: GetExecutionsParams;
  executionsData: ExecutionsResponse;
  userWorkflows: UserWorkflow[];
  onFilterChange: (key: keyof GetExecutionsParams, value: any) => void;
  onResetFilters: () => void;
  getStatusLabel: (status: string) => string;
  getTriggerTypeLabel: (type: string) => string;
  t: any;
  tWorkflow: any;
}> = ({ filters, executionsData, userWorkflows, onFilterChange, onResetFilters, getStatusLabel, getTriggerTypeLabel, t, tWorkflow }) => {
  const hasActiveFilters = filters.userWorkflowId !== undefined || filters.status || filters.triggerType;

  return (
    <div className="bg-[#1a1b1f] rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">{t('filters.title')}</h3>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t('filters.resetFilters')}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* User Workflow Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            {t('filters.workflow')}
          </label>
          <div className="relative">
            <select
              value={filters.userWorkflowId?.toString() || ''}
              onChange={(e) => {
                const value = e.target.value;
                onFilterChange('userWorkflowId', value ? parseInt(value, 10) : undefined);
              }}
              className="w-full pl-3 pr-10 py-2 bg-[#141519] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500/50 transition-all appearance-none"
            >
              <option value="">{t('filters.allWorkflows')}</option>
              {userWorkflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id.toString()}>
                  {workflow.name || workflow.workflow?.name || `Workflow #${workflow.id}`}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            {t('filters.status')}
          </label>
          <div className="relative">
            <select
              value={filters.status || ''}
              onChange={(e) => {
                onFilterChange('status', e.target.value || undefined);
              }}
              className="w-full pl-3 pr-10 py-2 bg-[#141519] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500/50 transition-all appearance-none"
            >
              <option value="">{t('filters.allStatuses')}</option>
              <option value="completed">{tWorkflow('status.completed')}</option>
              <option value="failed">{tWorkflow('status.failed')}</option>
              <option value="running">{tWorkflow('status.running')}</option>
              <option value="pending">{tWorkflow('status.pending')}</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Trigger Type Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            {t('filters.triggerType')}
          </label>
          <div className="relative">
            <select
              value={filters.triggerType || ''}
              onChange={(e) => {
                onFilterChange('triggerType', e.target.value || undefined);
              }}
              className="w-full pl-3 pr-10 py-2 bg-[#141519] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500/50 transition-all appearance-none"
            >
              <option value="">{t('filters.allTriggerTypes')}</option>
              <option value="manual">{tWorkflow('triggerType.manual')}</option>
              <option value="cron">{tWorkflow('triggerType.cron')}</option>
              <option value="scheduled">{tWorkflow('triggerType.scheduled')}</option>
              <option value="telegram">{tWorkflow('triggerType.telegram')}</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              {t('filters.itemsPerPage')}
            </label>
            <div className="relative">
              <select
                value={filters.limit || 20}
                onChange={(e) => {
                  onFilterChange('limit', parseInt(e.target.value, 10));
                  onFilterChange('page', 1);
                }}
                className="w-full pl-3 pr-10 py-2 bg-[#141519] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-500/50 transition-all appearance-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
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
}> = ({ execution, onViewWorkflow, getStatusLabel, getTriggerTypeLabel, t, tWorkflow }) => {
  const router = useRouter();
  const locale = useLocale();
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
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/executions/${execution.id}`, { locale });
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-purple-300 border border-purple-500/50 rounded-lg transition-all font-medium hover:bg-purple-900/20 hover:border-purple-500"
                title={tWorkflow('details')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {tWorkflow('details')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewWorkflow((execution.workflowId ?? execution.userWorkflowId) as number);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all font-medium hover:brightness-110 shadow-lg shadow-[#A500E1]/25 bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)]"
              >
                <EyeIcon className="w-4 h-4" />
                <span>{t('viewWorkflow')}</span>
              </button>
            </div>
          </div>

          {/* Input Data */}
          {execution.inputData && (
            <div className="mb-4 mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">{tWorkflow('inputData')}:</h4>
              <div className="p-3 bg-gray-700 rounded text-sm text-gray-300">
                {typeof execution.inputData === 'string' ? (
                  <pre className="whitespace-pre-wrap break-all font-mono">{execution.inputData}</pre>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(execution.inputData).map(([key, value]) => (
                      <div key={key} className="break-all">
                        <span className="font-medium text-gray-400">{key}:</span>{' '}
                        <span>
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
              <ResultDisplay resultData={execution.resultData} className="text-sm" />
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
};
