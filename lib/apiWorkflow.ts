import {
  Workflow,
  UserWorkflow,
  WorkflowSchedule,
  WorkflowExecution,
  ExecutionsResponse,
  GetExecutionsParams,
  AttachWorkflowRequest,
  CreateScheduleRequest,
  ExecuteWorkflowRequest,
  WorkflowRequirements,
  AvailableChainsResponse,
  ChainExecutionRequest,
  ChainExecutionResponse,
  ChainHistoryData,
  SocialNetwork,
  AvailableSocialAccounts
} from '@/types/workflow';
import { buildApiUrl } from '@/config/api';
import { fetchWithAuth } from './auth';

type UserWorkflowUpdatePayload = Partial<
  Pick<
    AttachWorkflowRequest,
    'credentialData' | 'inputDataTemplate' | 'name' | 'description'
  >
>;

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseWorkflowList(data: unknown): Workflow[] {
  if (Array.isArray(data)) {
    return data as Workflow[];
  }
  if (!isRecord(data)) {
    return [];
  }
  if (Array.isArray(data.workflows)) {
    return data.workflows as Workflow[];
  }
  if (Array.isArray(data.data)) {
    return data.data as Workflow[];
  }
  return [];
}

function parseUserWorkflowList(data: unknown): UserWorkflow[] {
  if (Array.isArray(data)) {
    return data as UserWorkflow[];
  }
  if (!isRecord(data)) {
    return [];
  }
  if (Array.isArray(data.userWorkflows)) {
    return data.userWorkflows as UserWorkflow[];
  }
  if (Array.isArray(data.data)) {
    return data.data as UserWorkflow[];
  }
  return [];
}

function parseUserWorkflowEntity(data: unknown): UserWorkflow {
  if (!isRecord(data)) {
    throw new Error('User workflow not found');
  }
  if (isRecord(data.userWorkflow)) {
    return data.userWorkflow as unknown as UserWorkflow;
  }
  if (isRecord(data.data)) {
    return data.data as unknown as UserWorkflow;
  }
  throw new Error('User workflow not found');
}

function parseUserWorkflowMutation(data: unknown): UserWorkflow {
  if (!isRecord(data)) {
    throw new Error('Invalid user workflow response');
  }
  return (data.userWorkflow ?? data) as UserWorkflow;
}

function parseUserWorkflowToggle(data: unknown, requestId: number): UserWorkflow {
  if (!isRecord(data)) {
    return { id: requestId } as UserWorkflow;
  }
  const uw = (data.userWorkflow ?? data.data ?? data) as UserWorkflow;
  if (!uw.id && requestId) {
    return { ...uw, id: requestId };
  }
  return uw;
}

function parseSchedulesList(data: unknown): WorkflowSchedule[] {
  if (Array.isArray(data)) {
    return data as WorkflowSchedule[];
  }
  if (isRecord(data) && Array.isArray(data.schedules)) {
    return data.schedules as WorkflowSchedule[];
  }
  return [];
}

function parseScheduleMutation(data: unknown): WorkflowSchedule {
  if (!isRecord(data)) {
    throw new Error('Invalid schedule response');
  }
  return (data.schedule ?? data) as WorkflowSchedule;
}

function parseExecutionsList(
  data: unknown,
  params?: GetExecutionsParams
): ExecutionsResponse {
  const empty: ExecutionsResponse = {
    items: [],
    total: 0,
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    totalPages: 0
  };
  if (!isRecord(data)) {
    return empty;
  }
  if (data.data !== undefined && data.data !== null) {
    return data.data as ExecutionsResponse;
  }
  if (Array.isArray(data.items)) {
    return data as unknown as ExecutionsResponse;
  }
  return empty;
}

/** POST execute / similar: body.execution or whole body */
function parseWorkflowExecutionMutation(data: unknown): WorkflowExecution {
  if (!isRecord(data)) {
    return data as WorkflowExecution;
  }
  return (data.execution ?? data) as WorkflowExecution;
}

/** GET execution detail: nested execution or data envelope */
function parseWorkflowExecutionDetail(data: unknown, fallbackId: number): WorkflowExecution {
  let candidate: unknown = data;
  if (isRecord(data)) {
    if (data.execution !== undefined) {
      candidate = data.execution;
    } else if (isRecord(data.data)) {
      const inner = data.data;
      candidate =
        inner.execution !== undefined ? inner.execution : inner;
    } else {
      candidate = data;
    }
  }
  if (!isRecord(candidate)) {
    return { id: fallbackId } as WorkflowExecution;
  }
  if (typeof candidate.id !== 'number' && fallbackId !== undefined) {
    return { ...candidate, id: fallbackId } as unknown as WorkflowExecution;
  }
  return candidate as unknown as WorkflowExecution;
}

function parseRequirementsEnvelope(data: unknown): WorkflowRequirements {
  if (!isRecord(data)) {
    return data as WorkflowRequirements;
  }
  return (data.data ?? data) as WorkflowRequirements;
}

function parseAvailableChainsEnvelope(data: unknown): AvailableChainsResponse {
  if (!isRecord(data)) {
    return data as AvailableChainsResponse;
  }
  return (data.data ?? data) as AvailableChainsResponse;
}

function parseDataOrSelf(data: unknown): unknown {
  if (isRecord(data) && data.data !== undefined && data.data !== null) {
    return data.data;
  }
  return data;
}

function parseChainExecutionResponse(data: unknown): ChainExecutionResponse {
  const body = parseDataOrSelf(data);
  return body as ChainExecutionResponse;
}

function parseWorkflowExecutionFromDataField(data: unknown): WorkflowExecution {
  return parseDataOrSelf(data) as WorkflowExecution;
}

function parseChainHistoryEnvelope(data: unknown): ChainHistoryData {
  const body = parseDataOrSelf(data);
  return body as ChainHistoryData;
}

function parseSocialNetworksList(data: unknown): SocialNetwork[] {
  if (Array.isArray(data)) {
    return data as SocialNetwork[];
  }
  if (!isRecord(data)) {
    return [];
  }
  if (Array.isArray(data.data)) {
    return data.data as SocialNetwork[];
  }
  if (Array.isArray(data.socialNetworks)) {
    return data.socialNetworks as SocialNetwork[];
  }
  return [];
}

function parseSocialAccountsPayload(data: unknown): AvailableSocialAccounts | null {
  if (!isRecord(data)) {
    if (
      data !== null &&
      typeof data === 'object' &&
      !Array.isArray(data)
    ) {
      return data as AvailableSocialAccounts;
    }
    return null;
  }
  if (data.data !== undefined) {
    return data.data as AvailableSocialAccounts | null;
  }
  if (data.socialAccounts !== undefined) {
    return data.socialAccounts as AvailableSocialAccounts | null;
  }
  return data as AvailableSocialAccounts;
}

function readErrorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  if (typeof body.message === 'string') {
    return body.message;
  }
  const inner = body.data;
  if (isRecord(inner) && typeof inner.message === 'string') {
    return inner.message;
  }
  const err = body.error;
  if (isRecord(err) && typeof err.message === 'string') {
    return err.message;
  }
  if (typeof body.error === 'string') {
    return body.error;
  }
  return undefined;
}

// API Functions
export const workflowApi = {
  // Workflows
  getAvailableWorkflows: async (): Promise<Workflow[]> => {
    try {
      const url = buildApiUrl('/automations/user/workflows');

      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      const data = await readJson(response);
      return parseWorkflowList(data);
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

      const data = await readJson(response);
      return parseUserWorkflowList(data);
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

      const data = await readJson(response);
      return parseUserWorkflowEntity(data);
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

      const result = await readJson(response);
      return parseUserWorkflowMutation(result);
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
      const apiData: UserWorkflowUpdatePayload = {};
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

      const result = await readJson(response);
      return parseUserWorkflowMutation(result);
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

      const result = await readJson(response);
      return parseUserWorkflowToggle(result, id);
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

      const data = await readJson(response);
      return parseSchedulesList(data);
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

      const result = await readJson(response);
      return parseScheduleMutation(result);
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

      const result = await readJson(response);
      return parseScheduleMutation(result);
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
          const errorData = await readJson(response);
          const nestedData = isRecord(errorData) ? errorData.data : undefined;
          if (
            response.status === 400 &&
            isRecord(nestedData) &&
            Array.isArray(nestedData.errors)
          ) {
            errorMessage = JSON.stringify({ errors: nestedData.errors });
          } else {
            errorMessage =
              readErrorMessage(errorData) ?? errorMessage;
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

      const result = await readJson(response);
      return parseWorkflowExecutionMutation(result);
    } catch (error) {
      throw error;
    }
  },

  getMyExecutions: async (
    params?: GetExecutionsParams
  ): Promise<ExecutionsResponse> => {
    try {
      let url = buildApiUrl('/automations/user/executions');

      // Build query parameters
      if (params) {
        const queryParams = new URLSearchParams();

        if (params.userWorkflowId !== undefined) {
          queryParams.append('userWorkflowId', params.userWorkflowId.toString());
        }
        if (params.status) {
          queryParams.append('status', params.status);
        }
        if (params.triggerType) {
          queryParams.append('triggerType', params.triggerType);
        }
        if (params.page !== undefined) {
          queryParams.append('page', params.page.toString());
        }
        if (params.limit !== undefined) {
          queryParams.append('limit', params.limit.toString());
        }

        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      if (response.status === 304) {
        return {
          items: [],
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalPages: 0
        };
      }

      const data = await readJson(response);
      return parseExecutionsList(data, params);
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

      const result = await readJson(response);
      return parseWorkflowExecutionDetail(result, id);
    } catch (error) {
      throw error;
    }
  },

  getWorkflowRequirements: async (
    workflowId: number
  ): Promise<WorkflowRequirements> => {
    try {
      const url = buildApiUrl(`/automations/user/workflows/${workflowId}/requirements`);
      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await readJson(response);
          errorMessage = readErrorMessage(errorData) ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await readJson(response);
      return parseRequirementsEnvelope(result);
    } catch (error) {
      throw error;
    }
  },

  getChainFormFields: async (
    executionId: number,
    targetUserWorkflowId: number
  ): Promise<WorkflowRequirements> => {
    try {
      const url = buildApiUrl(
        `/automations/user/executions/${executionId}/chain-form/${targetUserWorkflowId}`
      );
      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await readJson(response);
          errorMessage = readErrorMessage(errorData) ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await readJson(response);
      return parseRequirementsEnvelope(result);
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
          const errorData = await readJson(response);
          errorMessage = readErrorMessage(errorData) ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await readJson(response);
      return parseAvailableChainsEnvelope(result);
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
          const errorData = await readJson(response);
          errorMessage = readErrorMessage(errorData) ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await readJson(response);
      return parseChainExecutionResponse(result);
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
          const errorData = await readJson(response);
          errorMessage = readErrorMessage(errorData) ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await readJson(response);
      return parseWorkflowExecutionFromDataField(result);
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
          const errorData = await readJson(response);
          errorMessage = readErrorMessage(errorData) ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await readJson(response);
      return parseChainHistoryEnvelope(result);
    } catch (error) {
      throw error;
    }
  },

  // Social Networks
  getSocialNetworks: async (): Promise<SocialNetwork[]> => {
    try {
      const url = buildApiUrl('/automations/user/social-networks');
      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await readJson(response);
          errorMessage = readErrorMessage(errorData) ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await readJson(response);
      return parseSocialNetworksList(result);
    } catch (error) {
      throw error;
    }
  },

  getSocialAccounts: async (): Promise<AvailableSocialAccounts | null> => {
    try {
      const url = buildApiUrl('/automations/user/social-accounts');
      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      if (!response.ok) {
        // For 404 or similar errors (accounts not connected), return null instead of throwing
        // This allows the workflow to continue without social accounts
        if (response.status === 404 || response.status === 400) {
          return null;
        }
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await readJson(response);
          errorMessage = readErrorMessage(errorData) ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await readJson(response);
      return parseSocialAccountsPayload(result);
    } catch (error) {
      // If it's a known error about missing accounts, return null instead of throwing
      if (error instanceof Error && error.message.includes('profile not found')) {
        return null;
      }
      throw error;
    }
  }
};
