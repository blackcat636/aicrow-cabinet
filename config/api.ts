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
      SSO_INITIATE: '/auth/sso/initiate'
    },
    USERS: {
      PROFILE: '/users/profile'
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
      PURCHASE: (id: number) => `/subscription-plans/${id}/purchase`,
      TRIAL_CONVERT: (userPlanId: number) =>
        `/subscription-plans/trial/${userPlanId}/convert`
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
