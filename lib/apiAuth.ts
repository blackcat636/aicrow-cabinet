import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ChangeEmailRequest,
  ConfirmEmailChangeRequest,
  ImpersonateResponse
} from '@/types/auth';
import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const authApi = {
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

        if (response.status === 401) {
          errorMessage = 'Invalid credentials';
        } else {
          try {
            const errorData = await response.json();

            if (errorData.message) {
              if (errorData.message === 'Invalid credentials') {
                errorMessage = 'Invalid credentials';
              } else {
                errorMessage = errorData.message;
              }
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
              errorMessage = response.statusText || 'Login failed';
            }
          }
        }

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
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch (textError) {
              errorMessage = response.statusText || 'Registration failed';
            }
          }
        }

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
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch (textError) {
              errorMessage = response.statusText || 'Token refresh failed';
            }
          }
        }

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

  impersonateUser: async (userId: number): Promise<ImpersonateResponse> => {
    const response = await fetch(`/api/auth/admin/users/${userId}/impersonate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Impersonation failed';
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return (await response.json()) as ImpersonateResponse;
  },

  stopImpersonation: async (): Promise<void> => {
    const response = await fetch('/api/auth/admin/stop-impersonate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to stop impersonation';
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }
  },

  getUsersList: async (): Promise<any> => {
    const response = await fetch('/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || 'Failed to load users';
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return await response.json();
  },

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
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            errorMessage = response.statusText || 'Logout failed';
          }
        }

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
