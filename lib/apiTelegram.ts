import {
  TelegramLinkResponse,
  TelegramStatusResponse,
  TelegramSettingsRequest,
  TelegramSettingsResponse,
  TelegramUnlinkResponse,
  TelegramListResponse,
  TelegramStatsResponse,
  TelegramUnlinkUserResponse
} from '@/types/telegram';
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/lib/auth';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const telegramApi = {
  // User endpoints

  // Generate deep link for Telegram account connection
  generateLink: async (): Promise<TelegramLinkResponse> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/user-telegram/generate-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to generate Telegram link';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage =
            response.statusText || 'Failed to generate Telegram link';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as TelegramLinkResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get Telegram connection status
  getStatus: async (): Promise<TelegramStatusResponse> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/user-telegram/status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to get Telegram status';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error('🔍 Telegram API getStatus - Error parsing JSON:', e);
          errorMessage = response.statusText || 'Failed to get Telegram status';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as TelegramStatusResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update Telegram settings
  updateSettings: async (
    settings: TelegramSettingsRequest
  ): Promise<TelegramSettingsResponse> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/user-telegram/settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to update Telegram settings';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage =
            response.statusText || 'Failed to update Telegram settings';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as TelegramSettingsResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Unlink Telegram account
  unlink: async (): Promise<TelegramUnlinkResponse> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/user-telegram/unlink`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to unlink Telegram account';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage =
            response.statusText || 'Failed to unlink Telegram account';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as TelegramUnlinkResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Admin endpoints

  // Get list of linked Telegram accounts (admin only)
  getList: async (): Promise<TelegramListResponse> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/user-telegram/list`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to get Telegram accounts list';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage =
            response.statusText || 'Failed to get Telegram accounts list';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as TelegramListResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get Telegram statistics (admin only)
  getStats: async (): Promise<TelegramStatsResponse> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/user-telegram/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to get Telegram statistics';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage =
            response.statusText || 'Failed to get Telegram statistics';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as TelegramStatsResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Force unlink user's Telegram account (admin only)
  unlinkUser: async (userId: number): Promise<TelegramUnlinkUserResponse> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/user-telegram/${userId}/unlink`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to unlink user Telegram account';

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage =
            response.statusText || 'Failed to unlink user Telegram account';
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as TelegramUnlinkUserResponse;
      return data;
    } catch (error) {
      throw error;
    }
  }
};
