'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
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
              // Token is valid, set user data
              if (decoded.email) {
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
                // Token is valid, no need to set it again
                setIsAuthenticated(true);
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
                    // Token is already set by refreshAccessToken
                    setIsAuthenticated(true);
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
  }, [isAuthenticated]);

  // Logout function
  const logout = async (): Promise<void> => {
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
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
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
        // Set user data
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(userData.email, userData.password, userData.confirmPassword);

      if (response.status === 200 || response.success) {
        // Registration successful, but user needs to verify email
        setError(null);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};