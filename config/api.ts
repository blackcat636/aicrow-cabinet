// API Configuration
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: 'https://api.tempdomain.site',

  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      ME: '/auth/profile'
    },
    WORKFLOWS: {
      BASE: '/automations/user/workflows',
      USER_WORKFLOWS: '/automations/user/my-workflows',
      SCHEDULES: '/automations/user/schedules',
      EXECUTIONS: '/automations/user/executions'
    }
  },

  // Request timeout in milliseconds
  TIMEOUT: 10000,

  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json'
  }
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  return url;
};
