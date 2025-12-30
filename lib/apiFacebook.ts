import { API_CONFIG } from '@/config/api';
import { fetchWithAuth, getDeviceId } from '@/lib/auth';
import { FacebookAuthResponse, FacebookStatusResponse } from '@/types/auth';

const API_BASE_URL = API_CONFIG.BASE_URL;

const buildError = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    const message = data?.message || data?.error || fallback;
    const error = new Error(message);
    (error as any).status = response.status;
    return error;
  } catch {
    const error = new Error(response.statusText || fallback);
    (error as any).status = response.status;
    return error;
  }
};

export const facebookApi = {
  // Generate Facebook OAuth URL for login or linking
  getAuthUrl: (link = false): string => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    if (!appId || !frontendUrl) {
      throw new Error('Facebook auth is disabled');
    }

    const redirectUri = `${frontendUrl}/auth/callback`;
    const scope = 'email,public_profile';
    const state = link ? 'link' : 'login';

    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&response_type=code&state=${state}`;

    return url;
  },

  // Verify OAuth code; link=true for account linking
  verify: async (
    code: string,
    link = false
  ): Promise<FacebookAuthResponse | { status: number }> => {
    const url = `${API_BASE_URL}/auth/facebook/verify`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (!link) {
      const deviceId = getDeviceId();
      headers['x-device-id'] = deviceId;
    }

    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const redirectUri = frontendUrl ? `${frontendUrl}/auth/callback` : '';

    const requestInit: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify({ code, link, redirectUri }),
      cache: 'no-cache'
    };

    const response = link
      ? await fetchWithAuth(url, requestInit)
      : await fetch(url, requestInit);

    if (!response.ok) {
      throw await buildError(response, 'Facebook verification failed');
    }

    // Link flow may return 204/200 without tokens
    if (response.status === 204) {
      return { status: 204 };
    }

    const data = (await response.json()) as FacebookAuthResponse;
    return data;
  },

  // Get Facebook linking status for current user
  getStatus: async (): Promise<FacebookStatusResponse> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/auth/facebook/status`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache'
      }
    );

    if (!response.ok) {
      throw await buildError(response, 'Failed to fetch Facebook status');
    }

    const data = (await response.json()) as FacebookStatusResponse;
    return data;
  },

  // Unlink Facebook account for current user
  unlink: async (): Promise<void> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/auth/facebook/unlink`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache'
      }
    );

    if (!response.ok) {
      throw await buildError(response, 'Failed to unlink Facebook account');
    }
  }
};

