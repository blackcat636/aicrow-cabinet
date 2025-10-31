import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ChangeEmailRequest,
  ConfirmEmailChangeRequest
} from '@/types/auth';
import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const authApi = {
  // Login
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
              if (errorData.message === 'Invalid credentials') {
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

  // Registration
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

  // Refresh token
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
        let errorData = null;

        // Handle specific status codes
        if (response.status === 401) {
          errorMessage = 'Invalid refresh token';
        } else {
          try {
            errorData = await response.json();
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
  },

  // Forgot Password - Send reset code to email
  forgotPassword: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }),
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(
          errorData.message || 'Failed to send reset code'
        );
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Reset Password - Set new password with code
  resetPassword: async (resetData: ResetPasswordRequest) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resetData),
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(
          errorData.message || 'Failed to reset password'
        );
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Verify Email - Verify email after registration
  verifyEmail: async (verifyData: VerifyEmailRequest) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verifyData),
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(
          errorData.message || 'Email verification failed'
        );
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Resend Verification - Resend verification code
  resendVerification: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }),
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(
          errorData.message || 'Failed to resend verification code'
        );
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Change email - Step 1
  changeEmail: async (newEmail: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newEmail }),
        cache: 'no-cache'
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send email change request';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            errorMessage = response.statusText || 'Failed to send email change request';
          }
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  // Confirm email change - Step 2
  confirmEmailChange: async (email: string, code: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/confirm-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code }),
        cache: 'no-cache'
      });

      if (!response.ok) {
        let errorMessage = 'Failed to confirm email change';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            errorMessage = response.statusText || 'Failed to confirm email change';
          }
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }
};
