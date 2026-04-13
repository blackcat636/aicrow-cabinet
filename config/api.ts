const normalizeBaseUrl = (value?: string): string => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  return trimmed.replace(/\/+$/, '');
};

const resolvedBaseUrl =
  normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
  normalizeBaseUrl(process.env.API_BASE_URL) ||
  'https://app.aipills.ca';

export const API_CONFIG = {
  BASE_URL: resolvedBaseUrl,

  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      ME: '/auth/profile',
      SSO_INITIATE_CHECK: '/auth/sso/initiate-check',
      SSO_EXCHANGE: '/auth/sso/exchange'
    },
    USERS: {
      PROFILE: '/users/profile'
    },
    EXTERNAL_SERVICES: {
      MY_SERVICES: '/users/me/external-services',
      SERVICE_SESSIONS: (serviceId: number) =>
        `/users/me/external-services/${serviceId}/sessions`,
      REVOKE_SERVICE: (serviceId: number) =>
        `/users/me/external-services/${serviceId}`,
      REVOKE_SESSION: (serviceId: number, sessionId: number) =>
        `/users/me/external-services/${serviceId}/sessions/${sessionId}`
    },
    WORKFLOWS: {
      BASE: '/automations/user/workflows',
      USER_WORKFLOWS: '/automations/user/my-workflows',
      SCHEDULES: '/automations/user/schedules',
      EXECUTIONS: '/automations/user/executions'
    },
    SUBSCRIPTION: {
      PLANS: '/subscription-plans',
      PLAN_BY_ID: (id: number) => `/subscription-plans/${id}`,
      MY_ACTIVE: '/subscription-plans/my/active',
      MY_HISTORY: '/subscription-plans/my/history',
      PURCHASE: (id: number) => `/subscription-plans/${id}/purchase`,
      CHECKOUT: (id: number) => `/subscription-plans/${id}/checkout`,
      UPGRADE: (planId: number) => `/subscription-plans/${planId}/upgrade`,
      RENEW: (userPlanId: number) => `/subscription-plans/renew/${userPlanId}`,
      TRIAL_CONVERT: (userPlanId: number) =>
        `/subscription-plans/trial/${userPlanId}/convert`,
      INVOICE: '/subscription-plans/invoice',
      INVOICE_BY_ID: (invoiceId: string) =>
        `/subscription-plans/invoice/${invoiceId}`,
      INVOICE_CRYPTAPI_ADDRESS: (invoiceId: string) =>
        `/subscription-plans/invoice/${invoiceId}/cryptapi-address`
    }
  },

  TIMEOUT: 10000,

  DEFAULT_HEADERS: {
    'Content-Type': 'application/json'
  }
};

export const buildApiUrl = (endpoint: string): string => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  return url;
};
