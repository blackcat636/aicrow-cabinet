'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { workflowApi } from '@/lib/apiWorkflow';
import { telegramApi } from '@/lib/apiTelegram';
import { Workflow } from '@/types/workflow';
import { TelegramStatusResponse } from '@/types/telegram';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ChevronLeftIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function MarketPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslations('market');
  const tWorkflow = useTranslations('workflow');
  const tExecutions = useTranslations('executions');

  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [myWorkflowIds, setMyWorkflowIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [_telegramStatus, setTelegramStatus] = useState<TelegramStatusResponse['data'] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedMobileWorkflow, setSelectedMobileWorkflow] = useState<Workflow | null>(null);
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
      const ids = new Set<number>((Array.isArray(myWorkflowsData) ? myWorkflowsData : []).map((w: { workflowId: number }) => w.workflowId));
      setMyWorkflowIds(ids);
      setTelegramStatus(telegram.data);
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      toast.error(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const isWorkflowCreated = (workflowId: number): boolean => myWorkflowIds.has(workflowId);

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
    loadData();
  };

  const hasWorkflows = availableWorkflows.length > 0;
  const hasCollectedAllAutomations =
    hasWorkflows && availableWorkflows.every((w) => myWorkflowIds.has(w.id));

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-gray-300">{t('loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative min-h-[400px] max-w-[1262px] mx-auto">
        <div className="md:hidden">
          {!hasWorkflows ? (
            <div className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-6 text-center">
              <p className="figma-body-1-regular text-[var(--color-secondary-6)]">{t('noItemsAvailable')}</p>
            </div>
          ) : hasCollectedAllAutomations ? (
            <MarketAllAutomationsComplete t={t} />
          ) : selectedMobileWorkflow ? (
            <MobileWorkflowDetail
              workflow={selectedMobileWorkflow}
              isCreated={isWorkflowCreated(selectedMobileWorkflow.id)}
              onBack={() => setSelectedMobileWorkflow(null)}
              onAdd={() => handleAddWorkflow(selectedMobileWorkflow)}
              onDiscard={() => setSelectedMobileWorkflow(null)}
              t={t}
              tWorkflow={tWorkflow}
              tExecutions={tExecutions}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {hasWorkflows && (
                <div className="flex flex-col gap-3">
                  <h3 className="figma-body-2-semibold text-[var(--color-secondary-10)]">{t('sectionWorkflow')}</h3>
                  {availableWorkflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      type="button"
                      onClick={() => setSelectedMobileWorkflow(workflow)}
                      className="w-full rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-4 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="figma-body-2-medium text-[var(--color-secondary-10)] truncate">
                          {workflow.name || t('unnamedWorkflow')}
                        </p>
                        <div className="h-[24px] min-w-[25px] px-[8px] rounded-[7.273px] border-[0.727px] border-[#34C759] flex items-center justify-center shrink-0">
                          <span className="text-[11.636px] font-medium leading-[1.4] tracking-[0.2327px] text-[#34C759]">
                            {workflow.priceUsd ? Math.round(Number(workflow.priceUsd)).toString() : '60'}
                          </span>
                        </div>
                      </div>
                      <p className="figma-body-3-regular text-[var(--color-secondary-8)] line-clamp-2 mt-2">
                        {workflow.description || tWorkflow('noDescription')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:block">
          {!hasWorkflows ? (
            <>
              <h2 className="figma-heading-semibold text-[var(--color-secondary-10)] mb-6">{t('title')}</h2>
              <div className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-10 text-center">
                <p className="figma-body-1-regular text-[var(--color-secondary-6)]">{t('noItemsAvailable')}</p>
              </div>
            </>
          ) : hasCollectedAllAutomations ? (
            <MarketAllAutomationsComplete t={t} />
          ) : (
            <>
              <h2 className="figma-heading-semibold text-[var(--color-secondary-10)] mb-6">{t('title')}</h2>
              <div className="flex flex-col gap-8">
                <section>
                  <h3 className="figma-body-2-semibold text-[var(--color-secondary-10)] mb-4">{t('sectionWorkflow')}</h3>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {availableWorkflows.map((workflow) => (
                      <WorkflowCardAvailable
                        key={workflow.id}
                        workflow={workflow}
                        isCreated={isWorkflowCreated(workflow.id)}
                        onAdd={() => handleAddWorkflow(workflow)}
                        t={t}
                        tWorkflow={tWorkflow}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>

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

function MarketAllAutomationsComplete({ t }: { t: (key: string) => string }) {
  return (
    <div className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-6 md:p-10 text-center">
      <h2 className="figma-heading-semibold text-[var(--color-secondary-10)] mb-3 md:mb-4">{t('allAutomationsTitle')}</h2>
      <p className="figma-body-1-regular text-[var(--color-secondary-8)] mb-6 max-w-xl mx-auto">{t('allAutomationsSubtitle')}</p>
      <Link
        href="/dashboard"
        className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[var(--color-main)] px-6 figma-body-1-semibold text-[var(--color-secondary-10)]"
      >
        {t('viewActiveAutomations')}
      </Link>
    </div>
  );
}

// Mobile workflow detail view
function MobileWorkflowDetail({
  workflow,
  isCreated,
  onBack,
  onAdd,
  onDiscard,
  t,
  tWorkflow,
  tExecutions
}: {
  workflow: Workflow;
  isCreated: boolean;
  onBack: () => void;
  onAdd: () => void;
  onDiscard: () => void;
  t: (k: string) => string;
  tWorkflow: (k: string) => string;
  tExecutions: (k: string) => string;
}) {
  return (
    <div className="-mx-4 -my-4 min-h-[calc(100dvh-71px)] bg-[var(--color-secondary-1)] px-4 pt-4 pb-6">
      <div className="mx-auto w-full max-w-[343px] flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-8 w-8 rounded-full border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] flex items-center justify-center text-[var(--color-secondary-10)]"
            aria-label="Back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="figma-body-2-semibold uppercase text-[var(--color-secondary-10)] tracking-[0.28px] truncate">
            {workflow.name || t('unnamedWorkflow')}
          </h2>
        </div>
        <p className="figma-body-1-regular text-[var(--color-secondary-9)]">
          {workflow.description || tWorkflow('noDescription')}
        </p>
        <div className="flex items-center gap-3">
          <p className="figma-body-1-regular text-[var(--color-secondary-9)]">{tExecutions('cost')}:</p>
          <div className="h-[24px] min-w-[25px] px-[8px] rounded-[7.273px] border-[0.727px] border-[#34C759] flex items-center justify-center">
            <span className="text-[11.636px] font-medium leading-[1.4] tracking-[0.2327px] text-[#34C759]">
              {workflow.priceUsd ? Math.round(Number(workflow.priceUsd)).toString() : '60'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={isCreated}
          className={`h-12 rounded-[10px] figma-body-1-semibold ${
            isCreated ? 'bg-[var(--color-secondary-4)] text-[var(--color-secondary-5)]' : 'bg-[var(--color-main)] text-[var(--color-secondary-10)]'
          }`}
        >
          {isCreated ? t('alreadyUsed') : t('addWorkflow')}
        </button>
        <button type="button" onClick={onDiscard} className="h-12 rounded-[10px] border border-[var(--color-main)] figma-body-1-semibold text-[var(--color-main)]">
          {tWorkflow('discard')}
        </button>
      </div>
    </div>
  );
}

// Workflow card (desktop) - workflows can be added
interface WorkflowCardAvailableProps {
  workflow: Workflow;
  isCreated: boolean;
  onAdd: () => void;
  t: (k: string) => string;
  tWorkflow: (k: string) => string;
}

function WorkflowCardAvailable({ workflow, isCreated, onAdd, t, tWorkflow }: WorkflowCardAvailableProps) {
  const description = workflow.description || tWorkflow('noDescription');
  const tokenValue = workflow.priceUsd ? Math.round(Number(workflow.priceUsd)).toString() : '60';
  const shouldShowFullDescriptionOnHover = description.length > 130;

  return (
    <div
      role="button"
      tabIndex={isCreated ? -1 : 0}
      onClick={() => !isCreated && onAdd()}
      onKeyDown={(e) => {
        if (!isCreated && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAdd();
        }
      }}
      className={`relative group bg-[var(--color-secondary-2)] border border-[var(--color-secondary-4)] rounded-[10px] h-[133px] px-[16px] py-[8px] flex items-center transition-all ${
        isCreated ? 'opacity-70 cursor-default' : 'cursor-pointer hover:border-[var(--color-main)]'
      }`}
    >
      <div className="flex flex-col gap-2 items-start justify-center w-full">
        <div className="flex flex-col gap-2 items-start justify-center w-full">
          <div className="flex items-center justify-between w-full">
            <p className="figma-body-2-medium text-[var(--color-secondary-10)] truncate">{workflow.name || t('unnamedWorkflow')}</p>
            <div className="h-[24px] min-w-[25px] px-[8px] rounded-[7.273px] border-[0.727px] border-[#34C759] flex items-center justify-center">
              <span className="text-[11.636px] font-medium leading-[1.4] tracking-[0.2327px] text-[#34C759]">{tokenValue}</span>
            </div>
          </div>
          <p className="figma-body-3-regular text-[var(--color-secondary-8)] line-clamp-3">{description}</p>
          {shouldShowFullDescriptionOnHover && (
            <div className="pointer-events-none absolute left-3 right-3 top-full mt-2 z-30 rounded-[8px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-3 opacity-0 -translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg">
              <p className="figma-body-3-regular text-[var(--color-secondary-8)] whitespace-normal">{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

