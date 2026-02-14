export interface ExternalServiceItem {
  service: {
    id: number;
    name: string;
    description?: string | null;
    isActive: boolean;
  };
  activeSessionsCount: number;
  pendingSessionsCount: number;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface ExternalServiceSession {
  id: number;
  externalServiceId: number;
  deviceName?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  status: 'pending' | 'active' | 'revoked' | 'expired' | string;
  isActive: boolean;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface ExternalServicesListResponse {
  status: number;
  data: ExternalServiceItem[];
  message?: string;
}

export interface ExternalServiceSessionsResponse {
  status: number;
  data: ExternalServiceSession[];
  message?: string;
}
