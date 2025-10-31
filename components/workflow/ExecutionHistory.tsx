'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowExecution, ExecutionsResponse } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { Badge } from '@/components/ui/badge';
import {
  ClockIcon,
  CheckIcon, 
  XIcon, 
  PlayIcon,
  EyeIcon
} from '@/components/icons';

export const ExecutionHistory: React.FC = () => {
  const router = useRouter();
  const [executionsData, setExecutionsData] = useState<ExecutionsResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getMyExecutions();
      setExecutionsData(data);
    } catch (err) {
      console.error('❌ Error loading executions:', err);
      setError(`Failed to load execution history: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '1': // completed
        return 'bg-green-600 text-white';
      case '2': // failed
        return 'bg-red-600 text-white';
      case '3': // running
        return 'bg-purple-600 text-white';
      case '0': // pending
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '1': // completed
        return <CheckIcon className="w-4 h-4" />;
      case '2': // failed
        return <XIcon className="w-4 h-4" />;
      case '3': // running
        return <PlayIcon className="w-4 h-4" />;
      case '0': // pending
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading execution history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadExecutions}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors mx-auto shadow-lg shadow-purple-500/25"
        >
          <PlayIcon className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executions List */}
      {executionsData.items.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-[#141519]">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">Execution History</h2>
              <p className="text-gray-300 mt-1">View results and logs of your workflow runs</p>
            </div>
          </div>
          <div className="p-6">
            <div className="ml-6 mr-6 p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
              <div className="bg-black rounded-lg p-10 text-center h-full w-full">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                <ClockIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No executions yet</h3>
              <p className="text-gray-300">Execute your workflows to see their history here.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-[#141519]">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">Execution History</h2>
              <p className="text-gray-300 mt-1">View results and logs of your workflow runs</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4 ml-6 mr-6">
              {executionsData.items.map((execution) => (
            <div key={execution.id} className="p-[1px] rounded-lg bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
              <div className="bg-black rounded-lg p-6 hover:shadow-md transition-shadow h-full w-full">
              {/* Single row layout */}
              <div className="flex items-center pb-6 justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
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
                  <div className="flex items-center gap-1 text-sm text-gray-300">
                    <ClockIcon className="w-4 h-4" />
                    <span>Created: {new Date(execution.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/workflows/${execution.userWorkflowId}`)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all font-medium hover:brightness-110 shadow-lg shadow-[#A500E1]/25 bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)]"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>View Workflow</span>
                </button>
              </div>

              {/* Input Data */}
              {execution.inputData && (
                <div className="mb-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Input Data:</h4>
                  <div className="p-3 bg-gray-700 rounded text-sm font-mono text-gray-300 break-all">
                    {execution.inputData}
                  </div>
                </div>
              )}

              {/* Output Data */}
              {execution.outputData && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Output Data:</h4>
                  <div className="p-3 bg-green-900/20 rounded text-sm font-mono text-green-300 break-all">
                    {execution.outputData}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {execution.errorMessage && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Error:</h4>
                  <div className="p-3 bg-red-900/20 rounded text-sm font-mono text-red-300 break-all">
                    {execution.errorMessage}
                  </div>
                </div>
              )}

              {/* Execution ID */}
              <div className="pt-4 border-t border-gray-600">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Execution ID: {execution.id}</span>
                  <span>User Workflow ID: {execution.userWorkflowId}</span>
                </div>
              </div>
            </div>
            </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {executionsData.items.length > 0 && (
        <div className="bg-[#141519] rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {executionsData.total}
              </div>
              <div className="text-sm text-gray-300">Total Executions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {executionsData.items.filter(e => e.status === '1').length}
              </div>
              <div className="text-sm text-gray-300">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {executionsData.items.filter(e => e.status === '2').length}
              </div>
              <div className="text-sm text-gray-300">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {executionsData.items.filter(e => e.status === '3' || e.status === '0').length}
              </div>
              <div className="text-sm text-gray-300">In Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
