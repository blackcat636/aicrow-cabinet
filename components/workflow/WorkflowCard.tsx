'use client';

import React from 'react';
import { UserWorkflow } from '@/types/workflow';
import { Badge } from '@/components/ui/badge';
import { 
  PlayIcon, 
  PauseIcon, 
  SettingsIcon, 
  TrashIcon,
  CalendarIcon
} from '@/components/icons';

interface WorkflowCardProps {
  workflow: UserWorkflow;
  onToggle: (id: number) => void;
  onEdit: (workflow: UserWorkflow) => void;
  onDelete: (id: number, name: string) => void;
  onExecute: (id: number) => void;
  onManageSchedules: (id: number) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onToggle,
  onEdit,
  onDelete,
  onExecute,
  onManageSchedules
}) => {
  const getCredentialTypeLabel = (type: string) => {
    switch (type) {
      case 'telegram': return 'Telegram';
      case 'email': return 'Email';
      case 'webhook': return 'Webhook';
      default: return type;
    }
  };

  const getCredentialData = () => {
    switch (workflow.credentialType) {
      case 'telegram':
        return `Chat ID: ${workflow.credentialData.chatId}`;
      case 'email':
        return `Email: ${workflow.credentialData.email}`;
      case 'webhook':
        return `URL: ${workflow.credentialData.webhookUrl}`;
      default:
        return 'No credentials';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-5 hover:shadow-md transition-shadow w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {workflow.workflow.name}
          </h3>
          <p className="text-sm text-gray-300">
            {workflow.workflow.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={workflow.isActive ? "default" : "secondary"}
            className={workflow.isActive ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}
          >
            {workflow.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Credentials - Simplified */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
            {getCredentialTypeLabel(workflow.credentialType)}
          </Badge>
          <span className="text-xs text-gray-400">{getCredentialData()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExecute(workflow.id)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
          >
            <PlayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Execute</span>
          </button>
          
          <button
            onClick={() => onManageSchedules(workflow.id)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Schedules</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(workflow.id)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-700"
            title={workflow.isActive ? 'Deactivate' : 'Activate'}
          >
            {workflow.isActive ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={() => onEdit(workflow)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-700"
            title="Edit"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(workflow.id, workflow.workflow.name)}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded hover:bg-red-900/20"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
