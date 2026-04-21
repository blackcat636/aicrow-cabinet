export interface Workflow {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  priceUsd: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWorkflow {
  id: number;
  userId: number;
  workflowId: number;
  workflow: Workflow;
  name?: string;
  description?: string;
  credentialType: CredentialType;
  credentialData: CredentialData;
  inputDataTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schedules?: WorkflowSchedule[];
  recentExecutions?: WorkflowExecution[];
  totalExecutions?: number;
}

export interface WorkflowSchedule {
  id: number;
  userWorkflowId: number;
  scheduleType: ScheduleType;
  cronExpression?: string;
  scheduledAt?: string;
  isActive: boolean;
  nextExecutionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: number;
  workflowId?: number;
  userWorkflowId?: number;
  n8nExecutionId?: string;
  status: string;
  triggerType: TriggerType;
  inputData?: string | Record<string, unknown> | null;
  outputData?: string | null;
  resultData?: unknown;
  notificationSent: boolean;
  errorMessage?: string | null;
  priceUsd: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  parentExecutionId?: number;
  isChainExecution?: boolean;
  chainId?: number;
}

export type CredentialType = 'telegram' | 'email' | 'webhook';

export type ScheduleType = 'cron' | 'once' | 'manual';

export type TriggerType = 'manual' | 'cron' | 'scheduled' | 'telegram';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CredentialData {
  chatId?: string;
  email?: string;
  webhookUrl?: string;
}

export interface AttachWorkflowRequest {
  workflowId: number;
  name?: string;
  description?: string;
  credentialType: CredentialType;
  credentialData: CredentialData;
  inputDataTemplate: string;
}

export interface CreateScheduleRequest {
  scheduleType: ScheduleType;
  cronExpression?: string;
  scheduledAt?: string;
}

export interface ExecuteWorkflowRequest {
  inputData?: string;
  payload?: Record<string, unknown>;
  prompt?: string;
}

export interface EnumOption {
  label: string;
  value: string | number;
}

export interface UserField {
  key: string;
  label: string;
  /** Populated by requirements / chain-form API for pre-filled UI */
  value?: unknown;
  prefilled?: boolean;
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'email'
    | 'url'
    | 'array'
    | 'object'
    | 'enum'
    | 'radio';
  required?: boolean;
  description?: string;
  hint?: string;
  placeholder?: string;
  defaultValue?: unknown;
  itemType?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  minItems?: number;
  maxItems?: number;
  default?: unknown;
  enum?: Array<string | number | boolean | null>;
  options?: EnumOption[];
  fields?: UserField[];
  hidden?: boolean;
}

export interface WorkflowRequirements {
  workflowId?: number;
  workflowName?: string;
  /** Nested workflow metadata from requirements API */
  workflow?: {
    id?: number;
    name?: string;
    description?: string;
    allowedSocialNetworks?: string[];
  };
  /** Allowed networks at root level (alternate API shape) */
  allowedSocialNetworks?: string[];
  userFields?: UserField[];
  fields?: UserField[];
  formFields?: UserField[];
  schema?: unknown;
  existingValues?: Record<string, unknown>;
  sampleTemplate?: string;
  version?: number;
  defaultDataMapping?: Record<string, string>;
  transformedData?: Record<string, unknown>;
  sourceExecutionId?: number;
  targetUserWorkflowId?: number;
  targetWorkflow?: {
    id: number;
    name: string;
    description?: string;
  };
  availableSocialAccounts?: AvailableSocialAccounts | null;
}

export interface ExecutionsResponse {
  items: WorkflowExecution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetExecutionsParams {
  userWorkflowId?: number;
  status?: string;
  triggerType?: string;
  page?: number;
  limit?: number;
}

export interface TelegramCommand {
  command: string;
  description: string;
  example?: string;
}

export interface ChainableWorkflowsConfig {
  allowedTargets?: number[];
  defaultDataMapping?: Record<string, string>;
}

export interface AvailableChain {
  userWorkflowId: number;
  workflowId: number;
  workflowName: string;
  workflowDescription?: string;
  isAttached: boolean;
  defaultDataMapping?: Record<string, string> | null;
}

export interface AvailableChainsResponse {
  executionId: number;
  sourceWorkflow: {
    id: number;
    name: string;
  };
  availableChains: AvailableChain[];
  requiresAttachment: boolean;
  canChainToAny: boolean;
  message?: string;
}

export interface ChainExecutionRequest {
  targetUserWorkflowId: number;
  dataMapping?: Record<string, string>;
  additionalData?: Record<string, unknown>;
  userText?: string;
}

export interface ChainExecutionResponse {
  chain: {
    id: number;
    parentExecutionId: number;
    childExecutionId: number;
  };
  execution: WorkflowExecution;
}

export interface ChainHistoryData {
  execution: WorkflowExecution;
  parent: WorkflowExecution | null;
  children: WorkflowExecution[];
}

export interface SocialNetwork {
  value: string;
  label: string;
}

export interface SocialAccount {
  username: string;
  display_name: string;
  social_images: string | null;
  handle?: string;
  reauth_required?: boolean;
}

export interface AvailableSocialAccounts {
  [key: string]: SocialAccount; // e.g., "instagram", "tiktok"
}
