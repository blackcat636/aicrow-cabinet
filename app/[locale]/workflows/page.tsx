'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { workflowApi } from '@/lib/apiWorkflow';
import { telegramApi } from '@/lib/apiTelegram';
import { Workflow, UserWorkflow } from '@/types/workflow';
import { TelegramStatusResponse } from '@/types/telegram';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, CheckIcon } from '@/components/icons';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function WorkflowsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('workflows');
  const tWorkflow = useTranslations('workflow');
  
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [myWorkflows, setMyWorkflows] = useState<UserWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusResponse['data'] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const didInitialLoadRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !didInitialLoadRef.current) {
      didInitialLoadRef.current = true;
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workflows, myWorkflowsData, telegram] = await Promise.all([
        workflowApi.getAvailableWorkflows(),
        workflowApi.getMyWorkflows().catch(() => []),
        telegramApi.getStatus().catch(() => ({ data: { isLinked: false, notificationsEnabled: false } }))
      ]);
      
      setAvailableWorkflows(Array.isArray(workflows) ? workflows : []);
      setMyWorkflows(Array.isArray(myWorkflowsData) ? myWorkflowsData : []);
      setTelegramStatus(telegram.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Check if workflow is already created
  const isWorkflowCreated = (workflowId: number): boolean => {
    return myWorkflows.some(uw => uw.workflowId === workflowId);
  };

  const handleAddWorkflow = (workflow: Workflow) => {
    if (isWorkflowCreated(workflow.id)) {
      toast.error(t('alreadyAdded'));
      return;
    }
    setSelectedWorkflow(workflow);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedWorkflow(null);
    toast.success(t('addedSuccessfully'));
    // Reload data to update the list
    loadData();
  };

  if (isLoading) {
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

  return (
    <AppLayout>
      <div className="space-y-6 relative min-h-[400px]">
        {/* Header */}
        <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6 min-h-[100px]">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
              <p className="text-gray-300 mt-1">{t('description')}</p>
            </div>
          </div>
        </div>

        {/* Workflows Grid */}
        {availableWorkflows.length === 0 ? (
          <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm">
            <div className="p-10 text-center">
              <p className="text-gray-400">{t('noWorkflowsAvailable')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {availableWorkflows.map((workflow) => (
              <WorkflowCardAvailable
                key={workflow.id}
                workflow={workflow}
                isCreated={isWorkflowCreated(workflow.id)}
                onAdd={() => handleAddWorkflow(workflow)}
              />
            ))}
          </div>
        )}

        {/* Workflow Form Modal */}
        {selectedWorkflow && (
          <WorkflowForm
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setSelectedWorkflow(null);
            }}
            onSuccess={handleFormSuccess}
            preselectedWorkflow={selectedWorkflow}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Workflow Card Component with mouse tracking
interface WorkflowCardAvailableProps {
  workflow: Workflow;
  isCreated: boolean;
  onAdd: () => void;
}

const WorkflowCardAvailable: React.FC<WorkflowCardAvailableProps> = ({
  workflow,
  isCreated,
  onAdd
}) => {
  const t = useTranslations('workflows');
  const tWorkflow = useTranslations('workflow');
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
        className="relative bg-black rounded-lg p-5 hover:shadow-md transition-shadow w-full h-full overflow-hidden group"
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
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1 break-words">
                {workflow.name || t('unnamedWorkflow')}
              </h3>
              <p className="text-sm text-gray-300 break-words">
                {workflow.description || tWorkflow('noDescription')}
              </p>
            </div>
            {workflow.priceUsd && (
              <Badge variant="outline" className="text-xs border-green-600 text-green-300 bg-green-900/20 ml-3 flex-shrink-0">
                {parseFloat(workflow.priceUsd).toFixed(2)}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4">
            {isCreated ? (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg font-medium bg-gray-700 text-gray-300">
                <CheckIcon className="w-4 h-4" />
                {t('alreadyUsed')}
              </div>
            ) : (
              <button
                onClick={onAdd}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/25"
              >
                <PlusIcon className="w-4 h-4" />
                {t('addWorkflow')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
