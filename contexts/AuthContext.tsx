'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { User, LoginRequest, RegisterRequest, ImpersonationInfo } from '@/types/auth';
import { UserProfile } from '@/types/user';
import { getImpersonationMeta, clearImpersonationMeta, setImpersonationMeta } from '@/lib/auth';
import { authApi } from '@/lib/apiAuth';
import { userApi } from '@/lib/apiUser';
import { facebookApi } from '@/lib/apiFacebook';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<unknown>;
  logout: () => Promise<void>;
  clearError: () => void;
  impersonationInfo: ImpersonationInfo | null;
  impersonateUser: (userId: number | string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  loginWithFacebook: (code: string) => Promise<void>;
  linkFacebook: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_LOG = true; // Set to false to disable auth debug logs
type ProfileShape = {
  id?: string | number | null;
  email?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  photo?: string | null;
  role?: string | null;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

function authLog(message: string, data?: Record<string, unknown>) {
  if (AUTH_LOG && typeof window !== 'undefined') {
    const payload = data != null ? ` ${JSON.stringify(data)}` : '';
    console.warn(`[AuthContext] ${message}${payload}`);
  }
}

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
  const authInitRequestIdRef = useRef(0);
  const [impersonationInfo, setImpersonationInfo] = useState<ImpersonationInfo | null>(null);

  const mapProfileToUser = useCallback((profile: ProfileShape): User => {
    return {
      id: profile.id?.toString() || '',
      email: profile.email || '',
      username: profile.username || '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || null,
      photo: profile.photo || null,
      role: profile.role || 'USER',
      balance: '0',
      frozenBalance: '0'
    };
  }, []);

  const mapUserProfileToShape = useCallback(
    (profile: UserProfile): ProfileShape => ({
      ...profile,
      id: profile.id
    }),
    []
  );

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

  // Run auth init only on mount to avoid re-fetch/abort on pathname change (which caused "User" flash).
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isActive = true;
    const requestId = ++authInitRequestIdRef.current;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const currentPath = window.location.pathname.replace(/^\/(uk|en|fr)(\/|$)/, '/') || '/';
    authLog('effect run (mount only)', { requestId, pathname: currentPath });

    const applyUnauthenticatedState = (clearImpersonation: boolean, reason: string) => {
      if (!isActive || requestId !== authInitRequestIdRef.current) return;
      authLog('applyUnauthenticatedState (user set to null)', { requestId, reason, clearImpersonation });
      setIsAuthenticated(false);
      setUser(null);
      if (clearImpersonation) {
        setImpersonationInfo(null);
      }
    };

    const applyAuthenticatedState = (profile: ProfileShape) => {
      if (!isActive || requestId !== authInitRequestIdRef.current) return;
      authLog('applyAuthenticatedState', { requestId, username: profile?.username, id: profile?.id });
      setIsAuthenticated(true);
      setUser(mapProfileToUser(profile));
      setImpersonationInfo(getImpersonationMeta());
    };

    const initializeAuth = async () => {
      try {
        if (isLoggingOutRef.current) {
          authLog('skip: isLoggingOutRef.current');
          return;
        }
        if (currentPath === '/login' || currentPath === '/signup') {
          authLog('path is login/signup, clearing auth state');
          applyUnauthenticatedState(false, 'pathname_login_signup');
          return;
        }

        authLog('fetching /api/users/profile', { requestId });
        const res = await fetch('/api/users/profile', {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal
        });
        authLog('profile response', { requestId, status: res.status, ok: res.ok });

        if (res.ok) {
          const profile = await res.json();
          applyAuthenticatedState(profile);
        } else if (res.status === 401) {
          authLog('401, trying refresh', { requestId });
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            cache: 'no-cache',
            signal: controller.signal
          });
          authLog('refresh response', { requestId, status: refreshRes.status, ok: refreshRes.ok });
          if (refreshRes.ok) {
            const profileRes = await fetch('/api/users/profile', {
              method: 'GET',
              cache: 'no-cache',
              signal: controller.signal
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              applyAuthenticatedState(profile);
            } else {
              authLog('profile after refresh failed', { requestId, status: profileRes.status });
              applyUnauthenticatedState(true, 'profile_after_refresh_failed');
            }
          } else {
            authLog('refresh failed', { requestId });
            applyUnauthenticatedState(true, 'refresh_failed');
          }
        } else {
          authLog('non-200 non-401: keeping user (no clear)', { requestId, status: res.status });
        }
      } catch (error) {
        const err = error as { name?: string; message?: string };
        authLog('catch', {
          requestId,
          name: err?.name,
          message: err?.message
        });
        if (err?.name === 'AbortError') {
          authLog('AbortError, skipping');
          return;
        }
        applyUnauthenticatedState(true, 'catch_any_error');
      } finally {
        clearTimeout(timeoutId);
        if (isActive && requestId === authInitRequestIdRef.current) {
          setIsLoading(false);
          authLog('setIsLoading(false)', { requestId });
        }
      }
    };

    initializeAuth();

    return () => {
      authLog('effect cleanup (abort)', { requestId });
      isActive = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [mapProfileToUser]);

  // When user navigates to login/signup, clear auth state (no re-fetch).
  useEffect(() => {
    if (pathname === '/login' || pathname === '/signup') {
      authLog('path changed to login/signup, clearing auth state');
      setIsAuthenticated(false);
      setUser(null);
      setImpersonationInfo(null);
    }
  }, [pathname]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    isLoggingOutRef.current = true;

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });
    } catch (error) {
      // Continue to clear state and redirect even on network error
    } finally {
      clearImpersonationMeta();
      setIsAuthenticated(false);
      setUser(null);
      setImpersonationInfo(null);
      // Keep isLoading true until redirect so header shows "…" instead of "User" flash
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        setIsLoading(false);
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
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Impersonation failed'));
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
      setUser(mapProfileToUser(mapUserProfileToShape(profile)));
      setIsAuthenticated(true);
      setImpersonationInfo(null);
    } catch (error: unknown) {
      setIsAuthenticated(false);
      setUser(null);
      setImpersonationInfo(null);
      setError(getErrorMessage(error, 'Failed to stop impersonation'));
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

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        cache: 'no-cache'
      });

      if (response.redirected && response.url) {
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AuthContext] Login failed:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      if (data?.data?.redirectUrl) {
        window.location.href = data.data.redirectUrl;
        return;
      }

      if (data.user) {
        setIsAuthenticated(true);
        try {
          const profile = await userApi.getProfile();
          setUser(mapProfileToUser(mapUserProfileToShape(profile)));
        } catch (error) {
          setUser(data.user);
        }
      } else {
        throw new Error('Login failed');
      }
    } catch (error: unknown) {
      console.error('[AuthContext] Login error:', error);
      setError(getErrorMessage(error, 'Login failed'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithFacebook = useCallback(async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await facebookApi.verify(code, false);
      const profile = await userApi.getProfile();
      setUser(mapProfileToUser(mapUserProfileToShape(profile)));
      setIsAuthenticated(true);
      setImpersonationInfo(getImpersonationMeta());
    } catch (error: unknown) {
      setIsAuthenticated(false);
      setUser(null);
      setImpersonationInfo(null);
      setError(getErrorMessage(error, 'Invalid credentials'));
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
      setUser(mapProfileToUser(mapUserProfileToShape(profile)));
      setIsAuthenticated(true);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Facebook link failed'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mapProfileToUser, mapUserProfileToShape]);

  const register = useCallback(async (userData: RegisterRequest): Promise<unknown> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userData.email, password: userData.password, confirmPassword: userData.confirmPassword }),
        cache: 'no-cache'
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Registration failed';
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Registration failed');
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