import { NextRequest } from 'next/server';
import { User } from '@/types/auth';
import { ensureValidToken, refreshAccessToken } from './auth-utils';
import { decodeToken } from './auth-utils';
import { ImpersonationInfo } from '@/types/auth';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

export const getDeviceId = (): string => {
  if (typeof window === 'undefined') {
    return 'server-device-id';
  }

  let deviceId = getCookieValue('device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    setCookieValue('device_id', deviceId, 365 * 24 * 60 * 60);
  }
  return deviceId;
};

const generateDeviceId = (): string => {
  const deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
  return deviceId;
};

const setCookieValue = (name: string, value: string, maxAge: number) => {
  if (typeof document === 'undefined') return;

  const secure = process.env.NODE_ENV === 'production';
  let cookieString;

  if (maxAge === -1) {
    cookieString = `${name}=${value}; path=/; ${secure ? 'secure; ' : ''}samesite=strict`;
  } else {
    cookieString = `${name}=${value}; path=/; max-age=${maxAge}; ${secure ? 'secure; ' : ''}samesite=strict`;
  }

  document.cookie = cookieString;

  setTimeout(() => {
    const savedValue = getCookieValue(name);
  }, 50);
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const result = parts.pop()?.split(';').shift() || null;
    return result;
  }

  return null;
};

export const setTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;

  const nowSec = Math.floor(Date.now() / 1000);
  const accessExp = decodeToken(tokens.accessToken)?.exp;
  const refreshExp = decodeToken(tokens.refreshToken)?.exp;
  const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
  const refreshMaxAge = refreshExp
    ? Math.max(0, refreshExp - nowSec)
    : 365 * 24 * 60 * 60;

  setCookieValue('access_token', tokens.accessToken, accessMaxAge);
  setCookieValue('refresh_token', tokens.refreshToken, refreshMaxAge);
  setCookieValue('device_id', tokens.deviceId, 365 * 24 * 60 * 60);

  setTimeout(() => {
    const savedAccessToken = getCookieValue('access_token');
    const savedRefreshToken = getCookieValue('refresh_token');
    const savedDeviceId = getCookieValue('device_id');
  }, 100);
};

export const getTokens = (request?: NextRequest) => {
  if (request) {
    const tokens = {
      accessToken: request.cookies.get('access_token')?.value || null,
      refreshToken: request.cookies.get('refresh_token')?.value || null,
      deviceId: request.cookies.get('device_id')?.value || null
    };

    return tokens;
  } else {
    const tokens = {
      accessToken: getCookieValue('access_token'),
      refreshToken: getCookieValue('refresh_token'),
      deviceId: getCookieValue('device_id')
    };

    return tokens;
  }
};

export const getAccessToken = (): string | null => {
  return getCookieValue('access_token');
};

export const getRefreshToken = (): string | null => {
  return getCookieValue('refresh_token');
};

export const removeTokens = () => {
  if (typeof window === 'undefined') return;

  const secure = process.env.NODE_ENV === 'production';
  const secureFlag = secure ? 'secure; ' : '';

  document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secureFlag}samesite=strict`;
  document.cookie = `refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secureFlag}samesite=strict`;
  document.cookie = `device_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secureFlag}samesite=strict`;
};

export const setImpersonationMeta = (meta: ImpersonationInfo) => {
  if (typeof document === 'undefined') return;
  setCookieValue('impersonation_meta', JSON.stringify(meta), 24 * 60 * 60);
};

export const clearImpersonationMeta = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `impersonation_meta=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict`;
};

export const getImpersonationMeta = (): ImpersonationInfo | null => {
  try {
    const raw = getCookieValue('impersonation_meta');
    if (!raw) return null;
    return JSON.parse(raw) as ImpersonationInfo;
  } catch (error) {
    return null;
  }
};

export const getAuthHeaders = (): HeadersInit => {
  const accessToken = getAccessToken();
  const deviceId = getDeviceId();

  if (!accessToken) {
    return {};
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  if (deviceId) {
    headers['x-device-id'] = deviceId;
  }

  return headers;
};

const inflightRequests = new Map<string, Promise<Response>>();

const doFetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> => {
  const maxRetries = 2;

  try {
    await ensureValidToken();

    const authHeaders = getAuthHeaders();
    const finalHeaders = {
      ...authHeaders,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
      cache: 'no-cache'
    });

    if (response.status === 401 && retryCount < maxRetries) {
      try {
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
          return fetchWithAuth(url, options, retryCount + 1);
        } else {
          removeTokens();
          window.location.href = '/';
          throw new Error('Unauthorized');
        }
      } catch (refreshError) {
        removeTokens();
        window.location.href = '/';
        throw new Error('Unauthorized');
      }
    }

    return response;
  } catch (error) {
    if (retryCount < maxRetries && error instanceof TypeError) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return doFetchWithAuth(url, options, retryCount + 1);
    }

    throw error;
  }
};

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> => {
  const method = (options.method || 'GET').toUpperCase();
  if (method === 'GET') {
    const key = url;
    const existing = inflightRequests.get(key);
    if (existing) {
      return existing.then((res) => res.clone());
    }
    const promise = doFetchWithAuth(url, options, retryCount).finally(() => {
      inflightRequests.delete(key);
    });
    inflightRequests.set(key, promise);
    const res = await promise;
    return res.clone();
  }

  return doFetchWithAuth(url, options, retryCount);
};
