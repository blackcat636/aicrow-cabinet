import {
  getRefreshToken,
  getDeviceId,
  setTokens,
  getAccessToken
} from './auth';
import { authApi } from './apiAuth';

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

const TOKEN_REFRESH_THRESHOLD_SEC = 600;

let refreshPromise: Promise<boolean> | null = null;

const isTokenValid = (token: string): boolean => {
  const decoded = decodeToken(token);

  if (!decoded) {
    return false;
  }

  const timeUntilExpiryMs = decoded.exp * 1000 - Date.now();
  return timeUntilExpiryMs > TOKEN_REFRESH_THRESHOLD_SEC * 1000;
};

export const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshPromise) {
    const ok = await refreshPromise;
    return ok;
  }

  const rt = getRefreshToken();
  const deviceId = getDeviceId();

  if (!rt || !deviceId) {
    return false;
  }

  refreshPromise = (async () => {
    try {
      const data = await authApi.refreshToken(rt, deviceId);
      if (data.status === 200 && data.data) {
        const decoded = decodeToken(data.data.accessToken);
        if (decoded) {
          void decoded;
        }
        setTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          deviceId
        });
        return true;
      }
      return false;
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
  const accessToken = getAccessToken();

  if (!accessToken) {
    return false;
  }

  const decoded = decodeToken(accessToken);

  if (!decoded) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;

  if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_SEC) {
    try {
      const refreshed = await refreshAccessToken();

      if (!refreshed) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
};
