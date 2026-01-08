export const API_CONFIG = {
  BASE_URL:
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    'https://api.tempdomain.site',

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
    WORKFLOWS: {
      BASE: '/automations/user/workflows',
      USER_WORKFLOWS: '/automations/user/my-workflows',
      SCHEDULES: '/automations/user/schedules',
      EXECUTIONS: '/automations/user/executions'
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
