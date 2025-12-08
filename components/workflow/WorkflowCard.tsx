'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
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
import { useTranslations } from 'next-intl';

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

// Move helper functions outside component to prevent recreation
const getCredentialTypeLabel = (type: string) => {
  switch (type) {
    case 'telegram': return 'Telegram';
    case 'email': return 'Email';
    case 'webhook': return 'Webhook';
    default: return type;
  }
};

const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const WorkflowCard: React.FC<WorkflowCardProps> = React.memo(({
  workflow,
  onToggle,
  onEdit,
  onDelete,
  onExecute,
  onManageSchedules,
  onViewDetails,
  isExecuting = false
}) => {
  const t = useTranslations('workflow');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for interactive background on card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Memoize computed values
  const workflowName = useMemo(() => workflow.name || workflow.workflow?.name || '', [workflow.name, workflow.workflow?.name]);
  const workflowDescription = useMemo(() => workflow.description || workflow.workflow?.description || '', [workflow.description, workflow.workflow?.description]);
  
  const maxNameLength = 30;
  const maxDescriptionLength = 100;
  
  const displayName = useMemo(() => truncateText(workflowName, maxNameLength), [workflowName]);
  const displayDescription = useMemo(() => 
    showFullDescription 
      ? workflowDescription 
      : truncateText(workflowDescription, maxDescriptionLength),
    [workflowDescription, showFullDescription]
  );
  
  const shouldShowMoreButton = useMemo(() => 
    workflowDescription ? workflowDescription.length > maxDescriptionLength : false,
    [workflowDescription]
  );

  const getCredentialData = useCallback(() => {
    switch (workflow.credentialType) {
      case 'telegram':
        return `Chat ID: ${workflow.credentialData?.chatId || 'Not set'}`;
      case 'email':
        return `Email: ${workflow.credentialData?.email || 'Not set'}`;
      case 'webhook':
        return `URL: ${workflow.credentialData?.webhookUrl || 'Not set'}`;
      default:
        return 'No credentials';
    }
  }, [workflow.credentialType, workflow.credentialData]);

  // Memoize credential type label
  const credentialTypeLabel = useMemo(() => getCredentialTypeLabel(workflow.credentialType), [workflow.credentialType]);
  const credentialDataText = useMemo(() => getCredentialData(), [getCredentialData]);

  return (
    <div 
      className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] w-full h-full overflow-hidden shadow-lg shadow-purple-500/30 flex flex-col"
    >
      <div 
        ref={cardRef}
        className="relative bg-black rounded-lg p-5 hover:shadow-md transition-shadow w-full h-full overflow-hidden group flex flex-col flex-1"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Interactive gradient overlay that follows mouse - more visible */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
          style={{
            background: isHovering
              ? `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(165,0,225,0.4), rgba(123,97,255,0.2) 40%, transparent 70%)`
              : 'none'
          }}
        />
        
        {/* Content with relative z-index */}
        <div className="relative z-10 flex-1 flex flex-col">
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
              <p className="text-gray-400 italic">{t('noDescription')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <Badge 
            variant={workflow.isActive ? "default" : "secondary"}
            className={workflow.isActive ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}
          >
            {workflow.isActive ? t('active') : t('inactive')}
          </Badge>
        </div>
      </div>

      {/* Credentials - Simplified */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
            {credentialTypeLabel}
          </Badge>
          {workflow.workflow?.priceUsd && (
            <Badge variant="outline" className="text-xs border-green-600 text-green-300 bg-green-900/20">
              {workflow.workflow.priceUsd}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {/* Primary Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onExecute(workflow.id)}
            disabled={isExecuting || !workflow.isActive}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 w-32 text-white ${
              isExecuting 
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                : !workflow.isActive
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'hover:brightness-110 shadow-lg'
            }`}
            style={!isExecuting && workflow.isActive ? { background: 'linear-gradient(90deg, #A500E1 0%, #7B61FF 100%)', boxShadow: '0 10px 15px -3px rgba(165,0,225,0.25)' } : undefined}
            title={!workflow.isActive ? (t('activateToExecute') || 'Activate workflow to execute') : ''}
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span>{t('executing')}</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span>{t('execute')}</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => onViewDetails(workflow.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all font-medium w-32 hover:brightness-110 shadow-lg"
            style={{ background: 'linear-gradient(90deg, #7B61FF 0%, #3B82F6 100%)', boxShadow: '0 10px 15px -3px rgba(165,0,225,0.25)' }}
          >
            <EyeIcon className="w-4 h-4" />
            <span>{t('details')}</span>
          </button>
          
        </div>

        {/* Spacer to push secondary actions to bottom */}
        <div className="flex-1"></div>

        {/* Secondary Actions - Fixed at bottom */}
        <div className="flex items-center justify-between pt-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(workflow.id)}
              className="p-2 text-white transition-colors rounded-lg hover:bg-gray-700"
              title={workflow.isActive ? (t('deactivateWorkflow') || 'Deactivate workflow') : (t('activateWorkflow') || 'Activate workflow')}
            >
              {workflow.isActive ? (
                <PauseIcon className="w-4 h-4 text-white" />
              ) : (
                <PlayIcon className="w-4 h-4 text-white" />
              )}
            </button>
            
            <button
              onClick={() => onEdit(workflow)}
              className="p-2 text-white transition-colors rounded-lg hover:bg-gray-700"
              title={t('editWorkflow') || 'Edit workflow'}
            >
              <SettingsIcon className="w-4 h-4" color="#ffffff" />
            </button>
            
            <button
              onClick={() => onDelete(workflow.id, workflow.name || workflow.workflow.name)}
              className="p-2 text-white hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
              title={t('deleteWorkflow') || 'Delete workflow'}
            >
              <TrashIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            ID: {workflow.id}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
});

WorkflowCard.displayName = 'WorkflowCard';
