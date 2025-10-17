// Authentication Types

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string; // Optional, will be generated automatically
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
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
  };
}

export interface RefreshTokenResponse {
  status: number;
  data: {
    accessToken: string;
    refreshToken: string;
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

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
}
