'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { User, LoginRequest, RegisterRequest, ImpersonationInfo, FacebookAuthResponse } from '@/types/auth';
import { removeTokens, getAccessToken, getRefreshToken, getImpersonationMeta, clearImpersonationMeta, setImpersonationMeta, setTokens, getDeviceId } from '@/lib/auth';
import { authApi } from '@/lib/apiAuth';
import { userApi } from '@/lib/apiUser';
import { facebookApi } from '@/lib/apiFacebook';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<any>;
  logout: () => Promise<void>;
  clearError: () => void;
  impersonationInfo: ImpersonationInfo | null;
  impersonateUser: (userId: number | string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  loginWithFacebook: (code: string) => Promise<void>;
  linkFacebook: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pathname, setPathname] = useState<string>('/');
  const isLoggingOutRef = useRef(false);
  const [impersonationInfo, setImpersonationInfo] = useState<ImpersonationInfo | null>(null);

  const mapProfileToUser = useCallback((profile: any): User => {
    return {
      id: profile.id?.toString() || '',
      email: profile.email,
      username: profile.username,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone,
      photo: profile.photo,
      role: profile.role,
      balance: '0',
      frozenBalance: '0'
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePathname = () => {
      const currentPath = window.location.pathname;
      const normalizedPath = currentPath.replace(/^\/(uk|en|fr)(\/|$)/, '/') || '/';
      setPathname(normalizedPath);
    };
    
    updatePathname();
    window.addEventListener('popstate', updatePathname);
    const interval = setInterval(updatePathname, 100);
    
    return () => {
      window.removeEventListener('popstate', updatePathname);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isLoggingOutRef.current) {
          return;
        }
        if (pathname === '/login' || pathname === '/signup') {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        const at = getAccessToken();
        const rt = getRefreshToken();
        if (!at && !rt) {
          setIsAuthenticated(false);
          setUser(null);
          setImpersonationInfo(null);
          return;
        }

        const res = await fetch('/api/users/profile', { method: 'GET', cache: 'no-cache' });
        if (res.ok) {
          const profile = await res.json();
          setIsAuthenticated(true);
          setUser(mapProfileToUser(profile));
          setImpersonationInfo(getImpersonationMeta());
        } else if (res.status === 401) {
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', cache: 'no-cache' });
          if (refreshRes.ok) {
            const profileRes = await fetch('/api/users/profile', { method: 'GET', cache: 'no-cache' });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              setIsAuthenticated(true);
              setUser(mapProfileToUser(profile));
              setImpersonationInfo(getImpersonationMeta());
            } else {
              removeTokens();
              setIsAuthenticated(false);
              setUser(null);
              setImpersonationInfo(null);
            }
          } else {
            removeTokens();
            setIsAuthenticated(false);
            setUser(null);
            setImpersonationInfo(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setImpersonationInfo(null);
        }
      } catch (error) {
        removeTokens();
        setIsAuthenticated(false);
        setUser(null);
        setImpersonationInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [pathname, mapProfileToUser]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    isLoggingOutRef.current = true;
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });

    } catch (error) {
    } finally {
      clearImpersonationMeta();
      removeTokens();
      setIsAuthenticated(false);
      setUser(null);
      setImpersonationInfo(null);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  const impersonateUser = useCallback(async (userId: number | string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.impersonateUser(Number(userId));
      if (result?.data?.user) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        const meta = result.data.impersonation || getImpersonationMeta() || null;
        if (meta) {
          setImpersonationMeta(meta);
        }
        setImpersonationInfo(meta);
      } else {
        throw new Error('Impersonation failed');
      }
    } catch (error: any) {
      setError(error.message || 'Impersonation failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const meta = getImpersonationMeta();
    setImpersonationInfo(meta);
  }, [user?.id]);

  const stopImpersonation = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.stopImpersonation();
      clearImpersonationMeta();
      const profile = await userApi.getProfile();
      setUser(mapProfileToUser(profile));
      setIsAuthenticated(true);
      setImpersonationInfo(null);
    } catch (error: any) {
      removeTokens();
      setIsAuthenticated(false);
      setUser(null);
      setImpersonationInfo(null);
      setError(error.message || 'Failed to stop impersonation');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto refresh token via server API
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        if (isLoggingOutRef.current) return;
        const res = await fetch('/api/auth/refresh', { method: 'POST', cache: 'no-cache' });
        if (!res.ok) {
          logout();
        } else {
        }
      } catch (error) {
        logout();
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    const logPrefix = '[AuthContext Login]';
    
    setIsLoading(true);
    setError(null);

    try {
      let loginUrl = '/api/auth/login';
      const loginParams = new URLSearchParams();
      if (credentials.redirectUri) {
        loginParams.set('redirect_uri', credentials.redirectUri);
      }
      if (credentials.service) {
        loginParams.set('service', credentials.service);
      }
      if ([...loginParams.keys()].length) {
        loginUrl += `?${loginParams.toString()}`;
      }

      console.log(`${logPrefix} Starting login:`, {
        hasRedirectUri: !!credentials.redirectUri,
        redirectUri: credentials.redirectUri,
        service: credentials.service,
        loginUrl: loginUrl,
        isSSOFlow: !!(credentials.redirectUri || credentials.service)
      });

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        cache: 'no-cache'
      });

      console.log(`${logPrefix} Login response:`, {
        status: response.status,
        redirected: response.redirected,
        redirectUrl: response.url
      });

      if (response.redirected && response.url) {
        console.log(`${logPrefix} Response redirected to:`, response.url);
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`${logPrefix} Login failed:`, errorData);
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      console.log(`${logPrefix} Login response data:`, {
        hasRedirectUrl: !!data?.data?.redirectUrl,
        redirectUrl: data?.data?.redirectUrl,
        hasUser: !!data.user,
        hasTokens: !!(data?.data?.accessToken && data?.data?.refreshToken)
      });

      if (data?.data?.redirectUrl) {
        console.log(`${logPrefix} SSO flow - redirecting to:`, data.data.redirectUrl);
        window.location.href = data.data.redirectUrl;
        return;
      }

      if (data.user) {
        console.log(`${logPrefix} Regular login successful, fetching profile`);
        setIsAuthenticated(true);
        try {
          const profile = await userApi.getProfile();
          setUser(mapProfileToUser(profile));
        } catch (error) {
          console.warn(`${logPrefix} Failed to fetch profile, using user from response`);
          setUser(data.user);
        }
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error(`${logPrefix} Login error:`, error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithFacebook = useCallback(async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = (await facebookApi.verify(code, false)) as FacebookAuthResponse;
      const data = result?.data;

      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error('Invalid credentials');
      }

      const deviceId = data.deviceId || getDeviceId();

      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        deviceId
      });

      const profile = await userApi.getProfile();
      setUser(mapProfileToUser(profile));
      setIsAuthenticated(true);
      setImpersonationInfo(getImpersonationMeta());
    } catch (error: any) {
      removeTokens();
      setIsAuthenticated(false);
      setUser(null);
      setImpersonationInfo(null);
      setError(error?.message || 'Invalid credentials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mapProfileToUser]);

  const linkFacebook = useCallback(async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await facebookApi.verify(code, true);
      const profile = await userApi.getProfile();
      setUser(mapProfileToUser(profile));
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error?.message || 'Facebook link failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mapProfileToUser]);

  const register = useCallback(async (userData: RegisterRequest): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        cache: 'no-cache'
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Registration failed';
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithFacebook,
    linkFacebook,
    register,
    logout,
    clearError,
    impersonationInfo,
    impersonateUser,
    stopImpersonation
  }), [user, isAuthenticated, isLoading, error, login, loginWithFacebook, linkFacebook, register, logout, clearError, impersonationInfo, impersonateUser, stopImpersonation]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};