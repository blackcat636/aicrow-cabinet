import { UserProfile, UpdateProfileRequest, UpdateProfileResponse } from '@/types/user';
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/lib/auth';
import { getAvatarUrl } from '@/lib/avatars';
import { readApiJsonMessage } from '@/lib/api-json-error';

const API_BASE_URL = API_CONFIG.BASE_URL;

type ApiError = Error & { status?: number };

const withStatus = (error: Error, status: number): ApiError => {
  const typed = error as ApiError;
  typed.status = status;
  return typed;
};

export function getHttpErrorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const status = (error as ApiError).status;
  return typeof status === 'number' ? status : undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const unwrapProfilePayload = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload;
  }

  if ('data' in payload && payload.data != null) {
    const nested = payload.data;
    if (isRecord(nested) && 'user' in nested && nested.user != null) {
      return nested.user;
    }
    if (isRecord(nested) && 'profile' in nested && nested.profile != null) {
      return nested.profile;
    }
    return nested;
  }

  if ('user' in payload && payload.user != null) {
    return payload.user;
  }

  if ('profile' in payload && payload.profile != null) {
    return payload.profile;
  }

  return payload;
};

const normalizeProfileShape = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  if (typeof value.id === 'string') {
    const parsedId = Number(value.id);
    if (Number.isFinite(parsedId)) {
      return { ...value, id: parsedId };
    }
  }

  return value;
};

const readString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const readNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const readBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const toUserProfile = (value: unknown): UserProfile | null => {
  if (!isRecord(value)) {
    return null;
  }

  const rawId = value.id;
  const id =
    typeof rawId === 'number'
      ? rawId
      : typeof rawId === 'string' && Number.isFinite(Number(rawId))
        ? Number(rawId)
        : null;

  if (id === null) {
    return null;
  }

  return {
    id,
    uuid: readString(value.uuid),
    email: readString(value.email),
    username: readString(value.username),
    firstName: readString(value.firstName),
    lastName: readString(value.lastName),
    phone: readNullableString(value.phone),
    photo: readNullableString(value.photo),
    dateOfBirth: readNullableString(value.dateOfBirth),
    role: readString(value.role, 'USER'),
    isEmailVerified: readBoolean(value.isEmailVerified),
    referralCode: readNullableString(value.referralCode),
    referredByCode: readNullableString(value.referredByCode),
    timezone: readNullableString(value.timezone),
    createdAt: readString(value.createdAt),
    updatedAt: readString(value.updatedAt),
  };
};

function isUserProfile(value: unknown): value is UserProfile {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'number' &&
    typeof value.uuid === 'string' &&
    typeof value.email === 'string' &&
    typeof value.username === 'string' &&
    typeof value.firstName === 'string' &&
    typeof value.lastName === 'string' &&
    isNullableString(value.phone) &&
    isNullableString(value.photo) &&
    isNullableString(value.dateOfBirth) &&
    typeof value.role === 'string' &&
    typeof value.isEmailVerified === 'boolean' &&
    isNullableString(value.referralCode) &&
    isNullableString(value.referredByCode) &&
    isNullableString(value.timezone) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

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

export const userApi = {
  getProfile: async (init?: Pick<RequestInit, 'signal'>): Promise<UserProfile> => {
    const response = await fetch('/api/users/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-cache',
      credentials: 'include',
      ...init
    });

    let errorPayload: unknown;
    if (!response.ok) {
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = {};
      }
      const msg = readApiJsonMessage(errorPayload, 'Failed to get profile');
      throw withStatus(new Error(msg), response.status);
    }

    const data: unknown = await response.json();
    const profileCandidate = normalizeProfileShape(unwrapProfilePayload(data));
    const profile = toUserProfile(profileCandidate);
    if (!profile || !isUserProfile(profile)) {
      // No HTTP status: invalid body must not be treated like a non-401 API error in auth init.
      throw new Error('Invalid profile response');
    }
    return profile;
  },

  // Update user profile
  updateProfile: async (profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    try {
      // Clean up the data: remove undefined values and convert empty strings to null for optional fields
      const cleanedData: Partial<UpdateProfileRequest> = {};
      const profileKeys = Object.keys(profileData) as Array<keyof UpdateProfileRequest>;
      profileKeys.forEach(key => {
        const value = profileData[key];
        if (value !== undefined) {
          // Convert empty strings to null for optional fields
          if ((key === 'phone' || key === 'photo' || key === 'dateOfBirth') && value === '') {
            (cleanedData as Record<string, unknown>)[key] = null;
          } else {
            if (key === 'photo' && typeof value === 'string') {
              let url = getAvatarUrl(value) ?? value;
              // Convert relative path to absolute URL for backend validation
              if (typeof window !== 'undefined' && url?.startsWith('/')) {
                try {
                  url = new URL(url, window.location.origin).toString();
                } catch {}
              }
              (cleanedData as Record<string, unknown>)[key] = url;
            } else {
              (cleanedData as Record<string, unknown>)[key] = value;
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
        cache: 'no-cache',
        credentials: 'include'
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
            errorMessage = readApiJsonMessage(errorData, errorMessage);
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

      const data: unknown = await response.json();
      const profileCandidate = normalizeProfileShape(unwrapProfilePayload(data));
      const profile = toUserProfile(profileCandidate);
      if (!profile || !isUserProfile(profile)) {
        throw withStatus(new Error('Invalid profile response'), response.status);
      }
      return profile;
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
