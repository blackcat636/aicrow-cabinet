// User Profile Types

export interface UserProfile {
  id: number;
  uuid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  photo: string | null;
  dateOfBirth: string | null;
  role: string;
  isEmailVerified: boolean;
  referralCode: string | null;
  referredByCode: string | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  photo?: string | null;
  dateOfBirth?: string | null;
}

export interface UpdateProfileResponse extends UserProfile {}
