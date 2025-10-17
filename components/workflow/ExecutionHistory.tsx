'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowExecution } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { Badge } from '@/components/ui/badge';
import { 
  ClockIcon, 
  CheckIcon, 
  XIcon, 
  PlayIcon,
  RefreshIcon
} from '@/components/icons';

export const ExecutionHistory: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getMyExecutions();
      const executionsArray = Array.isArray(data) ? data : ((data as any)?.executions || (data as any)?.data || []);
      setExecutions(executionsArray);
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
      case 'completed':
        return 'bg-green-600 text-white';
      case 'failed':
        return 'bg-red-600 text-white';
      case 'running':
        return 'bg-purple-600 text-white';
      case 'pending':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon className="w-4 h-4" />;
      case 'failed':
        return <XIcon className="w-4 h-4" />;
      case 'running':
        return <PlayIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
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
          <RefreshIcon className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Execution History</h2>
          <p className="text-gray-300 mt-1">
            Track all workflow executions and their results
          </p>
        </div>
        <button
          onClick={loadExecutions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors shadow-lg shadow-purple-500/25"
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Executions List */}
      {executions.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No executions yet
            </h3>
            <p className="text-gray-300">
              Execute your workflows to see their history here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(execution.status)}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(execution.status)}
                        <span className="capitalize">{execution.status}</span>
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
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>Started: {new Date(execution.startedAt).toLocaleString()}</span>
                    </div>
                    {execution.completedAt && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>Completed: {new Date(execution.completedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Data */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Input Data:</h4>
                <div className="p-3 bg-gray-700 rounded text-sm font-mono text-gray-300 break-all">
                  {execution.inputData}
                </div>
              </div>

              {/* Result or Error */}
              {execution.result && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Result:</h4>
                  <div className="p-3 bg-green-900/20 rounded text-sm font-mono text-green-300 break-all">
                    {execution.result}
                  </div>
                </div>
              )}

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
                  <span>Created: {new Date(execution.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {executions.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {executions.length}
              </div>
              <div className="text-sm text-gray-300">Total Executions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {executions.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-300">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {executions.filter(e => e.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-300">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {executions.filter(e => e.status === 'running' || e.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-300">In Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
