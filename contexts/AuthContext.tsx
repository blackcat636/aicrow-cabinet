'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { removeTokens, getAccessToken, getRefreshToken } from '@/lib/auth';
import { authApi } from '@/lib/apiAuth';
import { userApi } from '@/lib/apiUser';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<any>;
  logout: () => Promise<void>;
  clearError: () => void;
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
  const pathname = usePathname();
  const isLoggingOutRef = useRef(false);

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
          return;
        }

        // Try to get profile using current cookies
        const res = await fetch('/api/users/profile', { method: 'GET', cache: 'no-cache' });
        if (res.ok) {
          const profile = await res.json();
          setIsAuthenticated(true);
          setUser({
            id: profile.id.toString(),
            email: profile.email,
            username: profile.username,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phone: profile.phone,
            photo: profile.photo,
            role: profile.role,
            balance: '0',
            frozenBalance: '0'
          });
        } else if (res.status === 401) {
          // Attempt refresh and retry
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', cache: 'no-cache' });
          if (refreshRes.ok) {
            const profileRes = await fetch('/api/users/profile', { method: 'GET', cache: 'no-cache' });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              setIsAuthenticated(true);
              setUser({
                id: profile.id.toString(),
                email: profile.email,
                username: profile.username,
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone,
                photo: profile.photo,
                role: profile.role,
                balance: '0',
                frozenBalance: '0'
              });
            } else {
              removeTokens();
              setIsAuthenticated(false);
              setUser(null);
            }
          } else {
            removeTokens();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        removeTokens();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [pathname]);

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
      removeTokens();
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      if (data.user) {
        setIsAuthenticated(true);
        // Load full user profile to get photo and other details
        try {
          const profile = await userApi.getProfile();
          setUser({
            id: profile.id.toString(),
            email: profile.email,
            username: profile.username,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phone: profile.phone,
            photo: profile.photo,
            role: profile.role,
            balance: data.user.balance || '0',
            frozenBalance: data.user.frozenBalance || '0'
          });
        } catch (error) {
          setUser(data.user);
        }
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    register,
    logout,
    clearError
  }), [user, isAuthenticated, isLoading, error, login, register, logout, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};