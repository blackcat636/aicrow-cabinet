import {
  Workflow,
  UserWorkflow,
  WorkflowSchedule,
  WorkflowExecution,
  ExecutionsResponse,
  AttachWorkflowRequest,
  CreateScheduleRequest,
  ExecuteWorkflowRequest,
  WorkflowRequirements,
  AvailableChainsResponse,
  ChainExecutionRequest,
  ChainExecutionResponse,
  ChainHistoryData
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

      if (data.workflows) {
        return data.workflows;
      } else if (data.data) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        return [];
      }
    } catch (error) {
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

      if (data.userWorkflows) {
        return data.userWorkflows;
      } else if (data.data) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        return [];
      }
    } catch (error) {
      throw error;
    }
  },

  getUserWorkflow: async (id: number): Promise<UserWorkflow> => {
    try {
      const url = buildApiUrl(`/automations/user/my-workflows/${id}`);

      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      const data = await response.json();

      if (data.userWorkflow) {
        return data.userWorkflow;
      } else if (data.data) {
        return data.data;
      } else {
        throw new Error('User workflow not found');
      }
    } catch (error) {
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
      throw error;
    }
  },

  updateUserWorkflow: async (
    id: number,
    data: Partial<AttachWorkflowRequest>
  ): Promise<UserWorkflow> => {
    try {
      // Create API data object according to API documentation
      // Fields allowed: credentialData, inputDataTemplate, name, description
      // Exclude workflowId and credentialType - they should not be changed
      const apiData: any = {};
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
      const userWorkflow = result.userWorkflow || result.data || result;

      // Ensure id is present in the response
      if (!userWorkflow.id && id) {
        userWorkflow.id = id;
      }

      return userWorkflow;
    } catch (error) {
      throw error;
    }
  },

  deleteUserWorkflow: async (id: number): Promise<void> => {
    try {
      await fetchWithAuth(buildApiUrl(`/automations/user/my-workflows/${id}`), {
        method: 'DELETE'
      });
    } catch (error) {
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
      throw error;
    }
  },

  deleteSchedule: async (id: number): Promise<void> => {
    try {
      await fetchWithAuth(buildApiUrl(`/automations/user/schedules/${id}`), {
        method: 'DELETE'
      });
    } catch (error) {
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
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          // Handle validation errors (400 status with errors array)
          if (
            response.status === 400 &&
            errorData.data &&
            errorData.data.errors &&
            Array.isArray(errorData.data.errors)
          ) {
            // Return errors in a format that can be parsed by the caller
            errorMessage = JSON.stringify({ errors: errorData.data.errors });
          } else {
            // Try multiple paths for error message
            errorMessage =
              errorData.message ||
              errorData.data?.message ||
              errorData.error?.message ||
              errorData.error ||
              errorMessage;
          }
        } catch (parseError) {
          // If we can't parse the error response, try to get text
          try {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            } else {
              errorMessage = response.statusText || errorMessage;
            }
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.execution || result;
    } catch (error) {
      throw error;
    }
  },

  getMyExecutions: async (userId?: number): Promise<ExecutionsResponse> => {
    try {
      const url = buildApiUrl('/automations/user/executions');

      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      if (response.status === 304) {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        };
      }

      const data = await response.json();

      if (data.data) {
        return data.data;
      } else if (data.items) {
        return data;
      } else {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        };
      }
    } catch (error) {
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
      // API sometimes wraps execution in data / data.execution
      const execution =
        result?.execution || result?.data?.execution || result?.data || result;

      // Ensure the execution has an id for stable keying
      if (!execution?.id && id) {
        execution.id = id;
      }

      return execution;
    } catch (error) {
      throw error;
    }
  },

  getWorkflowRequirements: async (
    workflowId: number
  ): Promise<WorkflowRequirements> => {
    try {
      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/workflows/${workflowId}/requirements`),
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      throw error;
    }
  },

  getChainFormFields: async (
    executionId: number,
    targetUserWorkflowId: number
  ): Promise<WorkflowRequirements> => {
    try {
      const response = await fetchWithAuth(
        buildApiUrl(
          `/automations/user/executions/${executionId}/chain-form/${targetUserWorkflowId}`
        ),
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      throw error;
    }
  },

  // Chainable Workflows
  getAvailableChains: async (
    executionId: number
  ): Promise<AvailableChainsResponse> => {
    try {
      const response = await fetchWithAuth(
        buildApiUrl(
          `/automations/user/executions/${executionId}/available-chains`
        ),
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      throw error;
    }
  },

  chainExecution: async (
    executionId: number,
    request: ChainExecutionRequest
  ): Promise<ChainExecutionResponse> => {
    try {
      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/executions/${executionId}/chain-to`),
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      throw error;
    }
  },

  restartExecution: async (executionId: number): Promise<WorkflowExecution> => {
    try {
      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/executions/${executionId}/restart`),
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      throw error;
    }
  },

  getExecutionChain: async (executionId: number): Promise<ChainHistoryData> => {
    try {
      const response = await fetchWithAuth(
        buildApiUrl(`/automations/user/executions/${executionId}/chain`),
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      throw error;
    }
  }
};
