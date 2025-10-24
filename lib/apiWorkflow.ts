import {
  Workflow,
  UserWorkflow,
  WorkflowSchedule,
  WorkflowExecution,
  ExecutionsResponse,
  AttachWorkflowRequest,
  CreateScheduleRequest,
  ExecuteWorkflowRequest
} from '@/types/workflow';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { fetchWithAuth } from './auth';

// API Functions
export const workflowApi = {
  // Workflows
  getAvailableWorkflows: async (): Promise<Workflow[]> => {
    try {
      const url = buildApiUrl('/automations/user/workflows');

      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

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

      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

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
    data: AttachWorkflowRequest
  ): Promise<UserWorkflow> => {
    try {
      // Create API data object with correct field names
      const apiData = {
        workflowId: data.workflowId,
        credentialType: data.credentialType,
        credentialData: data.credentialData,
        inputDataTemplate: data.inputDataTemplate,
        name: data.name,
        description: data.description
      };

      console.log('Original data:', data);
      console.log('API data:', apiData);

      const response = await fetchWithAuth(
        buildApiUrl('/automations/user/my-workflows'),
        {
          method: 'POST',
          body: JSON.stringify(apiData)
        }
      );

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
      // Create API data object with correct field names
      const apiData: any = {};
      if (data.workflowId !== undefined) apiData.workflowId = data.workflowId;
      if (data.credentialType !== undefined)
        apiData.credentialType = data.credentialType;
      if (data.credentialData !== undefined)
        apiData.credentialData = data.credentialData;
      if (data.inputDataTemplate !== undefined)
        apiData.inputDataTemplate = data.inputDataTemplate;
      if (data.name !== undefined) apiData.name = data.name;
      if (data.description !== undefined)
        apiData.description = data.description;

      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/my-workflows/${id}`),
        {
          method: 'PUT',
          body: JSON.stringify(apiData)
        }
      );

      const result = await response.json();
      return result.userWorkflow || result;
    } catch (error) {
      console.error('Update user workflow API error:', error);
      throw error;
    }
  },

  toggleUserWorkflow: async (id: number): Promise<UserWorkflow> => {
    try {
      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/my-workflows/${id}/toggle`),
        {
          method: 'PATCH'
        }
      );

      const result = await response.json();
      return result.userWorkflow || result;
    } catch (error) {
      console.error('Toggle user workflow API error:', error);
      throw error;
    }
  },

  deleteUserWorkflow: async (id: number): Promise<void> => {
    try {
      await fetchWithAuth(buildApiUrl(`/automations/user/my-workflows/${id}`), {
        method: 'DELETE'
      });
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
      const response = await fetchWithAuth(
        buildApiUrl(
          `/automations/user/my-workflows/${userWorkflowId}/schedules`
        ),
        {
          method: 'GET'
        }
      );

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
      const response = await fetchWithAuth(
        buildApiUrl(
          `/automations/user/my-workflows/${userWorkflowId}/schedules`
        ),
        {
          method: 'POST',
          body: JSON.stringify({ ...data, userWorkflowId })
        }
      );

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
      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/schedules/${id}`),
        {
          method: 'PUT',
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();
      return result.schedule || result;
    } catch (error) {
      console.error('Update schedule API error:', error);
      throw error;
    }
  },

  deleteSchedule: async (id: number): Promise<void> => {
    try {
      await fetchWithAuth(buildApiUrl(`/automations/user/schedules/${id}`), {
        method: 'DELETE'
      });
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
      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/my-workflows/${userWorkflowId}/execute`),
        {
          method: 'POST',
          body: JSON.stringify({ ...data, userWorkflowId })
        }
      );

      const result = await response.json();
      return result.execution || result;
    } catch (error) {
      console.error('Execute workflow API error:', error);
      throw error;
    }
  },

  getMyExecutions: async (userId?: number): Promise<ExecutionsResponse> => {
    try {
      const url = buildApiUrl('/automations/user/executions');

      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      // Handle 304 Not Modified - return empty response for now
      if (response.status === 304) {
        console.warn('⚠️ 304 Not Modified - returning empty response');
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        };
      }

      const data = await response.json();

      // Handle different response formats
      if (data.data) {
        return data.data;
      } else if (data.items) {
        return data;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        };
      }
    } catch (error) {
      console.error('Get executions API error:', error);
      throw error;
    }
  },

  getExecutionDetails: async (id: number): Promise<WorkflowExecution> => {
    try {
      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/executions/${id}`),
        {
          method: 'GET'
        }
      );

      const result = await response.json();
      return result.execution || result;
    } catch (error) {
      console.error('Get execution details API error:', error);
      throw error;
    }
  }
};
