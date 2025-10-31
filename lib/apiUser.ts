import { UserProfile, UpdateProfileRequest, UpdateProfileResponse } from '@/types/user';
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/lib/auth';

const API_BASE_URL = API_CONFIG.BASE_URL;

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
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to get profile';
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
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
      const cleanedData: any = {};
      Object.keys(profileData).forEach(key => {
        const value = profileData[key as keyof UpdateProfileRequest];
        if (value !== undefined) {
          // Convert empty strings to null for optional fields
          if ((key === 'phone' || key === 'photo' || key === 'dateOfBirth') && value === '') {
            cleanedData[key] = null;
          } else {
            cleanedData[key] = value;
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
              errorMessage = response.statusText || 'Failed to update profile';
            }
          }
        }

        // Create error object with status code
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      const data = (await response.json()) as UpdateProfileResponse;
      return data;
    } catch (error) {
      throw error;
    }
  }
};

