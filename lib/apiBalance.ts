import { BalanceResponse } from '@/types/balance';
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/lib/auth';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const balanceApi = {
  // Get user balance
  getBalance: async (): Promise<BalanceResponse> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get balance';

        // Handle specific status codes
        if (response.status === 401) {
          errorMessage = 'Unauthorized access';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden';
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
              errorMessage = response.statusText || 'Failed to get balance';
            }
          }
        }

        // Create error object with status code
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as BalanceResponse;
      return data;
    } catch (error) {
      throw error;
    }
  }
};
