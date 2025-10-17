// Workflow Management Types

export interface Workflow {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWorkflow {
  id: number;
  userId: number;
  workflowId: number;
  workflow: Workflow;
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
  userWorkflowId: number;
  triggerType: TriggerType;
  inputData: string;
  status: ExecutionStatus;
  result?: string;
  errorMessage?: string;
  notificationSent: boolean;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
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
  inputData: string;
}

export interface TelegramCommand {
  command: string;
  description: string;
  example?: string;
}
