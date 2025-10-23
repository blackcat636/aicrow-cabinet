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

// Flag to prevent concurrent refresh requests
let isRefreshing = false;

// Helper function to check if token is valid
const isTokenValid = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return false;

  const timeUntilExpiry = decoded.exp * 1000 - Date.now();
  return timeUntilExpiry > 300000; // 5 minutes
};

export const refreshAccessToken = async (): Promise<boolean> => {
  // Prevent concurrent refresh requests
  if (isRefreshing) {
    // Wait for current refresh to complete
    while (isRefreshing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    // Check if we still need to refresh after waiting
    const currentToken = getAccessToken();
    if (currentToken && isTokenValid(currentToken)) {
      return true;
    }
  }

  const refreshToken = getRefreshToken();
  const deviceId = getDeviceId();

  // Set refreshing flag
  isRefreshing = true;

  if (!refreshToken || !deviceId) {
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

      // Clear refreshing flag
      isRefreshing = false;
      return true;
    }

    // Clear refreshing flag
    isRefreshing = false;
    return false;
  } catch (error) {
    // Safe error details logging
    try {
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        refreshToken: refreshToken
          ? `${refreshToken.substring(0, 20)}...`
          : 'null',
        deviceId: deviceId,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name || 'Unknown',
        refreshTokenDetails: refreshToken
          ? {
              length: refreshToken.length,
              startsWith: refreshToken.substring(0, 20),
              endsWith: refreshToken.substring(refreshToken.length - 20),
              isValidJWT: refreshToken.split('.').length === 3
            }
          : null,
        deviceIdDetails: deviceId
          ? {
              length: deviceId.length,
              isValidUUID:
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                  deviceId
                )
            }
          : null,
        environment: typeof window === 'undefined' ? 'server' : 'client',
        documentCookies:
          typeof document !== 'undefined' ? document.cookie : 'N/A'
      };
    } catch (logError) {
      console.error('❌ Failed to log error details:', logError);
    }

    // Clear refreshing flag
    isRefreshing = false;
    return false;
  }
};

// Function to check if token needs to be refreshed before API request
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
    try {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  return true;
};
