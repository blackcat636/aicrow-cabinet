'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { 
  getAccessToken, 
  getRefreshToken, 
  getDeviceId, 
  removeTokens, 
  setTokens,
  getAuthHeaders
} from '@/lib/auth';
import { authApi } from '@/lib/apiAuth';
import { decodeToken, refreshAccessToken } from '@/lib/auth-utils';
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

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          // Check if token is valid
          const decoded = decodeToken(token);
          if (decoded) {
            const now = Math.floor(Date.now() / 1000);
            const expirationDate = new Date(decoded.exp * 1000);
            const timeUntilExpiry = decoded.exp * 1000 - Date.now();
            
            if (decoded.exp > now) {
              // Token is valid, load full user profile
              if (decoded.email) {
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
                    balance: '0',
                    frozenBalance: '0'
                  });
                } catch (error) {
                  // If profile load fails, use basic data from token
                  console.error('Failed to load user profile:', error);
                  setUser({
                    id: decoded.sub?.toString() || 'unknown',
                    email: decoded.email,
                    username: decoded.email.split('@')[0],
                    firstName: '',
                    lastName: '',
                    phone: null,
                    photo: null,
                    role: decoded.role || 'user',
                    balance: '0',
                    frozenBalance: '0'
                  });
                }
              }
            } else {
              // Token expired, try to refresh
              const refreshed = await refreshAccessToken();
              if (refreshed) {
                // Get updated token and user data
                const newToken = getAccessToken();
                if (newToken) {
                  const newDecoded = decodeToken(newToken);
                  if (newDecoded && newDecoded.email) {
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
                        balance: '0',
                        frozenBalance: '0'
                      });
                    } catch (error) {
                      // If profile load fails, use basic data from token
                      console.error('Failed to load user profile:', error);
                      setUser({
                        id: newDecoded.sub?.toString() || 'unknown',
                        email: newDecoded.email,
                        username: newDecoded.email.split('@')[0],
                        firstName: '',
                        lastName: '',
                        phone: null,
                        photo: null,
                        role: newDecoded.role || 'user',
                        balance: '0',
                        frozenBalance: '0'
                      });
                    }
                  }
                }
              } else {
                // Refresh failed, logout
                removeTokens();
                setIsAuthenticated(false);
                setUser(null);
              }
            }
          } else {
            // Invalid token
            removeTokens();
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        removeTokens();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Memoize logout function
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
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
    }
  }, []);

  // Auto refresh token
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          console.warn('⚠️ Auto-refresh failed, logging out user');
          logout();
        } else {
        }
      } catch (error) {
        console.error('❌ Auto refresh error:', error);
        logout();
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes (more frequent)

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, logout]);

  // Memoize clear error function
  const clearError = useCallback(() => {
    console.log('🧹 [AuthContext] clearError called - clearing error state');
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
          // If profile load fails, use data from login response
          console.error('Failed to load user profile:', error);
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

    console.log('🔵 [AuthContext] Starting registration:', {
      email: userData.email,
      hasPassword: !!userData.password,
      hasConfirmPassword: !!userData.confirmPassword
    });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        cache: 'no-cache'
      });

      console.log('📡 [AuthContext] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: '/api/auth/register'
      });

      const data = await response.json();
      console.log('📥 [AuthContext] Response data:', {
        data,
        hasError: !!data.error,
        hasMessage: !!data.message,
        errorValue: data.error,
        messageValue: data.message
      });

      if (!response.ok) {
        const errorMessage = data.error || 'Registration failed';
        console.log('❌ [AuthContext] Registration failed:', {
          status: response.status,
          errorMessage,
          dataError: data.error,
          dataMessage: data.message
        });
        throw new Error(errorMessage);
      }

      console.log('✅ [AuthContext] Registration successful:', data);
      // Return result for email verification handling
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      console.error('💥 [AuthContext] Exception caught:', {
        error,
        errorMessage,
        message: error.message,
        stack: error.stack
      });
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🏁 [AuthContext] Registration finished');
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