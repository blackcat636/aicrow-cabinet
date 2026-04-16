import { getDeviceId } from './auth';

export interface TokenPayload {
  exp: number;
  iat: number;
  sub?: number;
  email?: string;
  role?: string;
}

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

let refreshPromise: Promise<boolean> | null = null;

export const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshPromise) {
    const ok = await refreshPromise;
    return ok;
  }

  refreshPromise = (async () => {
    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId
        },
        credentials: 'include',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      try {
        const errorDetails = {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          environment: typeof window === 'undefined' ? 'server' : 'client'
        };
        void errorDetails;
      } catch {}
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  const ok = await refreshPromise;
  return ok;
};

export const ensureValidToken = async (): Promise<boolean> => {
  return refreshAccessToken();
};
