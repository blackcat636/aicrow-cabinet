import { NextRequest } from 'next/server';
import { User } from '@/types/auth';
import { ensureValidToken, refreshAccessToken } from './auth-utils';

// Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

// Device ID management
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') {
    return 'server-device-id';
  }

  let deviceId = getCookieValue('device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    setCookieValue('device_id', deviceId, 365 * 24 * 60 * 60); // 1 year
  }
  return deviceId;
};

const generateDeviceId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Cookie management
const setCookieValue = (name: string, value: string, maxAge: number) => {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; secure; samesite=strict`;
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

// Token management
export const setTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;

  // Set access token (no max-age, expires when backend says so)
  setCookieValue('access_token', tokens.accessToken, 0);

  // Set refresh token (1 year)
  setCookieValue('refresh_token', tokens.refreshToken, 365 * 24 * 60 * 60);

  // Set device ID (1 year)
  setCookieValue('device_id', tokens.deviceId, 365 * 24 * 60 * 60);
};

export const getTokens = (request?: NextRequest) => {
  if (request) {
    // Server-side: get from request cookies
    return {
      accessToken: request.cookies.get('access_token')?.value || null,
      refreshToken: request.cookies.get('refresh_token')?.value || null,
      deviceId: request.cookies.get('device_id')?.value || null
    };
  } else {
    // Client-side: get from document cookies
    return {
      accessToken: getCookieValue('access_token'),
      refreshToken: getCookieValue('refresh_token'),
      deviceId: getCookieValue('device_id')
    };
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

  // Clear all auth cookies
  document.cookie =
    'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
  document.cookie =
    'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
  document.cookie =
    'device_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
};

// Get auth headers for API requests
export const getAuthHeaders = (): HeadersInit => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
};

// Функція для автоматичного оновлення токенів при API запитах
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> => {
  const maxRetries = 2;

  try {
    // Спочатку перевіряємо чи потрібно оновити токен
    await ensureValidToken();

    // Виконуємо запит з актуальним токеном
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      },
      cache: 'no-cache'
    });

    // Якщо отримали 401, намагаємося оновити токен і повторити запит
    if (response.status === 401 && retryCount < maxRetries) {
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        return fetchWithAuth(url, options, retryCount + 1);
      } else {
        removeTokens();
        window.location.href = '/';
        throw new Error('Unauthorized');
      }
    }

    return response;
  } catch (error) {
    // Retry logic для мережевих помилок
    if (retryCount < maxRetries && error instanceof TypeError) {
      const delay = Math.pow(2, retryCount) * 1000; // Експоненційна затримка
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithAuth(url, options, retryCount + 1);
    }

    throw error;
  }
};
