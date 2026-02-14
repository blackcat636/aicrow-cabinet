import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/lib/auth';
import {
  ExternalServicesListResponse,
  ExternalServiceSessionsResponse
} from '@/types/externalService';

const API_BASE_URL = API_CONFIG.BASE_URL;
const ENDPOINTS = API_CONFIG.ENDPOINTS.EXTERNAL_SERVICES;

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json();
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
  } catch {
    // Keep fallback for non-JSON responses.
  }
  return fallback;
};

export const externalServicesApi = {
  getGrantedServices: async (): Promise<ExternalServicesListResponse['data']> => {
    const response = await fetchWithAuth(`${API_BASE_URL}${ENDPOINTS.MY_SERVICES}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const message = await getErrorMessage(response, 'Failed to load external services');
      const error = new Error(message);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const data = (await response.json()) as ExternalServicesListResponse;
    return Array.isArray(data.data) ? data.data : [];
  },

  getServiceSessions: async (serviceId: number): Promise<ExternalServiceSessionsResponse['data']> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}${ENDPOINTS.SERVICE_SESSIONS(serviceId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      const message = await getErrorMessage(response, 'Failed to load service sessions');
      const error = new Error(message);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const data = (await response.json()) as ExternalServiceSessionsResponse;
    return Array.isArray(data.data) ? data.data : [];
  },

  revokeServiceAccess: async (serviceId: number): Promise<void> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}${ENDPOINTS.REVOKE_SERVICE(serviceId)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      const message = await getErrorMessage(response, 'Failed to revoke service access');
      const error = new Error(message);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }
  },

  revokeSessionAccess: async (serviceId: number, sessionId: number): Promise<void> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}${ENDPOINTS.REVOKE_SESSION(serviceId, sessionId)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      const message = await getErrorMessage(response, 'Failed to revoke session access');
      const error = new Error(message);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }
  }
};
