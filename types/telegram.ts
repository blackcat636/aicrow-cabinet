// Telegram API types
export interface TelegramLinkResponse {
  status: number;
  data: {
    deepLink: string;
    linkToken: string;
    expiresAt: string;
  };
}

export interface TelegramStatusResponse {
  status: number;
  data: {
    isLinked: boolean;
    telegramUsername?: string;
    telegramFirstName?: string;
    telegramLastName?: string;
    notificationsEnabled: boolean;
    linkedAt?: string;
  };
}

export interface TelegramSettingsRequest {
  notificationsEnabled: boolean;
}

export interface TelegramSettingsResponse {
  status: number;
  data: {
    notificationsEnabled: boolean;
  };
}

export interface TelegramUnlinkResponse {
  status: number;
  message: string;
}

// Admin endpoints types
export interface TelegramUser {
  id: number;
  userId: number;
  telegramUserId: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  notificationsEnabled: boolean;
  linkedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramListResponse {
  status: number;
  data: TelegramUser[];
}

export interface TelegramStatsResponse {
  status: number;
  data: {
    totalLinked: number;
    withNotificationsEnabled: number;
    withNotificationsDisabled: number;
  };
}

export interface TelegramUnlinkUserResponse {
  status: number;
  message: string;
}
