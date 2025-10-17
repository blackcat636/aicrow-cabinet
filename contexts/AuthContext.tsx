'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { 
  getAccessToken, 
  getRefreshToken, 
  getDeviceId, 
  removeTokens, 
  isAuthenticated as checkIsAuthenticated,
  refreshTokenClient,
  decodeJWT,
  setTokens
} from '@/lib/auth';

const API_URL = 'https://api.tempdomain.site';

interface ApiResponse<T> {
  status: number | string;
  data?: T;
  message?: string;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize auth state from cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          // Check if token is valid
          const isValid = await checkIsAuthenticated();
          
          if (isValid) {
            // Try to get user info
            try {
              // Try different endpoints for user info
              const endpoints = ['/auth/profile', '/auth/me', '/auth/user', '/user/profile', '/user/me'];
              let response = null;
              let workingEndpoint = null;
              
              for (const endpoint of endpoints) {
                response = await fetch(`${API_URL}${endpoint}`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-device-id': getDeviceId() || ''
                  }
                });
                
                if (response.ok) {
                  workingEndpoint = endpoint;
                  break;
                }
              }
              
              if (!response || !response.ok) {
                // Fallback: extract user info from JWT token
                const decoded = decodeJWT(token);
                
                if (decoded) {
                  const userData = decoded.user || decoded;
                  if (userData && (userData.email || userData.sub)) {
                    const user = {
                      id: userData.sub || userData.id,
                      email: userData.email,
                      username: userData.name || userData.email?.split('@')[0] || 'User',
                      role: userData.role || 'user',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    
                    setUser(user);
                    setAccessToken(token);
                    setIsAuthenticated(true);
                    return;
                  }
                }
                throw new Error('No working user info endpoint found and JWT token does not contain user data');
              }

              if (response.ok) {
                const data = await response.json();
                setUser(data.data || data);
                setAccessToken(token);
                setIsAuthenticated(true);
              } else {
                // Try to refresh token
                const refreshed = await refreshTokenClient();
                if (refreshed) {
                  // Retry getting user info
                  const retryResponse = await fetch(`${API_URL}/auth/profile`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${getAccessToken()}`,
                      'x-device-id': getDeviceId() || ''
                    }
                  });
                  
                  if (retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    setUser(retryData.data || retryData);
                    setAccessToken(getAccessToken());
                    setIsAuthenticated(true);
                  } else {
                    // Fallback: try to get user info from refreshed token
                    const refreshedToken = getAccessToken();
                    if (refreshedToken) {
                      const decoded = decodeJWT(refreshedToken);
                      
                      if (decoded) {
                        const userData = decoded.user || decoded;
                        if (userData && (userData.email || userData.sub)) {
                          const user = {
                            id: userData.sub || userData.id,
                            email: userData.email,
                            username: userData.name || userData.email?.split('@')[0] || 'User',
                            role: userData.role || 'user',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          };
                          
                          setUser(user);
                          setAccessToken(refreshedToken);
                          setIsAuthenticated(true);
                          return;
                        }
                      }
                    }
                    throw new Error('Failed to get user info after refresh');
                  }
                } else {
                  removeTokens();
                }
              }
            } catch (error) {
              console.error('❌ Failed to get user info:', error);
              removeTokens();
            }
          } else {
            // Try to refresh token
            const refreshed = await refreshTokenClient();
            if (refreshed) {
              // Retry getting user info
              const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${getAccessToken()}`,
                  'x-device-id': getDeviceId() || ''
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                setUser(data.data || data);
                setAccessToken(getAccessToken());
                setIsAuthenticated(true);
              } else {
                // Fallback: try to get user info from refreshed token
                const refreshedToken = getAccessToken();
                if (refreshedToken) {
                  const decoded = decodeJWT(refreshedToken);
                  
                  if (decoded) {
                    const userData = decoded.user || decoded;
                    if (userData && (userData.email || userData.sub)) {
                      const user = {
                        id: userData.sub || userData.id,
                        email: userData.email,
                        username: userData.name || userData.email?.split('@')[0] || 'User',
                        role: userData.role || 'user',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      
                      setUser(user);
                      setAccessToken(refreshedToken);
                      setIsAuthenticated(true);
                      return;
                    }
                  }
                }
                throw new Error('Failed to get user info after refresh');
              }
            } else {
              removeTokens();
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        removeTokens();
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
        const refreshed = await refreshTokenClient();
        if (refreshed) {
        } else {
          await logout();
        }
      } catch (error) {
        console.error('❌ Auto refresh error:', error);
        await logout();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      
      const deviceId = getDeviceId();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(deviceId ? { 'x-device-id': deviceId } : {})
      };

      const response = await globalThis.fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: credentials.email, password: credentials.password })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || 'Authentication error';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      if (data.status === 200 && data.data) {
        // Set tokens
        setTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          deviceId: deviceId || crypto.randomUUID()
        });

        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
        setIsAuthenticated(true);
        
      } else {
        throw new Error('Unknown error');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      if (!(error instanceof Error) || !error.message.includes('Authentication error')) {
        setError('Network error. Please try again.');
      }
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
      const deviceId = getDeviceId();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(deviceId ? { 'x-device-id': deviceId } : {})
      };

      const response = await globalThis.fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || 'Registration error';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      if (data.status === 201 && data.data) {
        // Set tokens
        setTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          deviceId: deviceId || crypto.randomUUID()
        });

        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
        setIsAuthenticated(true);
        
      } else {
        throw new Error('Unknown error');
      }
    } catch (error) {
      console.error('❌ Register error:', error);
      if (!(error instanceof Error) || !error.message.includes('Registration error')) {
        setError('Network error. Please try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const deviceId = getDeviceId();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(deviceId ? { 'x-device-id': deviceId } : {})
      };

      const response = await globalThis.fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error('Logout error');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear state regardless of API response
      setUser(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      removeTokens();
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};