// Workflow Management Types

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
  inputData: string;
  outputData?: string | null;
  resultData?: any;
  notificationSent: boolean;
  errorMessage?: string | null;
  priceUsd: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
}

export type CredentialType = 'telegram' | 'email' | 'webhook';

export type ScheduleType = 'cron' | 'once' | 'manual';

export type TriggerType = 'manual' | 'cron' | 'scheduled' | 'telegram';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CredentialData {
  chatId?: string; // for telegram
  email?: string; // for email
  webhookUrl?: string; // for webhook
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
  payload?: Record<string, any>;
  prompt?: string;
}

export interface EnumOption {
  label: string;
  value: string | number;
}

export interface UserField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'array' | 'object' | 'enum';
  required?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  itemType?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  minItems?: number;
  maxItems?: number;
  default?: any;
  enum?: any[];
  options?: EnumOption[];
  fields?: UserField[]; // For object type - nested fields
}

export interface WorkflowRequirements {
  workflowId?: number;
  workflowName?: string;
  userFields?: UserField[];
  fields?: UserField[]; // Alternative field name from API
  schema?: any;
  existingValues?: Record<string, any>;
  sampleTemplate?: string;
  version?: number;
}

export interface ExecutionsResponse {
  items: WorkflowExecution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TelegramCommand {
  command: string;
  description: string;
  example?: string;
}
