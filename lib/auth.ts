import { NextRequest } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { getLocalizedAppPath } from '@/lib/client-locale';
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
  setCookieValue('device_id', tokens.deviceId, 365 * 24 * 60 * 60);
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
      accessToken: null,
      refreshToken: null,
      deviceId: getCookieValue('device_id')
    };

    return tokens;
  }
};

export const getAccessToken = (): string | null => {
  return null;
};

export const getRefreshToken = (): string | null => {
  return null;
};

export const removeTokens = () => {
  if (typeof window === 'undefined') return;

  const secure = process.env.NODE_ENV === 'production';
  const secureFlag = secure ? 'secure; ' : '';

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
  const deviceId = getDeviceId();

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (deviceId) {
    headers['x-device-id'] = deviceId;
  }

  return headers;
};

const inflightRequests = new Map<string, Promise<Response>>();
const API_ORIGIN = API_CONFIG.BASE_URL.replace(/\/$/, '');

const toProxyUrl = (inputUrl: string): string => {
  if (inputUrl.startsWith('/api/')) {
    return inputUrl;
  }

  if (inputUrl.startsWith('/')) {
    const normalized = inputUrl.replace(/^\/+/, '');
    return `/api/proxy/${normalized}`;
  }

  const url = new URL(inputUrl);
  if (url.origin !== API_ORIGIN) {
    throw new Error('fetchWithAuth supports only API base origin');
  }

  const normalizedPath = url.pathname.replace(/^\/+/, '');
  return `/api/proxy/${normalizedPath}${url.search}`;
};

const doFetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(toProxyUrl(url), {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    },
    credentials: 'include',
    cache: 'no-cache'
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    window.location.href = getLocalizedAppPath('/login');
  }
  return response;
};

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const method = (options.method || 'GET').toUpperCase();
  if (method === 'GET') {
    const key = url;
    const existing = inflightRequests.get(key);
    if (existing) {
      return existing.then((res) => res.clone());
    }
    const promise = doFetchWithAuth(url, options).finally(() => {
      inflightRequests.delete(key);
    });
    inflightRequests.set(key, promise);
    const res = await promise;
    return res.clone();
  }

  return doFetchWithAuth(url, options);
};
