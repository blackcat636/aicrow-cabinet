import {
  BalanceResponse,
  TransactionResponse,
  Transaction
} from '@/types/balance';
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/lib/auth';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const balanceApi = {
  // Get user balance
  getBalance: async (): Promise<BalanceResponse> => {
    try {
      const url = `${API_BASE_URL}/balance`;

      const response = await fetchWithAuth(url, {
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
  },

  // Get transactions list for current user (determined by auth token)
  getTransactions: async (): Promise<TransactionResponse> => {
    try {
      // API uses token-based authentication to determine user
      const url = `${API_BASE_URL}/balance/transactions`;

      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get transactions';

        // Handle specific status codes
        if (response.status === 401) {
          errorMessage = 'Unauthorized access';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden';
        } else if (response.status === 404) {
          // 404 might mean no transactions exist, which is valid
          // Try to get response body to see if there's more info
          let responseBody = null;
          try {
            const clonedResponse = response.clone();
            const text = await clonedResponse.text();
            try {
              responseBody = JSON.parse(text);
            } catch {
              responseBody = text;
            }
          } catch (e) {}

          // If response body has a message, use it
          if (
            responseBody &&
            typeof responseBody === 'object' &&
            responseBody.message
          ) {
            errorMessage = responseBody.message;
          } else {
            errorMessage = 'No transactions found for this currency';
          }

          // For 404, we should return empty array instead of throwing error
          // But we need to throw to maintain error flow, component will handle it
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
              errorMessage =
                response.statusText || 'Failed to get transactions';
            }
          }
        }

        // Create error object with status code
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as TransactionResponse;

      // Validate response structure
      if (data.status === 200 && data.data) {
        // Ensure transactions array exists
        if (!data.data.transactions || !Array.isArray(data.data.transactions)) {
          data.data.transactions = [];
        }
        // Ensure pagination exists
        if (!data.data.pagination) {
          data.data.pagination = {
            page: 1,
            limit: 20,
            total: data.data.transactions.length,
            pages: 1
          };
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
};
