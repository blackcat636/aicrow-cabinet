import {
  FacebookStatusResponse,
  FacebookUnlinkResponse,
  FacebookVerifyResponse
} from '@/types/facebook';
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth, getDeviceId } from '@/lib/auth';

const API_BASE_URL = API_CONFIG.BASE_URL;

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data.message || data.error || fallback;
  } catch {
    return response.statusText || fallback;
  }
};

export const facebookApi = {
  verifyCode: async (
    code: string,
    redirectUri: string,
    options?: { link?: boolean }
  ): Promise<FacebookVerifyResponse> => {
    console.log('[Facebook][api] verifyCode:start', {
      codePresent: !!code,
      redirectUri,
      link: !!options?.link
    });
    const url = `${API_BASE_URL}/auth/facebook/verify`;
    const body = { code, redirectUri, link: !!options?.link };
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    const request = options?.link
      ? fetchWithAuth(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        })
      : fetch(url, {
          method: 'POST',
          headers: {
            ...headers,
            'x-device-id': getDeviceId()
          },
          body: JSON.stringify(body),
          cache: 'no-cache'
        });

    const response = await request;
    console.log('[Facebook][api] verifyCode:response', {
      status: response.status,
      ok: response.ok
    });
    if (!response.ok) {
      const errorMessage = await parseErrorMessage(
        response,
        'Failed to verify Facebook code'
      );
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    const data = (await response.json()) as FacebookVerifyResponse;
    console.log('[Facebook][api] verifyCode:success', {
      hasTokens: Boolean(data?.data?.accessToken && data?.data?.refreshToken),
      emailDiffers: data?.data?.emailDiffers,
      userEmail: data?.data?.userEmail,
      socialEmail: data?.data?.socialEmail,
      linked: data?.data?.linked
    });
    return data;
  },

  getStatus: async (): Promise<FacebookStatusResponse> => {
    console.log('[Facebook][api] getStatus:start');
    const response = await fetchWithAuth(
      `${API_BASE_URL}/auth/facebook/status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('[Facebook][api] getStatus:response', {
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(
        response,
        'Failed to load Facebook status'
      );
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      console.error('[Facebook][api] getStatus:error', { status: response.status, errorMessage });
      throw error;
    }

    const data = (await response.json()) as FacebookStatusResponse;
    console.log('[Facebook][api] getStatus:success', { data });
    return data;
  },

  unlink: async (): Promise<FacebookUnlinkResponse> => {
    console.log('[Facebook][api] unlink:start');
    const response = await fetchWithAuth(
      `${API_BASE_URL}/auth/facebook/unlink`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('[Facebook][api] unlink:response', {
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(
        response,
        'Failed to unlink Facebook account'
      );
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      console.error('[Facebook][api] unlink:error', { status: response.status, errorMessage });
      throw error;
    }

    const data = (await response.json()) as FacebookUnlinkResponse;
    console.log('[Facebook][api] unlink:success', { data });
    return data;
  }
};

