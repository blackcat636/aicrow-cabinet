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
  } catch (e) {
    return null;
  }
};

export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  const deviceId = getDeviceId();

  if (!refreshToken || !deviceId) {
    console.error('❌ Token refresh failed: No refresh token or device ID');
    return false;
  }

  try {
    const data = await authApi.refreshToken(refreshToken, deviceId);

    if (data.status === 200 && data.data) {
      // Decode and log token expiration
      const decoded = decodeToken(data.data.accessToken);
      if (decoded) {
        const expirationDate = new Date(decoded.exp * 1000);
        const timeUntilExpiry = decoded.exp * 1000 - Date.now();
      }

      setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        deviceId: deviceId
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return false;
  }
};

// Функція для перевірки чи потрібно оновити токен перед API запитом
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

  // If token expires in less than 10 minutes, try to refresh
  if (timeUntilExpiry < 600) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return false;
    }
  }

  return true;
};
