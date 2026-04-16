import { UserProfile, UpdateProfileRequest, UpdateProfileResponse } from '@/types/user';
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/lib/auth';
import { getAvatarUrl } from '@/lib/avatars';

const API_BASE_URL = API_CONFIG.BASE_URL;
type ApiError = Error & { status?: number };
type ErrorPayload = {
  message?: string;
  error?: string;
  data?: {
    message?: string;
    error?: string;
  };
  errors?: string[];
};

const parseErrorPayload = (payload: unknown): ErrorPayload => {
  if (typeof payload !== 'object' || payload === null) {
    return {};
  }
  return payload as ErrorPayload;
};

const withStatus = (error: Error, status: number): ApiError => {
  const typed = error as ApiError;
  typed.status = status;
  return typed;
};

export const userApi = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    try {
      // Use Next.js API route
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = parseErrorPayload(await response.json());
        const errorMessage = errorData.error || 'Failed to get profile';
        throw withStatus(new Error(errorMessage), response.status);
      }

      const data = (await response.json()) as UserProfile;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    try {
      // Clean up the data: remove undefined values and convert empty strings to null for optional fields
      const cleanedData: Partial<UpdateProfileRequest> = {};
      Object.keys(profileData).forEach(key => {
        const value = profileData[key as keyof UpdateProfileRequest];
        if (value !== undefined) {
          // Convert empty strings to null for optional fields
          if ((key === 'phone' || key === 'photo' || key === 'dateOfBirth') && value === '') {
            cleanedData[key] = null;
          } else {
            if (key === 'photo' && typeof value === 'string') {
              let url = getAvatarUrl(value) ?? value;
              // Convert relative path to absolute URL for backend validation
              if (typeof window !== 'undefined' && url?.startsWith('/')) {
                try {
                  url = new URL(url, window.location.origin).toString();
                } catch {}
              }
              cleanedData[key] = url;
            } else {
              cleanedData[key] = value;
            }
          }
        }
      });

      // Use Next.js API route
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData),
        cache: 'no-cache'
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update profile';

        // Handle specific status codes
        if (response.status === 401) {
          errorMessage = 'Unauthorized access';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden';
        } else if (response.status === 400) {
          errorMessage = 'Invalid profile data';
        } else {
          try {
            const errorData = parseErrorPayload(await response.json());
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
              errorMessage = response.statusText || 'Failed to update profile';
            }
          }
        }

        // Create error object with status code
        throw withStatus(new Error(errorMessage), response.status);
      }

      const data = (await response.json()) as UpdateProfileResponse;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update social up - get access URL
  updateSocialUp: async (): Promise<{ access_url: string; success: boolean; duration: string }> => {
    try {
      const url = `${API_BASE_URL}/automations/user/update-social-up`;
      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get social up access URL';
        
        if (response.status === 401) {
          errorMessage = 'Unauthorized access';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden';
        } else if (response.status === 503) {
          errorMessage = 'Service temporarily unavailable';
        } else {
          try {
            const errorData = parseErrorPayload(await response.json());
            // Check for error message in different possible locations
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.data?.message) {
              errorMessage = errorData.data.message;
            } else if (errorData.data?.error) {
              errorMessage = errorData.data.error;
            } else if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
              errorMessage = errorData.errors[0];
            }
          } catch (e) {
            // If JSON parsing fails, use status text or status-specific message
            if (response.status === 503) {
              errorMessage = 'Service temporarily unavailable';
            } else {
              errorMessage = response.statusText || 'Failed to get social up access URL';
            }
          }
        }

        console.error('❌ updateSocialUp error:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage
        });

        throw withStatus(new Error(errorMessage), response.status);
      }

      const result = await response.json();
      // Handle both response formats: { status: 200, data: {...} } or direct { access_url, success, duration }
      if (result.status === 200 && result.data) {
        // Validate that access_url exists
        if (!result.data.access_url) {
          throw new Error('Access URL not found in response');
        }
        return result.data;
      }
      
      // Validate direct response format
      if (!result.access_url) {
        throw new Error('Access URL not found in response');
      }
      
      return result;
    } catch (error: unknown) {
      // Re-throw error as-is - localization should be handled in UI components
      throw error;
    }
  }
};

