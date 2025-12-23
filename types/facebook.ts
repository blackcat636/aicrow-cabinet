import { User } from './auth';

export interface FacebookVerifyResponse {
  status: number;
  data?: {
    accessToken: string;
    refreshToken: string;
    deviceId: string;
    user?: User;
    emailDiffers?: boolean;
    userEmail?: string;
    socialEmail?: string;
    linked?: boolean;
  };
  message?: string;
}

export interface FacebookStatusResponse {
  status: number;
  data: {
    isLinked: boolean;
    facebookId?: string;
    name?: string;
    email?: string;
    linkedAt?: string;
    pictureUrl?: string;
  };
  message?: string;
}

export interface FacebookUnlinkResponse {
  status: number;
  message: string;
}

