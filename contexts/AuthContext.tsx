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

  // Get pathname from window.location (client-side only) to avoid static export issues
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePathname = () => {
      const currentPath = window.location.pathname;
      // Remove locale prefix if present (uk, en, fr)
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

  // Initialize authentication on mount via server API and HttpOnly cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isLoggingOutRef.current) {
          return;
        }
        // Skip auth checks on public auth routes
        if (pathname === '/login' || pathname === '/signup') {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // If no client-visible tokens exist, avoid hitting profile/refresh
        const at = getAccessToken();
        const rt = getRefreshToken();
        if (!at && !rt) {
          setIsAuthenticated(false);
          setUser(null);
          setImpersonationInfo(null);
          return;
        }

        // Try to get profile using current cookies
        const res = await fetch('/api/users/profile', { method: 'GET', cache: 'no-cache' });
        if (res.ok) {
          const profile = await res.json();
          setIsAuthenticated(true);
          setUser(mapProfileToUser(profile));
          setImpersonationInfo(getImpersonationMeta());
        } else if (res.status === 401) {
          // Attempt refresh and retry
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

  // Memoize logout function
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    isLoggingOutRef.current = true;
    
    try {
      // Call our Next.js API route for logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });

    } catch (error) {
    } finally {
      // Always clear local state
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

  // Sync impersonation meta from cookies whenever user changes
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
    }, 5 * 60 * 1000); // Refresh every 5 minutes (more frequent)

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, logout]);

  // Memoize clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize login function
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AuthContext.login] start');
      // Call our Next.js API route instead of external API directly
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        cache: 'no-cache'
      });

      if (!response.ok) {
        console.error('[AuthContext.login] response not ok', { status: response.status });
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      if (data.user) {
        setIsAuthenticated(true);
        // Load full user profile to get photo and other details
        try {
          console.log('[AuthContext.login] fetch profile after login');
          const profile = await userApi.getProfile();
          setUser(mapProfileToUser(profile));
        } catch (error) {
          console.error('[AuthContext.login] profile fetch failed, fallback', error);
          setUser(data.user);
        }
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('[AuthContext.login] error', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Facebook OAuth login
  const loginWithFacebook = useCallback(async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AuthContext.loginWithFacebook] start', { codeExists: !!code });
      const result = (await facebookApi.verify(code, false)) as FacebookAuthResponse;
      const data = result?.data;

      if (!data?.accessToken || !data?.refreshToken) {
        console.error('[AuthContext.loginWithFacebook] missing tokens');
        throw new Error('Invalid credentials');
      }

      const deviceId = data.deviceId || getDeviceId();

      console.log('[AuthContext.loginWithFacebook] set tokens', { hasDeviceId: !!deviceId });
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        deviceId
      });

      console.log('[AuthContext.loginWithFacebook] fetch profile');
      const profile = await userApi.getProfile();
      setUser(mapProfileToUser(profile));
      setIsAuthenticated(true);
      setImpersonationInfo(getImpersonationMeta());
    } catch (error: any) {
      console.error('[AuthContext.loginWithFacebook] error', error);
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

  // Facebook account linking
  const linkFacebook = useCallback(async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AuthContext.linkFacebook] start', { codeExists: !!code });
      await facebookApi.verify(code, true);
      console.log('[AuthContext.linkFacebook] fetch profile after link');
      const profile = await userApi.getProfile();
      setUser(mapProfileToUser(profile));
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('[AuthContext.linkFacebook] error', error);
      setError(error?.message || 'Facebook link failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mapProfileToUser]);

  // Memoize register function
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
      
      // Return result for email verification handling
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
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