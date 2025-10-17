import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse
} from '@/types/auth';
import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const authApi = {
  // Логін
  login: async (
    email: string,
    password: string,
    deviceId: string
  ): Promise<LoginResponse> => {
    try {
      const requestData = { email, password };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        cache: 'no-cache'
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';

        // Handle specific status codes first
        if (response.status === 401) {
          errorMessage = 'Invalid credentials';
        } else {
          try {
            const errorData = await response.json();

            if (errorData.message) {
              // Translate Ukrainian messages to English
              if (errorData.message === 'Невірні облікові дані') {
                errorMessage = 'Invalid credentials';
              } else {
                errorMessage = errorData.message;
              }
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // If JSON parsing fails, try to get text
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch (textError) {
              // Fallback to status text
              errorMessage = response.statusText || 'Login failed';
            }
          }
        }

        // Create error object with status code
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as LoginResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Реєстрація
  register: async (
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, confirmPassword }),
        cache: 'no-cache'
      });

      if (!response.ok) {
        let errorMessage = 'Registration failed';

        // Handle specific status codes
        if (response.status === 409) {
          errorMessage = 'User with this email already exists';
        } else if (response.status === 400) {
          errorMessage = 'Invalid data provided';
        } else {
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // If JSON parsing fails, try to get text
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch (textError) {
              // Fallback to status text
              errorMessage = response.statusText || 'Registration failed';
            }
          }
        }

        // Create error object with status code
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Рефреш токена
  refreshToken: async (
    refreshToken: string,
    deviceId: string
  ): Promise<RefreshTokenResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken, deviceId }),
        cache: 'no-cache'
      });

      if (!response.ok) {
        let errorMessage = 'Token refresh failed';

        // Handle specific status codes
        if (response.status === 401) {
          errorMessage = 'Invalid refresh token';
        } else {
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // If JSON parsing fails, try to get text
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch (textError) {
              // Fallback to status text
              errorMessage = response.statusText || 'Token refresh failed';
            }
          }
        }

        // Create error object with status code
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as RefreshTokenResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        let errorMessage = 'Logout failed';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            // Fallback to status text
            errorMessage = response.statusText || 'Logout failed';
          }
        }

        // Create error object with status code
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
};
