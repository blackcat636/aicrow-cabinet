'use client';

import React, { useState, useEffect } from 'react';
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
  SettingsIcon
} from '@/components/icons';
import { toast } from 'sonner';

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

  const workflowId = params?.id ? parseInt(params.id as string) : null;

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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
        <div className="min-h-screen bg-gray-900">
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

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/workflows')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back to Workflows
            </button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {workflow.name || workflow.workflow.name}
                </h1>
                <p className="text-gray-300 text-lg">
                  {workflow.description || workflow.workflow.description}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant={workflow.isActive ? "default" : "secondary"}
                  className={workflow.isActive ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}
                >
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </Badge>
                
                <button
                  onClick={handleExecute}
                  disabled={executing || !workflow.isActive}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    executing 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : !workflow.isActive
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/25'
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
              </div>
            </div>
          </div>

          {/* Workflow Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Basic Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Workflow Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Type:</span>
                  <Badge variant="outline" className="ml-2 text-xs border-gray-600 text-gray-300">
                    {getCredentialTypeLabel(workflow.credentialType)}
                  </Badge>
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

            {/* Input Data Template */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
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

          {/* Executions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
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
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlayIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No executions yet</h3>
                <p className="text-gray-300 mb-6">
                  This workflow hasn't been executed yet. Click the Execute button to run it.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {executions.items.map((execution) => (
                  <div
                    key={execution.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:shadow-md transition-shadow"
                  >
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
                        <div className="p-2 bg-gray-600 rounded text-xs font-mono text-gray-300 break-all">
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
