'use client';

import React from 'react';
import { WorkflowSchedule } from '@/types/workflow';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  ClockIcon, 
  TrashIcon,
  SettingsIcon,
  PlayIcon,
  PauseIcon
} from '@/components/icons';

interface ScheduleCardProps {
  schedule: WorkflowSchedule;
  onEdit: (schedule: WorkflowSchedule) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onEdit,
  onDelete,
  onToggle
}) => {
  const getScheduleTypeLabel = (type: string) => {
    switch (type) {
      case 'cron': return 'Recurring (Cron)';
      case 'once': return 'One-time';
      case 'manual': return 'Manual Only';
      default: return type;
    }
  };

  const getScheduleTypeColor = (type: string) => {
    switch (type) {
      case 'cron': return 'bg-blue-100 text-blue-800';
      case 'once': return 'bg-orange-100 text-orange-800';
      case 'manual': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCronExpression = (cron: string) => {
    // Basic cron expression formatting
    const parts = cron.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day, month, weekday] = parts;
      return `${hour}:${minute.padStart(2, '0')} ${day === '*' ? 'every day' : `day ${day}`} ${month === '*' ? 'every month' : `month ${month}`}`;
    }
    return cron;
  };

  const formatNextExecution = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:shadow-lg hover:shadow-purple-500/10 transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-white">
              {getScheduleTypeLabel(schedule.scheduleType)}
            </span>
            <Badge 
              variant="secondary" 
              className={getScheduleTypeColor(schedule.scheduleType)}
            >
              {schedule.scheduleType}
            </Badge>
          </div>
          
          {schedule.scheduleType === 'cron' && schedule.cronExpression && (
            <p className="text-sm text-gray-300 font-mono">
              {formatCronExpression(schedule.cronExpression)}
            </p>
          )}
          
          {schedule.scheduleType === 'once' && schedule.scheduledAt && (
            <p className="text-sm text-gray-300">
              Scheduled for: {new Date(schedule.scheduledAt).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Badge 
            variant={schedule.isActive ? "default" : "secondary"}
            className={schedule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
          >
            {schedule.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Next Execution */}
      {schedule.scheduleType !== 'manual' && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <ClockIcon className="w-4 h-4" />
            <span>Next execution: {formatNextExecution(schedule.nextExecutionAt)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(schedule.id)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={schedule.isActive ? 'Deactivate' : 'Activate'}
          >
            {schedule.isActive ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={() => onEdit(schedule)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Edit Schedule"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onDelete(schedule.id)}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete Schedule"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Timestamps */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Created: {new Date(schedule.createdAt).toLocaleDateString()}</span>
          <span>Updated: {new Date(schedule.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
