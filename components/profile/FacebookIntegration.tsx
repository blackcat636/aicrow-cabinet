'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { facebookApi } from '@/lib/apiFacebook';
import { FacebookStatusResponse } from '@/types/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FacebookIntegrationProps {
  className?: string;
}

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M22 12.073C22 6.505 17.523 2 12 2S2 6.505 2 12.073c0 5.024 3.657 9.19 8.438 9.927v-7.027H7.898v-2.9h2.54V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.48h-1.26c-1.243 0-1.63.777-1.63 1.573v1.888h2.773l-.443 2.9h-2.33V22c4.78-.737 8.437-4.903 8.437-9.927Z" />
  </svg>
);

export const FacebookIntegration: React.FC<FacebookIntegrationProps> = ({ className }) => {
  const t = useTranslations('profile');
  const [status, setStatus] = useState<FacebookStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      console.log('[FacebookIntegration] getStatus start');
      const response = await facebookApi.getStatus();
      console.log('[FacebookIntegration] getStatus success', response);
      setStatus(response);
    } catch (error: any) {
      // If provider disabled or not linked yet, fall back to default state
      console.error('[FacebookIntegration] getStatus error', error);
      setStatus({ isLinked: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = () => {
    try {
      console.log('[FacebookIntegration] connect click');
      const url = facebookApi.getAuthUrl(true);
      console.log('[FacebookIntegration] redirect', url);
      window.location.href = url;
    } catch (error: any) {
      console.error('[FacebookIntegration] connect error', error);
      toast.error(error?.message || t('facebookLinkError'));
    }
  };

  const handleUnlink = async () => {
    try {
      setLoading(true);
      console.log('[FacebookIntegration] unlink start');
      await facebookApi.unlink();
      toast.success(t('facebookUnlinked'));
      setStatus({ isLinked: false });
    } catch (error: any) {
      console.error('[FacebookIntegration] unlink error', error);
      toast.error(error?.message || t('facebookLinkError'));
    } finally {
      setLoading(false);
      setConfirmUnlink(false);
    }
  };

  const isLinked = status?.isLinked;

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#1877F2] rounded">
            <FacebookIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-200">
              {t('facebookIntegration')}
            </div>
            {loading ? (
              <div className="text-xs text-gray-400">{t('integrationsLoading')}</div>
            ) : isLinked ? (
              <div className="text-xs text-green-400 flex flex-col gap-0.5">
                <span>{t('facebookConnected')}</span>
                {status?.email && (
                  <span className="text-[11px] text-gray-300">{status.email}</span>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400">{t('facebookNotConnected')}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLinked ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmUnlink(true)}
              disabled={loading}
              className="border-red-600 text-red-300 hover:text-white hover:bg-red-600/20"
            >
              {t('facebookUnlink')}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleConnect}
              disabled={loading}
              className="bg-[#1877F2] hover:bg-[#0f5dc0] text-white"
            >
              {t('facebookConnect')}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmUnlink}
        onClose={() => setConfirmUnlink(false)}
        onConfirm={handleUnlink}
        title={t('facebookUnlinkConfirm')}
        message={t('facebookUnlinkMessage')}
        confirmText={t('facebookUnlink')}
        cancelText={t('cancel')}
        type="warning"
        loading={loading}
      />
    </>
  );
};

