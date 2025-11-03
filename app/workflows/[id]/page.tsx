'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserWorkflow, WorkflowExecution, ExecutionsResponse } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeftIcon,
  PlayIcon,
  ClockIcon,
  CheckIcon, 
  XIcon,
  CalendarIcon,
  SettingsIcon,
  PauseIcon,
  TrashIcon
} from '@/components/icons';
import { toast } from 'sonner';
import { WorkflowForm } from '@/components/workflow/WorkflowForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const runtime = 'edge';

// Execution Card component with mouse tracking
const ExecutionCard: React.FC<{
  execution: WorkflowExecution;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusLabel: (status: string) => string;
  getTriggerTypeLabel: (triggerType: string) => string;
}> = ({ execution, getStatusColor, getStatusIcon, getStatusLabel, getTriggerTypeLabel }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for interactive background on card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
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

  return (
    <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden shadow-lg shadow-purple-500/30">
      <div 
        ref={cardRef}
        className="relative bg-black rounded-lg p-4 hover:shadow-md transition-shadow h-full w-full overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Interactive gradient overlay that follows mouse */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
          style={{
            background: isHovering
              ? `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(165,0,225,0.4), rgba(123,97,255,0.2) 40%, transparent 70%)`
              : 'none'
          }}
        />
        
        {/* Content with relative z-index */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary" 
                className={getStatusColor(execution.status)}
              >
                <div className="flex items-center gap-1">
                  {getStatusIcon(execution.status)}
                  <span>{getStatusLabel(execution.status)}</span>
                </div>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getTriggerTypeLabel(execution.triggerType)}
              </Badge>
              {execution.notificationSent && (
                <Badge variant="outline" className="text-xs bg-green-600 text-white">
                  Notified
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {new Date(execution.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Input Data */}
          {execution.inputData && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">Input Data:</h4>
              <div className="p-2 bg-gray-700 rounded text-xs font-mono text-gray-300 break-all">
                {execution.inputData}
              </div>
            </div>
          )}

          {/* Output Data */}
          {execution.outputData && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">Output Data:</h4>
              <div className="p-2 bg-green-900/20 rounded text-xs font-mono text-green-300 break-all">
                {execution.outputData}
              </div>
            </div>
          )}

          {/* Error Message */}
          {execution.errorMessage && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">Error:</h4>
              <div className="p-2 bg-red-900/20 rounded text-xs font-mono text-red-300 break-all">
                {execution.errorMessage}
              </div>
            </div>
          )}

          {/* Execution Details */}
          <div className="pt-3 border-t border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Execution ID: {execution.id}</span>
              <span>N8N ID: {execution.n8nExecutionId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [workflow, setWorkflow] = useState<UserWorkflow | null>(null);
  const [executions, setExecutions] = useState<ExecutionsResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [executionsLoading, setExecutionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [toggling, setToggling] = useState(false);
  
  // Mouse tracking for Workflow Information card
  const [workflowInfoMousePosition, setWorkflowInfoMousePosition] = useState({ x: 0, y: 0 });
  const [isWorkflowInfoHovering, setIsWorkflowInfoHovering] = useState(false);
  const workflowInfoRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for Input Data Template card
  const [inputTemplateMousePosition, setInputTemplateMousePosition] = useState({ x: 0, y: 0 });
  const [isInputTemplateHovering, setIsInputTemplateHovering] = useState(false);
  const inputTemplateRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for "No executions" card
  const [noExecutionsMousePosition, setNoExecutionsMousePosition] = useState({ x: 0, y: 0 });
  const [isNoExecutionsHovering, setIsNoExecutionsHovering] = useState(false);
  const noExecutionsRef = useRef<HTMLDivElement>(null);

  const workflowId = params?.id ? parseInt(params.id as string) : null;

  // Mouse tracking handlers for Workflow Information card
  const handleWorkflowInfoMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setWorkflowInfoMousePosition({ x, y });
  }, []);

  const handleWorkflowInfoMouseEnter = useCallback(() => {
    setIsWorkflowInfoHovering(true);
  }, []);

  const handleWorkflowInfoMouseLeave = useCallback(() => {
    setIsWorkflowInfoHovering(false);
  }, []);

  // Mouse tracking handlers for Input Data Template card
  const handleInputTemplateMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setInputTemplateMousePosition({ x, y });
  }, []);

  const handleInputTemplateMouseEnter = useCallback(() => {
    setIsInputTemplateHovering(true);
  }, []);

  const handleInputTemplateMouseLeave = useCallback(() => {
    setIsInputTemplateHovering(false);
  }, []);

  // Mouse tracking handlers for "No executions" card
  const handleNoExecutionsMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNoExecutionsMousePosition({ x, y });
  }, []);

  const handleNoExecutionsMouseEnter = useCallback(() => {
    setIsNoExecutionsHovering(true);
  }, []);

  const handleNoExecutionsMouseLeave = useCallback(() => {
    setIsNoExecutionsHovering(false);
  }, []);

  useEffect(() => {
    if (workflowId && isAuthenticated) {
      loadWorkflow();
      loadExecutions();
    }
  }, [workflowId, isAuthenticated]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      const workflows = await workflowApi.getMyWorkflows();
      const foundWorkflow = workflows.find(w => w.id === workflowId);
      
      if (!foundWorkflow) {
        setError('Workflow not found');
        return;
      }
      
      setWorkflow(foundWorkflow);
    } catch (err) {
      setError('Failed to load workflow');
      console.error('Error loading workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      setExecutionsLoading(true);
      const data = await workflowApi.getMyExecutions();
      // Filter executions for this specific workflow
      const filteredExecutions = {
        ...data,
        items: data.items.filter(execution => execution.userWorkflowId === workflowId)
      };
      setExecutions(filteredExecutions);
    } catch (err) {
      console.error('Error loading executions:', err);
    } finally {
      setExecutionsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!workflow) return;
    
    try {
      setExecuting(true);
      
      if (!workflow.isActive) {
        toast.error('Cannot execute inactive workflow. Please activate the workflow first.');
        return;
      }

      const inputData = workflow.inputDataTemplate || '{"message": "Hello", "timestamp": "' + new Date().toISOString() + '"}';
      
      await workflowApi.executeWorkflowManually(workflow.id, {
        inputData: inputData
      });
      
      toast.success('Workflow executed successfully!');
      // Reload executions to show the new one
      await loadExecutions();
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      
      if (error.message && error.message.includes('Workflow is not active')) {
        toast.error('Cannot execute inactive workflow. Please activate the workflow first.');
      } else if (error.message && error.message.includes('No active webhook found')) {
        toast.error('No active webhook found for this workflow. Please check your webhook configuration in the workflow settings.');
      } else if (error.message && error.message.includes('404')) {
        toast.error('Workflow endpoint not found. Please check your webhook URL configuration.');
      } else {
        toast.error(error.message || 'Failed to execute workflow');
      }
    } finally {
      setExecuting(false);
    }
  };

  const handleToggle = async () => {
    if (!workflow) return;
    
    try {
      setToggling(true);
      const updated = await workflowApi.toggleUserWorkflow(workflow.id);
      setWorkflow(updated);
      toast.success(`Workflow ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling workflow:', error);
      toast.error(error.message || 'Failed to toggle workflow');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!workflow) return;
    
    try {
      await workflowApi.deleteUserWorkflow(workflow.id);
      toast.success('Workflow deleted successfully');
      router.push('/workflows');
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      toast.error(error.message || 'Failed to delete workflow');
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    loadWorkflow();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '1': return 'bg-green-600 text-white';
      case '2': return 'bg-red-600 text-white';
      case '3': return 'bg-purple-600 text-white';
      case '0': return 'bg-yellow-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '1': return <CheckIcon className="w-4 h-4" />;
      case '2': return <XIcon className="w-4 h-4" />;
      case '3': return <PlayIcon className="w-4 h-4" />;
      case '0': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '1': return 'Completed';
      case '2': return 'Failed';
      case '3': return 'Running';
      case '0': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'manual': return 'Manual';
      case 'cron': return 'Scheduled';
      case 'scheduled': return 'One-time';
      case 'telegram': return 'Telegram';
      default: return type;
    }
  };

  const getCredentialTypeLabel = (type: string) => {
    switch (type) {
      case 'telegram': return 'Telegram';
      case 'email': return 'Email';
      case 'webhook': return 'Webhook';
      default: return type;
    }
  };

  const getCredentialData = () => {
    if (!workflow) return '';
    switch (workflow.credentialType) {
      case 'telegram':
        return `Chat ID: ${workflow.credentialData.chatId || 'Not set'}`;
      case 'email':
        return `Email: ${workflow.credentialData.email || 'Not set'}`;
      case 'webhook':
        return `URL: ${workflow.credentialData.webhookUrl || 'Not set'}`;
      default:
        return 'No credentials';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <AppLayout>
        <div className="h-full bg-gray-900">
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-white mb-4">Workflow Not Found</h1>
              <p className="text-gray-300 mb-6">{error || 'The requested workflow could not be found.'}</p>
              <button
                onClick={() => router.push('/workflows')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors mx-auto"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back to Workflows
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Skeleton loader for workflow detail page
  const DetailSkeleton = () => (
    <div className="h-full">
      <div className="max-w-6xl mx-auto p-6 min-h-[600px]">
        <div className="rounded-lg border border-gray-700 bg-[#141519]">
          {/* Header skeleton */}
          <div className="p-6 min-h-[120px]">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-28 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 w-64 bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-5 w-96 bg-gray-700 rounded animate-pulse"></div>
          </div>
          {/* Content skeleton */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {[1, 2].map((i) => (
                <div key={i} className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
                  <div className="bg-black rounded-lg p-6 h-64 animate-pulse">
                    <div className="h-6 w-48 bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-700 rounded"></div>
                      <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
                      <div className="h-4 w-5/6 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <DetailSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full">
        <div className="max-w-6xl mx-auto p-6 min-h-[600px]">
          <div className="rounded-lg border border-gray-700 bg-[#141519]">
            {/* Header - fixed height to prevent layout shift */}
            <div className="p-6 min-h-[120px]">
              {/* Top row with Back button and action buttons */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push('/workflows')}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Back
                  </button>
                  <Badge 
                    variant={workflow.isActive ? "default" : "secondary"}
                    className={workflow.isActive ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}
                  >
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecute}
                    disabled={executing || !workflow.isActive}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      executing 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : !workflow.isActive
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'text-white shadow-lg shadow-[#A500E1]/25 bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] hover:brightness-110'
                    }`}
                  >
                    {executing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        Executing...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        Execute
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleToggle}
                    disabled={toggling}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      toggling
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : workflow.isActive
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    title={workflow.isActive ? 'Deactivate workflow' : 'Activate workflow'}
                  >
                    {toggling ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : workflow.isActive ? (
                      <>
                        <PauseIcon className="w-4 h-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    title="Edit workflow"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    title="Delete workflow"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Title and description */}
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-white break-words break-all mb-2">
                  {workflow.name || workflow.workflow.name || 'Unnamed Workflow'}
                </h1>
                {workflow.description || workflow.workflow?.description ? (
                  <p className="text-gray-300 text-lg break-words break-all">
                    {workflow.description || workflow.workflow.description}
                  </p>
                ) : (
                  <p className="text-gray-400 italic text-lg">No description</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Workflow Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Basic Info */}
                <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden shadow-lg shadow-purple-500/30">
                  <div 
                    ref={workflowInfoRef}
                    className="relative bg-black rounded-lg p-6 h-full w-full overflow-hidden group"
                    onMouseMove={handleWorkflowInfoMouseMove}
                    onMouseEnter={handleWorkflowInfoMouseEnter}
                    onMouseLeave={handleWorkflowInfoMouseLeave}
                  >
                    {/* Interactive gradient overlay that follows mouse */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
                      style={{
                        background: isWorkflowInfoHovering
                          ? `radial-gradient(500px circle at ${workflowInfoMousePosition.x}px ${workflowInfoMousePosition.y}px, rgba(165,0,225,0.4), rgba(123,97,255,0.2) 40%, transparent 70%)`
                          : 'none'
                      }}
                    />
                    
                    {/* Content with relative z-index */}
                    <div className="relative z-10">
                      <h2 className="text-xl font-semibold text-white mb-4">Workflow Information</h2>
                      <div className="space-y-3">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <Badge variant="outline" className="ml-2 text-xs border-gray-600 text-gray-300">
                          {getCredentialTypeLabel(workflow.credentialType)}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-400">Price:</span>
                        {workflow.workflow?.priceUsd ? (
                          <Badge variant="outline" className="ml-2 text-xs border-green-600 text-green-300 bg-green-900/20">
                            ${workflow.workflow.priceUsd}
                          </Badge>
                        ) : (
                          <span className="ml-2 text-gray-300 text-sm">N/A</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400">Credentials:</span>
                        <span className="ml-2 text-gray-300 text-sm">{getCredentialData()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Created:</span>
                        <span className="ml-2 text-gray-300">{new Date(workflow.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Last Updated:</span>
                        <span className="ml-2 text-gray-300">{new Date(workflow.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Input Data Template */}
                <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden shadow-lg shadow-purple-500/30">
                  <div 
                    ref={inputTemplateRef}
                    className="relative bg-black rounded-lg p-6 h-full w-full overflow-hidden group"
                    onMouseMove={handleInputTemplateMouseMove}
                    onMouseEnter={handleInputTemplateMouseEnter}
                    onMouseLeave={handleInputTemplateMouseLeave}
                  >
                    {/* Interactive gradient overlay that follows mouse */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
                      style={{
                        background: isInputTemplateHovering
                          ? `radial-gradient(500px circle at ${inputTemplateMousePosition.x}px ${inputTemplateMousePosition.y}px, rgba(165,0,225,0.4), rgba(123,97,255,0.2) 40%, transparent 70%)`
                          : 'none'
                      }}
                    />
                    
                    {/* Content with relative z-index */}
                    <div className="relative z-10">
                      <h2 className="text-xl font-semibold text-white mb-4">Input Data Template</h2>
                      {workflow.inputDataTemplate ? (
                        <div className="p-3 bg-gray-700 rounded text-sm font-mono text-gray-300 break-all">
                          {workflow.inputDataTemplate}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No input data template configured</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Executions */}
              <div>
                <div className="flex items-center justify-between mb-6 ml-6 mr-6">
                  <h2 className="text-xl font-semibold text-white">Execution History</h2>
                  <div className="text-sm text-gray-400">
                    {executions.total} total executions
                  </div>
                </div>

                {executionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : executions.items.length === 0 ? (
                  <div className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden shadow-lg shadow-purple-500/30">
                    <div 
                      ref={noExecutionsRef}
                      className="relative bg-black rounded-lg p-10 text-center h-full w-full overflow-hidden group"
                      onMouseMove={handleNoExecutionsMouseMove}
                      onMouseEnter={handleNoExecutionsMouseEnter}
                      onMouseLeave={handleNoExecutionsMouseLeave}
                    >
                      {/* Interactive gradient overlay that follows mouse */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
                        style={{
                          background: isNoExecutionsHovering
                            ? `radial-gradient(500px circle at ${noExecutionsMousePosition.x}px ${noExecutionsMousePosition.y}px, rgba(165,0,225,0.4), rgba(123,97,255,0.2) 40%, transparent 70%)`
                            : 'none'
                        }}
                      />
                      
                      {/* Content with relative z-index */}
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                          <PlayIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No executions yet</h3>
                        <p className="text-gray-300 mb-0">
                          This workflow hasn't been executed yet. Click the Execute button to run it.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {executions.items.map((execution) => (
                      <ExecutionCard
                        key={execution.id}
                        execution={execution}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        getStatusLabel={getStatusLabel}
                        getTriggerTypeLabel={getTriggerTypeLabel}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <WorkflowForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={handleEditSuccess}
        editingWorkflow={workflow}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message={`Are you sure you want to delete the workflow "${workflow.name || workflow.workflow.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </AppLayout>
  );
}
