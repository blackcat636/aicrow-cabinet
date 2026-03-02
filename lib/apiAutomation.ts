import { buildApiUrl } from '@/config/api';
import { fetchWithAuth } from './auth';

/**
 * External service from GET /automations/user/external-services.
 * Used in catalog of automatizations (Market + Dashboard).
 */
export interface ExternalService {
  id: number;
  name: string;
  description: string | null;
  link: string;
}

/**
 * Automation item - for catalog display (e.g. with price).
 */
export interface Automation {
  id: number;
  name: string;
  description: string;
  isActive?: boolean;
  priceUsd?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * User's automation (external service with SSO access).
 */
export interface UserAutomation {
  id: number;
  name: string;
  description?: string | null;
  automationId?: number;
  automation?: Automation;
  isActive?: boolean;
  priceUsd?: string;
  goToUrl?: string;
  link?: string;
}

export const automationApi = {
  /**
   * Get external services (user's SSO-accessible services).
   * GET /automations/user/external-services
   */
  getExternalServices: async (): Promise<ExternalService[]> => {
    const url = buildApiUrl('/automations/user/external-services');
    const response = await fetchWithAuth(url, { method: 'GET' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to fetch external services');
    }

    const items = data?.data ?? data?.externalServices ?? [];
    return Array.isArray(items) ? items : [];
  },

  /**
   * Get available automatizations for Market catalog.
   * Uses external-services endpoint.
   */
  getAvailableAutomatizations: async (): Promise<Automation[]> => {
    try {
      const services = await automationApi.getExternalServices();
      return services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        link: s.link
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get user's automatizations for Dashboard.
   * Uses external-services endpoint (SSO-accessible services).
   */
  getMyAutomatizations: async (): Promise<UserAutomation[]> => {
    try {
      const services = await automationApi.getExternalServices();
      return services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? undefined,
        goToUrl: s.link,
        link: s.link
      }));
    } catch {
      return [];
    }
  }
};
