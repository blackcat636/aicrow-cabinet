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
  ImpersonateResponse,
  SSOInitiateCheckResponse,
  SSOExchangeResponse
} from '@/types/auth';
import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

type ApiError = Error & {
  status?: number;
};

type ErrorPayload = {
  message?: string;
  error?: string;
};

type UsersListResponse = Record<string, unknown>;

const setErrorStatus = (error: Error, status: number): ApiError => {
  const typedError = error as ApiError;
  typedError.status = status;
  return typedError;
};

const parseErrorPayload = (payload: unknown): ErrorPayload => {
  if (typeof payload !== 'object' || payload === null) {
    return {};
  }
  return payload as ErrorPayload;
};

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
            const errorData = parseErrorPayload(await response.json());

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

        throw setErrorStatus(new Error(errorMessage), response.status);
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

        throw setErrorStatus(new Error(errorMessage), response.status);
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
            errorData = parseErrorPayload(await response.json());
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

        throw setErrorStatus(new Error(errorMessage), response.status);
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
      const errorData = parseErrorPayload(await response.json().catch(() => ({})));
      const errorMessage = errorData.error || errorData.message || 'Impersonation failed';
      throw setErrorStatus(new Error(errorMessage), response.status);
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
      const errorData = parseErrorPayload(await response.json().catch(() => ({})));
      const errorMessage = errorData.error || errorData.message || 'Failed to stop impersonation';
      throw setErrorStatus(new Error(errorMessage), response.status);
    }
  },

  getUsersList: async (): Promise<UsersListResponse> => {
    const response = await fetch('/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      const errorData = parseErrorPayload(await response.json().catch(() => ({})));
      const errorMessage = errorData.error || errorData.message || 'Failed to load users';
      throw setErrorStatus(new Error(errorMessage), response.status);
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
          const errorData = parseErrorPayload(await response.json());
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

        throw setErrorStatus(new Error(errorMessage), response.status);
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
        const errorData = parseErrorPayload(await response.json());
        throw setErrorStatus(
          new Error(errorData.message || 'Failed to send reset code'),
          response.status
        );
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
        const errorData = parseErrorPayload(await response.json());
        throw setErrorStatus(
          new Error(errorData.message || 'Failed to reset password'),
          response.status
        );
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
        const errorData = parseErrorPayload(await response.json());
        throw setErrorStatus(
          new Error(errorData.message || 'Email verification failed'),
          response.status
        );
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
        const errorData = parseErrorPayload(await response.json());
        throw setErrorStatus(
          new Error(errorData.message || 'Failed to resend verification code'),
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  ssoInitiateCheck: async (
    redirectUri: string,
    service?: string,
    accessToken?: string
  ): Promise<SSOInitiateCheckResponse> => {
    const url = new URL(
      `${API_BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SSO_INITIATE_CHECK}`
    );
    url.searchParams.set('redirect_uri', redirectUri);
    if (service) {
      url.searchParams.set('service', service);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      cache: 'no-cache'
    });

    const data = (await response.json()) as SSOInitiateCheckResponse;

    if (!response.ok) {
      throw setErrorStatus(
        new Error(data?.message || 'SSO initiate check failed'),
        response.status
      );
    }

    return data;
  },

  ssoExchange: async (
    code: string,
    redirectUri: string
  ): Promise<SSOExchangeResponse> => {
    const response = await fetch(
      `${API_BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SSO_EXCHANGE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          redirect_uri: redirectUri
        }),
        cache: 'no-cache'
      }
    );

    const data = (await response.json()) as SSOExchangeResponse;

    if (!response.ok) {
      throw setErrorStatus(
        new Error(data?.message || 'SSO exchange failed'),
        response.status
      );
    }

    return data;
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
          const errorData = parseErrorPayload(await response.json());
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

        throw setErrorStatus(new Error(errorMessage), response.status);
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
          const errorData = parseErrorPayload(await response.json());
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

        throw setErrorStatus(new Error(errorMessage), response.status);
      }
    } catch (error) {
      throw error;
    }
  }
};
