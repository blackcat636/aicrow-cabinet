'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface SSOCheckResponse {
  status: number;
  data?: {
    redirectUrl?: string;
    loginUrl?: string;
    code?: string;
    state?: string;
  };
  message?: string;
}

export default function SSOInitiatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const redirectUri = searchParams?.get('redirect_uri');
  const service = searchParams?.get('service');
  const state = searchParams?.get('state');

  useEffect(() => {
    const checkSSO = async () => {
      if (!redirectUri) {
        setError('redirect_uri not specified');
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          redirect_uri: redirectUri
        });
        if (service) params.set('service', service);
        if (state) params.set('state', state);

        const response = await fetch(
          `/api/auth/sso/initiate-check?${params.toString()}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            cache: 'no-cache'
          }
        );

        const data: SSOCheckResponse = await response.json();

        if (data.status === 200 && data.data?.redirectUrl) {
          window.location.href = data.data.redirectUrl;
          return;
        }

        if (data.status === 401 && data.data?.loginUrl) {
          window.location.href = data.data.loginUrl;
          return;
        }

        if (response.status === 400) {
          setError(data.message || 'Invalid redirect_uri format');
        } else {
          setError(data.message || 'Error during SSO initiation');
        }
        setLoading(false);
      } catch (err) {
        setError('Error during SSO initiation');
        setLoading(false);
      }
    };

    checkSSO();
  }, [redirectUri, service, state]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141519]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-300">Initializing SSO...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141519] p-4">
        <div className="max-w-md w-full bg-white/5 rounded-xl border border-red-500/30 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Failed to initiate SSO</h2>
          <p className="text-gray-300 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
