import { API_CONFIG } from '@/config/api';
import { fetchWithAuth, getDeviceId } from '@/lib/auth';
import { FacebookAuthResponse, FacebookStatusResponse } from '@/types/auth';

const API_BASE_URL = API_CONFIG.BASE_URL;

const buildError = async (response: Response, fallback: string) => {
  try {
    const text = await response.text();
    let data: any = {};
    
    try {
      data = JSON.parse(text);
    } catch {
      // If response is not JSON, use text as message
      data = { message: text || response.statusText || fallback };
    }
    
    const message = data?.message || data?.error || data?.error_description || fallback;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).data = data;
    (error as any).responseText = text;
    return error;
  } catch (err) {
    const error = new Error(response.statusText || fallback);
    (error as any).status = response.status;
    return error;
  }
};

export const facebookApi = {
  // Get consistent redirect URI
  getRedirectUri: (): string => {
    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    if (!frontendUrl) {
      throw new Error('Frontend URL is not configured');
    }

    // Ensure no trailing slash and consistent format
    const baseUrl = frontendUrl.replace(/\/$/, '');
    return `${baseUrl}/auth/callback`;
  },

  // Generate Facebook OAuth URL for login or linking
  getAuthUrl: (link = false): string => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    
    if (!appId) {
      throw new Error('Facebook auth is disabled: App ID not configured');
    }

    const redirectUri = facebookApi.getRedirectUri();
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

    // Use the same redirect URI as in getAuthUrl to ensure consistency
    const redirectUri = facebookApi.getRedirectUri();

    const requestBody = { code, link, redirectUri };

    const requestInit: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      cache: 'no-cache'
    };

    const response = link
      ? await fetchWithAuth(url, requestInit)
      : await fetch(url, requestInit);

    if (!response.ok) {
      const error = await buildError(response, 'Facebook verification failed');
      const errorData = (error as any).data || {};
      const responseText = (error as any).responseText || '';
      
      // Log detailed error information
      console.group('❌ [Facebook OAuth] Verification Failed');
      console.error('Status:', response.status, response.statusText);
      console.error('Message:', error.message);
      console.error('Redirect URI:', redirectUri);
      console.error('Request sent to backend:', {
        url: `${API_BASE_URL}/auth/facebook/verify`,
        redirectUri,
        link,
        codeLength: code?.length || 0,
        hasCode: !!code
      });
      console.error('Backend response data:', errorData);
      if (responseText) {
        console.error('Backend response text:', responseText);
      }
      console.groupEnd();
      
      throw error;
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
      `${API_BASE_URL}/auth/social-accounts`,
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

