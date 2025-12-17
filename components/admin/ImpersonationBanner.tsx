'use client';

import React from 'react';
import { ImpersonationInfo } from '@/types/auth';
import { useTranslations } from 'next-intl';

interface Props {
  info: ImpersonationInfo | null;
  onExit: () => Promise<void>;
  loading?: boolean;
}

export const ImpersonationBanner: React.FC<Props> = ({ info, onExit, loading }) => {
  const active = info?.isImpersonated || !!info?.impersonatedBy;
  if (!active) return null;
  const t = useTranslations('impersonation');
  const userLabel = info.impersonatedUser?.username || info.impersonatedUser?.email || 'user';
  const adminLabel = info.impersonatedBy?.email || info.impersonatedBy?.username || 'admin';

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/40 text-amber-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="font-semibold">
          {t('actingAs', { user: userLabel })}
        </span>
        <span className="text-sm text-amber-200/80">
          {t('initiatedBy', { admin: adminLabel })}
        </span>
      </div>
      <button
        onClick={onExit}
        disabled={loading}
        className="px-3 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? t('exiting') : t('exit')}
      </button>
    </div>
  );
};

