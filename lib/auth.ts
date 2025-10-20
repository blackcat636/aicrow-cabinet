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
  } else {
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

// Cookie management
const setCookieValue = (name: string, value: string, maxAge: number) => {
  if (typeof document === 'undefined') return;

  const secure = process.env.NODE_ENV === 'production';
  let cookieString;

  if (maxAge === -1) {
    // Session cookie (expires when browser closes)
    cookieString = `${name}=${value}; path=/; ${secure ? 'secure; ' : ''}samesite=strict`;
  } else {
    // Persistent cookie with max-age
    cookieString = `${name}=${value}; path=/; max-age=${maxAge}; ${secure ? 'secure; ' : ''}samesite=strict`;
  }

  document.cookie = cookieString;

  // Verify cookie was set
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

// Token management
export const setTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;

  // Set access token (session cookie - expires when browser closes)
  setCookieValue('access_token', tokens.accessToken, -1);

  // Set refresh token (1 year)
  setCookieValue('refresh_token', tokens.refreshToken, 365 * 24 * 60 * 60);

  // Set device ID (1 year)
  setCookieValue('device_id', tokens.deviceId, 365 * 24 * 60 * 60);

  // Verify cookies were set
  setTimeout(() => {
    const savedAccessToken = getCookieValue('access_token');
    const savedRefreshToken = getCookieValue('refresh_token');
    const savedDeviceId = getCookieValue('device_id');
  }, 100);
};

export const getTokens = (request?: NextRequest) => {
  if (request) {
    // Server-side: get from request cookies
    const tokens = {
      accessToken: request.cookies.get('access_token')?.value || null,
      refreshToken: request.cookies.get('refresh_token')?.value || null,
      deviceId: request.cookies.get('device_id')?.value || null
    };
    return tokens;
  } else {
    // Client-side: get from document cookies
    const tokens = {
      accessToken: getCookieValue('access_token'),
      refreshToken: getCookieValue('refresh_token'),
      deviceId: getCookieValue('device_id')
    };
    return tokens;
  }
};

export const getAccessToken = (): string | null => {
  const token = getCookieValue('access_token');
  return token;
};

export const getRefreshToken = (): string | null => {
  const token = getCookieValue('refresh_token');
  return token;
};

export const removeTokens = () => {
  if (typeof window === 'undefined') return;

  const secure = process.env.NODE_ENV === 'production';
  const secureFlag = secure ? 'secure; ' : '';

  // Clear all auth cookies
  document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secureFlag}samesite=strict`;
  document.cookie = `refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secureFlag}samesite=strict`;
  document.cookie = `device_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${secureFlag}samesite=strict`;
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
        console.error('❌ fetchWithAuth: Token refresh error:', refreshError);
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
