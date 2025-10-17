import {
  Workflow,
  UserWorkflow,
  WorkflowSchedule,
  WorkflowExecution,
  AttachWorkflowRequest,
  CreateScheduleRequest,
  ExecuteWorkflowRequest
} from '@/types/workflow';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { getAccessToken, getDeviceId } from './auth';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const accessToken = getAccessToken();
  const deviceId = getDeviceId();

  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...(deviceId && { 'x-device-id': deviceId })
  };
};

// API Functions
export const workflowApi = {
  // Workflows
  getAvailableWorkflows: async (): Promise<Workflow[]> => {
    try {
      const url = buildApiUrl('/automations/user/workflows');

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Handle different response formats
      if (data.workflows) {
        return data.workflows;
      } else if (data.data) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Get available workflows API error:', error);
      throw error;
    }
  },

  getMyWorkflows: async (userId?: number): Promise<UserWorkflow[]> => {
    try {
      const url = buildApiUrl('/automations/user/my-workflows');

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Handle different response formats
      if (data.userWorkflows) {
        return data.userWorkflows;
      } else if (data.data) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Get my workflows API error:', error);
      throw error;
    }
  },

  attachWorkflow: async (
    userId: number,
    data: AttachWorkflowRequest
  ): Promise<UserWorkflow> => {
    try {
      const response = await fetch(
        buildApiUrl('/automations/user/my-workflows'),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...data, userId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.userWorkflow || result;
    } catch (error) {
      console.error('Attach workflow API error:', error);
      throw error;
    }
  },

  updateUserWorkflow: async (
    id: number,
    data: Partial<AttachWorkflowRequest>
  ): Promise<UserWorkflow> => {
    try {
      const response = await fetch(
        buildApiUrl(`/automations/user/my-workflows/${id}`),
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.userWorkflow || result;
    } catch (error) {
      console.error('Update user workflow API error:', error);
      throw error;
    }
  },

  toggleUserWorkflow: async (id: number): Promise<UserWorkflow> => {
    try {
      const response = await fetch(
        buildApiUrl(`/automations/user/my-workflows/${id}/toggle`),
        {
          method: 'PATCH',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.userWorkflow || result;
    } catch (error) {
      console.error('Toggle user workflow API error:', error);
      throw error;
    }
  },

  deleteUserWorkflow: async (id: number): Promise<void> => {
    try {
      const response = await fetch(
        buildApiUrl(`/automations/user/my-workflows/${id}`),
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
    } catch (error) {
      console.error('Delete user workflow API error:', error);
      throw error;
    }
  },

  // Schedules
  getSchedulesForUserWorkflow: async (
    userWorkflowId: number
  ): Promise<WorkflowSchedule[]> => {
    try {
      const response = await fetch(
        buildApiUrl(
          `/automations/user/my-workflows/${userWorkflowId}/schedules`
        ),
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data.schedules || data;
    } catch (error) {
      console.error('Get schedules API error:', error);
      throw error;
    }
  },

  createSchedule: async (
    userWorkflowId: number,
    data: CreateScheduleRequest
  ): Promise<WorkflowSchedule> => {
    try {
      const response = await fetch(
        buildApiUrl(
          `/automations/user/my-workflows/${userWorkflowId}/schedules`
        ),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...data, userWorkflowId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.schedule || result;
    } catch (error) {
      console.error('Create schedule API error:', error);
      throw error;
    }
  },

  updateSchedule: async (
    id: number,
    data: Partial<CreateScheduleRequest>
  ): Promise<WorkflowSchedule> => {
    try {
      const response = await fetch(
        buildApiUrl(`/automations/user/schedules/${id}`),
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.schedule || result;
    } catch (error) {
      console.error('Update schedule API error:', error);
      throw error;
    }
  },

  deleteSchedule: async (id: number): Promise<void> => {
    try {
      const response = await fetch(
        buildApiUrl(`/automations/user/schedules/${id}`),
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
    } catch (error) {
      console.error('Delete schedule API error:', error);
      throw error;
    }
  },

  // Executions
  executeWorkflowManually: async (
    userWorkflowId: number,
    data: ExecuteWorkflowRequest
  ): Promise<WorkflowExecution> => {
    try {
      const response = await fetch(
        buildApiUrl(`/automations/user/my-workflows/${userWorkflowId}/execute`),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...data, userWorkflowId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.execution || result;
    } catch (error) {
      console.error('Execute workflow API error:', error);
      throw error;
    }
  },

  getMyExecutions: async (userId?: number): Promise<WorkflowExecution[]> => {
    try {
      const url = buildApiUrl('/automations/user/executions');

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Handle different response formats
      if (data.executions) {
        return data.executions;
      } else if (data.data) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Get executions API error:', error);
      throw error;
    }
  },

  getExecutionDetails: async (id: number): Promise<WorkflowExecution> => {
    try {
      const response = await fetch(
        buildApiUrl(`/automations/user/executions/${id}`),
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      return result.execution || result;
    } catch (error) {
      console.error('Get execution details API error:', error);
      throw error;
    }
  }
};
