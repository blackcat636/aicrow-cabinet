export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  redirectUri?: string;
  service?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface RegisterResponse {
  requiresVerification?: boolean;
  email?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  status: number;
  data: {
    accessToken: string;
    refreshToken: string;
    deviceId: string;
    user: {
      id: string;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      photo: string | null;
      role: string;
      balance: string;
      frozenBalance: string;
    };
    impersonation?: ImpersonationInfo;
  };
}

export interface RefreshTokenResponse {
  status: number;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ImpersonatedBy {
  id: string;
  email: string;
  username: string;
}

export interface ImpersonationInfo {
  isImpersonated: boolean;
  impersonatedBy: ImpersonatedBy | null;
  impersonatedUser?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface ImpersonateResponse {
  status: number;
  data: {
    accessToken: string;
    refreshToken: string;
    deviceId: string;
    user: User;
    impersonation: ImpersonationInfo;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  photo: string | null;
  role: string;
  balance: string;
  frozenBalance: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ConfirmEmailChangeRequest {
  email: string;
  code: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
}

export interface FacebookAuthResponse {
  status: number;
  data: {
    accessToken: string;
    refreshToken: string;
    deviceId?: string;
    user: User;
  };
}

export interface SocialAccount {
  id: number;
  provider: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  createdAt: string;
}

export interface FacebookStatusResponse {
  status: number;
  data: SocialAccount[];
}

export interface SSOInitiateCheckResponse {
  status: number;
  data: {
    redirectUrl?: string;
    code?: string;
    state?: string;
    loginUrl?: string;
  };
  message?: string;
}

export interface SSOExchangeRequest {
  code: string;
  redirectUri: string;
}

export interface SSOExchangeResponse {
  status: number;
  data: {
    serviceToken: string;
    userId: number;
    serviceName?: string;
  };
  message?: string;
}
