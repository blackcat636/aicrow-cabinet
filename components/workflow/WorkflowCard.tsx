'use client';

import React, { useState } from 'react';
import { UserWorkflow } from '@/types/workflow';
import { Badge } from '@/components/ui/badge';
import { 
  PlayIcon, 
  PauseIcon, 
  SettingsIcon, 
  TrashIcon,
  CalendarIcon,
  EyeIcon
} from '@/components/icons';

interface WorkflowCardProps {
  workflow: UserWorkflow;
  onToggle: (id: number) => void;
  onEdit: (workflow: UserWorkflow) => void;
  onDelete: (id: number, name: string) => void;
  onExecute: (id: number) => void;
  onManageSchedules: (id: number) => void;
  onViewDetails: (id: number) => void;
  isExecuting?: boolean;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onToggle,
  onEdit,
  onDelete,
  onExecute,
  onManageSchedules,
  onViewDetails,
  isExecuting = false
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Trim text helper
  const truncateText = (text: string | null | undefined, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const workflowName = workflow.name || workflow.workflow?.name || '';
  const workflowDescription = workflow.description || workflow.workflow?.description || '';
  
  const maxNameLength = 30;
  const maxDescriptionLength = 100;
  
  const displayName = truncateText(workflowName, maxNameLength);
  const displayDescription = showFullDescription 
    ? workflowDescription 
    : truncateText(workflowDescription, maxDescriptionLength);
  
  const shouldShowMoreButton = workflowDescription ? workflowDescription.length > maxDescriptionLength : false;
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
        <div className="flex-1 min-w-0">
          <h3 
            className="text-lg font-semibold text-white mb-1 break-words"
            title={workflowName && workflowName.length > maxNameLength ? workflowName : undefined}
          >
            {displayName || 'Unnamed Workflow'}
          </h3>
          <div className="text-sm text-gray-300">
            {displayDescription ? (
              <>
                <p className="break-words">{displayDescription}</p>
                {shouldShowMoreButton && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-purple-400 hover:text-purple-300 mt-1 font-medium text-xs transition-colors"
                  >
                    {showFullDescription ? 'Less' : 'More'}
                  </button>
                )}
              </>
            ) : (
              <p className="text-gray-400 italic">No description</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
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
      <div className="space-y-3">
        {/* Primary Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onExecute(workflow.id)}
            disabled={isExecuting || !workflow.isActive}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 w-32 ${
              isExecuting 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : !workflow.isActive
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/25'
            }`}
            title={!workflow.isActive ? 'Activate workflow to execute' : ''}
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span>Executing...</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span>Execute</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => onViewDetails(workflow.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-32"
          >
            <EyeIcon className="w-4 h-4" />
            <span>Details</span>
          </button>
          
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(workflow.id)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
              title={workflow.isActive ? 'Deactivate workflow' : 'Activate workflow'}
            >
              {workflow.isActive ? (
                <PauseIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={() => onEdit(workflow)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
              title="Edit workflow"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onDelete(workflow.id, workflow.name || workflow.workflow.name)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
              title="Delete workflow"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            ID: {workflow.id}
          </div>
        </div>
      </div>

    </div>
  );
};
