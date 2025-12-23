'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { facebookApi } from '@/lib/apiFacebook';
import { FacebookStatusResponse } from '@/types/facebook';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const FACEBOOK_CALLBACK_URL = process.env.NEXT_PUBLIC_FACEBOOK_CALLBACK_URL;
const FACEBOOK_ENABLED_FLAG = process.env.NEXT_PUBLIC_FACEBOOK_ENABLED;

const FacebookIntegrationPage: React.FC = () => {
  const t = useTranslations('integrations.facebook');
  const [status, setStatus] = useState<FacebookStatusResponse['data'] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const facebookEnabled = useMemo(() => {
    const envEnabled = FACEBOOK_ENABLED_FLAG !== 'false';
    return (
      envEnabled &&
      Boolean(FACEBOOK_APP_ID) &&
      Boolean(FACEBOOK_CALLBACK_URL || typeof window !== 'undefined')
    );
  }, []);

  useEffect(() => {
    void loadStatus();
  }, []);

  const getRedirectUri = () => {
    if (FACEBOOK_CALLBACK_URL) return FACEBOOK_CALLBACK_URL;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return '';
  };

  const startFacebookOAuth = () => {
    console.log('[Facebook][UI] startOAuth', {
      facebookEnabled,
      FACEBOOK_APP_ID,
      FACEBOOK_CALLBACK_URL,
      redirectCandidate: getRedirectUri()
    });
    if (!facebookEnabled) {
      toast.error(t('disabled'));
      return;
    }

    const redirectUri = getRedirectUri();
    const state = encodeURIComponent(
      JSON.stringify({
        action: 'link',
        returnTo: '/integrations/facebook'
      })
    );
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=email,public_profile&response_type=code&state=${state}`;
    window.location.href = authUrl;
  };

  const loadStatus = async () => {
    console.log('[Facebook][UI] loadStatus:start');
    setIsLoading(true);
    setError(null);
    try {
      const response = await facebookApi.getStatus();
      setStatus(response.data);
    } catch (err: any) {
      if (err?.status === 404) {
        setError(t('notAvailable'));
        setStatus({ isLinked: false });
      } else if (err?.status === 403) {
        setError(t('disabled'));
        setStatus({ isLinked: false });
      } else {
        setError(err?.message || t('errorLoading'));
      }
      console.error('[Facebook][UI] loadStatus:error', err);
    } finally {
      console.log('[Facebook][UI] loadStatus:finish');
      setIsLoading(false);
    }
  };

  const unlinkAccount = async () => {
    console.log('[Facebook][UI] unlink:start');
    setIsLoading(true);
    setError(null);
    try {
      await facebookApi.unlink();
      toast.success(t('unlinkedSuccessfully'));
      setStatus({ isLinked: false });
    } catch (err: any) {
      if (err?.status === 403) {
        setError(t('disabled'));
      } else {
        setError(err?.message || t('errorUnlinking'));
      }
      console.error('[Facebook][UI] unlink:error', err);
    } finally {
      console.log('[Facebook][UI] unlink:finish');
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-full">
        <div className="max-w-5xl mx-auto py-6 h-full flex flex-col">
          <div className="rounded-lg border border-gray-700 bg-[#141519]/80 backdrop-blur-sm h-full flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between p-6 min-h-[100px]">
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
                <p className="text-gray-300 mt-1">{t('description')}</p>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {isLoading && !status && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                </div>
              )}

              {status && (
                <div className="space-y-4">
                  <div className="bg-[#141519]/60 backdrop-blur-sm rounded-2xl p-6 h-full w-full border border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">
                          {t('connectionStatus')}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {status.isLinked
                            ? t('accountConnected')
                            : t('accountNotConnected')}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                          status.isLinked
                            ? 'bg-green-900/30 border border-green-700'
                            : 'bg-red-900/30 border border-red-700'
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            status.isLinked ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            status.isLinked ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {status.isLinked
                            ? t('accountConnected')
                            : t('accountNotConnected')}
                        </span>
                      </div>
                    </div>

                    {status.isLinked && (
                      <div className="mt-4 space-y-2 text-sm text-gray-300">
                        {status.name && (
                          <div>
                            <span className="text-gray-500">{t('name')}:</span>{' '}
                            {status.name}
                          </div>
                        )}
                        {status.email && (
                          <div>
                            <span className="text-gray-500">
                              {t('email')}:
                            </span>{' '}
                            {status.email}
                          </div>
                        )}
                        {status.linkedAt && (
                          <div>
                            <span className="text-gray-500">
                              {t('connected')}:
                            </span>{' '}
                            {new Date(status.linkedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#141519]/60 backdrop-blur-sm rounded-2xl p-6 h-full w-full border border-gray-800 space-y-3">
                    {!status.isLinked ? (
                      <button
                        onClick={startFacebookOAuth}
                        disabled={isLoading || !facebookEnabled}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        {t('connectAccount')}
                      </button>
                    ) : (
                      <button
                        onClick={unlinkAccount}
                        disabled={isLoading}
                        className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        {t('disconnectAccount')}
                      </button>
                    )}

                    <button
                      onClick={loadStatus}
                      disabled={isLoading}
                      className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                    >
                      {t('refreshStatus')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FacebookIntegrationPage;

