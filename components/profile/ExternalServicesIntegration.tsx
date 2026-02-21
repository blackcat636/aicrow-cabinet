'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { externalServicesApi } from '@/lib/apiExternalServices';
import {
  ExternalServiceItem,
  ExternalServiceSession
} from '@/types/externalService';
import { useTranslations } from 'next-intl';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

export const ExternalServicesIntegration: React.FC = () => {
  const t = useTranslations('profile');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ExternalServiceItem[]>([]);
  const [sessionsByService, setSessionsByService] = useState<Record<number, ExternalServiceSession[]>>({});
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [loadingSessionsFor, setLoadingSessionsFor] = useState<number | null>(null);
  const [revokeServiceTarget, setRevokeServiceTarget] = useState<ExternalServiceItem | null>(null);
  const [revokeSessionTarget, setRevokeSessionTarget] = useState<{
    serviceId: number;
    session: ExternalServiceSession;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await externalServicesApi.getGrantedServices();
      setServices(data);
    } catch (error: any) {
      toast.error(error?.message || t('externalServicesLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const toggleSessions = useCallback(
    async (serviceId: number) => {
      if (expandedServiceId === serviceId) {
        setExpandedServiceId(null);
        return;
      }

      setExpandedServiceId(serviceId);
      if (sessionsByService[serviceId]) {
        return;
      }

      try {
        setLoadingSessionsFor(serviceId);
        const sessions = await externalServicesApi.getServiceSessions(serviceId);
        setSessionsByService((prev) => ({ ...prev, [serviceId]: sessions }));
      } catch (error: any) {
        toast.error(error?.message || t('externalServicesSessionsLoadError'));
      } finally {
        setLoadingSessionsFor(null);
      }
    },
    [expandedServiceId, sessionsByService, t]
  );

  const handleRevokeService = useCallback(async () => {
    if (!revokeServiceTarget) return;

    try {
      setActionLoading(true);
      await externalServicesApi.revokeServiceAccess(revokeServiceTarget.service.id);
      setServices((prev) =>
        prev.filter((item) => item.service.id !== revokeServiceTarget.service.id)
      );
      setSessionsByService((prev) => {
        const next = { ...prev };
        delete next[revokeServiceTarget.service.id];
        return next;
      });
      if (expandedServiceId === revokeServiceTarget.service.id) {
        setExpandedServiceId(null);
      }
      toast.success(t('externalServicesRevokeServiceSuccess'));
    } catch (error: any) {
      toast.error(error?.message || t('externalServicesRevokeServiceError'));
    } finally {
      setActionLoading(false);
      setRevokeServiceTarget(null);
    }
  }, [expandedServiceId, revokeServiceTarget, t]);

  const handleRevokeSession = useCallback(async () => {
    if (!revokeSessionTarget) return;
    const { serviceId, session } = revokeSessionTarget;

    try {
      setActionLoading(true);
      await externalServicesApi.revokeSessionAccess(serviceId, session.id);
      setSessionsByService((prev) => ({
        ...prev,
        [serviceId]: (prev[serviceId] || []).filter((item) => item.id !== session.id)
      }));
      setServices((prev) =>
        prev.map((item) =>
          item.service.id === serviceId
            ? {
                ...item,
                activeSessionsCount: Math.max(0, item.activeSessionsCount - 1)
              }
            : item
        )
      );
      toast.success(t('externalServicesRevokeSessionSuccess'));
    } catch (error: any) {
      toast.error(error?.message || t('externalServicesRevokeSessionError'));
    } finally {
      setActionLoading(false);
      setRevokeSessionTarget(null);
    }
  }, [revokeSessionTarget, t]);

  const content = useMemo(() => {
    if (loading) {
      return <div className="text-sm text-[var(--color-secondary-6)]">{t('integrationsLoading')}</div>;
    }

    if (!services.length) {
      return <div className="text-sm text-[var(--color-secondary-6)]">{t('externalServicesEmpty')}</div>;
    }

    return services.map((item) => {
      const serviceId = item.service.id;
      const sessions = sessionsByService[serviceId] || [];
      const isExpanded = expandedServiceId === serviceId;
      const isLoadingSessions = loadingSessionsFor === serviceId;

      return (
        <div key={serviceId} className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-3 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--color-secondary-10)]">{item.service.name}</div>
              {item.service.description && (
                <div className="text-xs text-[var(--color-secondary-6)] mt-1">{item.service.description}</div>
              )}
              <div className="mt-2 text-xs text-[var(--color-secondary-6)] space-x-3">
                <span>{t('externalServicesActiveSessions')}: {item.activeSessionsCount}</span>
                <span>{t('externalServicesPendingSessions')}: {item.pendingSessionsCount}</span>
              </div>
              <div className="mt-1 text-xs text-[var(--color-secondary-7)]">
                {t('externalServicesLastUsed')}: {formatDate(item.lastUsedAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void toggleSessions(serviceId)}
                className="text-xs"
              >
                {isExpanded ? t('externalServicesHideSessions') : t('externalServicesViewSessions')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRevokeServiceTarget(item)}
                className="border-red-600 text-red-300 hover:text-white hover:bg-red-600/20 text-xs"
              >
                {t('externalServicesRevokeService')}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-2 border-t border-[var(--color-secondary-4)] pt-3">
              {isLoadingSessions ? (
                <div className="text-xs text-[var(--color-secondary-6)]">{t('integrationsLoading')}</div>
              ) : sessions.length === 0 ? (
                <div className="text-xs text-[var(--color-secondary-6)]">{t('externalServicesNoSessions')}</div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-2 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-3 py-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="text-xs text-[var(--color-secondary-9)]">
                      <div className="font-medium">{session.deviceName || t('externalServicesUnknownDevice')}</div>
                      <div className="text-[var(--color-secondary-6)]">
                        {session.ipAddress || '—'} · {session.status}
                      </div>
                      <div className="text-[var(--color-secondary-7)]">
                        {t('externalServicesLastUsed')}: {formatDate(session.lastUsedAt)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRevokeSessionTarget({ serviceId, session })}
                      className="border-red-600 text-red-300 hover:text-white hover:bg-red-600/20 text-xs"
                    >
                      {t('externalServicesRevokeSession')}
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    });
  }, [
    expandedServiceId,
    loading,
    loadingSessionsFor,
    services,
    sessionsByService,
    t,
    toggleSessions
  ]);

  return (
    <>
      <div className="space-y-3">{content}</div>

      <ConfirmDialog
        isOpen={!!revokeServiceTarget}
        onClose={() => setRevokeServiceTarget(null)}
        onConfirm={handleRevokeService}
        title={t('externalServicesRevokeServiceConfirmTitle')}
        message={t('externalServicesRevokeServiceConfirmMessage', {
          service: revokeServiceTarget?.service.name || ''
        })}
        confirmText={t('externalServicesRevokeService')}
        cancelText={t('cancel')}
        type="warning"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!revokeSessionTarget}
        onClose={() => setRevokeSessionTarget(null)}
        onConfirm={handleRevokeSession}
        title={t('externalServicesRevokeSessionConfirmTitle')}
        message={t('externalServicesRevokeSessionConfirmMessage')}
        confirmText={t('externalServicesRevokeSession')}
        cancelText={t('cancel')}
        type="warning"
        loading={actionLoading}
      />
    </>
  );
};
