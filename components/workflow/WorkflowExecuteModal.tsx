'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { workflowApi } from '@/lib/apiWorkflow';
import { WorkflowRequirements, UserField } from '@/types/workflow';
import { XIcon } from '@/components/icons';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface WorkflowExecuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (payload?: Record<string, any>) => Promise<void>;
  workflowId: number; 
  workflowName?: string;
}

export const WorkflowExecuteModal: React.FC<WorkflowExecuteModalProps> = ({
  isOpen,
  onClose,
  onExecute,
  workflowId,
  workflowName
}) => {
  const [requirements, setRequirements] = useState<WorkflowRequirements | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen && workflowId) {
      loadRequirements();
    }
  }, [isOpen, workflowId]);

  // On Esc show confirmation instead of closing immediately
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [isOpen]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      setErrors({});
      const data = await workflowApi.getWorkflowRequirements(workflowId);
      setRequirements(data);
      
      // Get fields array (support both 'fields' and 'userFields' from API)
      const fields = data.fields || data.userFields || [];
      
      // Initialize form data with existing values or defaults
      const initialData: Record<string, any> = {};
      if (data.existingValues) {
        Object.assign(initialData, data.existingValues);
      }
      
      // Helper function to set defaults recursively
      const setDefaults = (fieldList: UserField[], prefix = '') => {
        fieldList.forEach(field => {
          const fullKey = prefix ? `${prefix}.${field.key}` : field.key;
          
          // Use defaultValue or default property
          const defaultValue = field.defaultValue !== undefined ? field.defaultValue : field.default;
          
          if (defaultValue !== undefined && initialData[fullKey] === undefined) {
            // For enum fields, if defaultValue is a label, find the corresponding value
            if (field.type === 'enum' && field.options && field.options.length > 0) {
              // Check if defaultValue matches a label
              const optionByLabel = field.options.find(opt => opt.label === defaultValue);
              if (optionByLabel) {
                initialData[fullKey] = optionByLabel.value;
              } else {
                // Check if defaultValue matches a value
                const optionByValue = field.options.find(opt => String(opt.value) === String(defaultValue));
                if (optionByValue) {
                  initialData[fullKey] = optionByValue.value;
                } else {
                  initialData[fullKey] = defaultValue;
                }
              }
            } else {
              initialData[fullKey] = defaultValue;
            }
          } else if (field.type === 'enum' && field.required && field.options && field.options.length > 0 && initialData[fullKey] === undefined) {
            // For required enum fields without default, set first option as default
            initialData[fullKey] = field.options[0].value;
          } else if (field.type === 'array' && initialData[fullKey] === undefined) {
            initialData[fullKey] = [];
          } else if (field.type === 'object' && field.fields && initialData[fullKey] === undefined) {
            initialData[fullKey] = {};
            setDefaults(field.fields, fullKey);
          }
        });
      };
      
      setDefaults(fields);
      setFormData(initialData);
    } catch (error: any) {
      console.error('Error loading requirements:', error);
      // If requirements endpoint fails, allow execution without fields
      setRequirements(null);
      toast.error('Could not load workflow requirements. You can still execute with default values.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: any, parentKey?: string) => {
    if (parentKey) {
      // Handle nested object field
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...(prev[parentKey] || {}),
          [key]: value
        }
      }));
      // Clear error for nested field
      const errorKey = `${parentKey}.${key}`;
      if (errors[errorKey]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [key]: value
      }));
      // Clear error for this field
      if (errors[key]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    }
  };

  const handleArrayItemAdd = (key: string) => {
    const fields = requirements?.fields || requirements?.userFields || [];
    const field = fields.find(f => f.key === key);
    if (!field || field.type !== 'array') return;
    
    const currentArray = (formData[key] as any[]) || [];
    const newItem = field.itemType === 'number' ? 0 : '';
    handleFieldChange(key, [...currentArray, newItem]);
  };

  const handleArrayItemRemove = (key: string, index: number) => {
    const currentArray = (formData[key] as any[]) || [];
    handleFieldChange(key, currentArray.filter((_, i) => i !== index));
  };

  const handleArrayItemChange = (key: string, index: number, value: any) => {
    const currentArray = (formData[key] as any[]) || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleFieldChange(key, newArray);
  };

  const validateForm = (): boolean => {
    const fields = requirements?.fields || requirements?.userFields || [];
    if (!requirements || fields.length === 0) {
      return true; // No validation needed if no fields
    }

    const newErrors: Record<string, string> = {};

    // Helper function to validate fields recursively
    const validateFields = (fieldList: UserField[], prefix = '') => {
      fieldList.forEach(field => {
        const fullKey = prefix ? `${prefix}.${field.key}` : field.key;
        const value = prefix ? (formData[prefix]?.[field.key]) : formData[field.key];

        // Check if field is empty
        // For enum fields, also check if value is valid (not just empty string)
        let isEmpty = value === undefined || value === null || value === '';
        
        // For enum fields, check if value is in valid options
        if (field.type === 'enum' && !isEmpty && field.options && field.options.length > 0) {
          const validValues = field.options.map(opt => String(opt.value));
          const valueStr = String(value);
          if (!validValues.includes(valueStr)) {
            // Value is not valid, treat as empty for required check
            isEmpty = true;
          }
        }
        
        // Check required fields
        if (field.required && isEmpty) {
          newErrors[fullKey] = `${field.label} is required`;
          return;
        }

        // Skip validation if field is empty and not required
        if (!field.required && isEmpty) {
          // But still validate nested object fields
          if (field.type === 'object' && field.fields) {
            validateFields(field.fields, fullKey);
          }
          return;
        }

        // Validate enum values first (before other validations)
        if (field.type === 'enum') {
          const validValues = field.options 
            ? field.options.map(opt => String(opt.value))
            : (field.enum || []).map(v => String(v));
          if (validValues.length > 0) {
            const valueStr = String(value);
            if (!validValues.includes(valueStr)) {
              newErrors[fullKey] = `${field.label} must be one of: ${validValues.join(', ')}`;
              return;
            }
          }
        } else if (field.enum && field.enum.length > 0) {
          const enumValues = field.enum.map(v => String(v));
          if (!enumValues.includes(String(value))) {
            newErrors[fullKey] = `${field.label} must be one of: ${field.enum.join(', ')}`;
            return;
          }
        }

        // Validate array fields
        if (field.type === 'array') {
          if (!Array.isArray(value)) {
            newErrors[fullKey] = `${field.label} must be an array`;
            return;
          }
          if (field.minItems !== undefined && value.length < field.minItems) {
            newErrors[fullKey] = `${field.label} must have at least ${field.minItems} item(s)`;
            return;
          }
          if (field.maxItems !== undefined && value.length > field.maxItems) {
            newErrors[fullKey] = `${field.label} must have at most ${field.maxItems} item(s)`;
            return;
          }
        }

        // Validate email
        if (field.type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[fullKey] = `${field.label} must be a valid email address`;
            return;
          }
        }

        // Validate URL - allow URLs without protocol, will add https:// automatically
        if (field.type === 'url' && value) {
          try {
            // Try to validate as-is first
            new URL(value);
          } catch {
            // If fails, try adding https://
            try {
              new URL(`https://${value}`);
            } catch {
              newErrors[fullKey] = `${field.label} must be a valid URL`;
              return;
            }
          }
        }

        // Validate number
        if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
          if (isNaN(Number(value))) {
            newErrors[fullKey] = `${field.label} must be a number`;
            return;
          }
        }

        // Skip validation for object fields - they are not displayed
        if (field.type === 'object') {
          return;
        }
      });
    };

    validateFields(fields);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);
      
      // Build payload from form data
      const fields = requirements?.fields || requirements?.userFields || [];
      const payload: Record<string, any> = {};
      
      // Helper function to build payload recursively
      const buildPayload = (fieldList: UserField[], parentKey?: string) => {
        fieldList.forEach(field => {
          const value = parentKey ? (formData[parentKey]?.[field.key]) : formData[field.key];
          
          if (field.type === 'object' && field.fields) {
            // Skip object fields - they are not included in payload
            return;
          } else {
            // Only include fields that have values
            if (value !== undefined && value !== null && value !== '') {
              let valueToSend = value;
              
              // For enum fields with options, send label instead of value
              if (field.type === 'enum' && field.options && field.options.length > 0) {
                const selectedOption = field.options.find(opt => String(opt.value) === String(value));
                if (selectedOption) {
                  valueToSend = selectedOption.label;
                }
              }
              
              // For URL fields, automatically add https:// if protocol is missing
              if (field.type === 'url' && typeof valueToSend === 'string') {
                const urlString = String(valueToSend).trim();
                if (urlString && !urlString.match(/^https?:\/\//i)) {
                  valueToSend = `https://${urlString}`;
                }
              }
              
              if (parentKey) {
                if (!payload[parentKey]) payload[parentKey] = {};
                payload[parentKey][field.key] = valueToSend;
              } else {
                payload[field.key] = valueToSend;
              }
            }
          }
        });
      };
      
      if (fields.length > 0) {
        buildPayload(fields);
      }

      // Ensure prompt is included in payload if it exists in formData
      if (formData.prompt !== undefined && formData.prompt !== null && formData.prompt !== '') {
        payload.prompt = String(formData.prompt);
      }

      await onExecute(Object.keys(payload).length > 0 ? payload : undefined);
      // Only close modal on success
      onClose();
    } catch (error: any) {
      // Error handling is done in parent component
      // Don't close modal on error - let user see the error and try again
      console.error('Error executing workflow:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: UserField, parentKey?: string) => {
    const fullKey = parentKey ? `${parentKey}.${field.key}` : field.key;
    const value = parentKey ? (formData[parentKey]?.[field.key]) : formData[field.key];
    const error = errors[fullKey];
    const hasError = !!error;

    switch (field.type) {
      case 'string':
      case 'email':
      case 'url':
        return (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}
            <input
              type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value, parentKey)}
              className={`w-full px-4 py-2.5 bg-[#1a1b1f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                hasError
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
              }`}
              placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
            />
            {hasError && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : '', parentKey)}
              className={`w-full px-4 py-2.5 bg-[#1a1b1f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                hasError
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
              }`}
              placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
            />
            {hasError && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.key} className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleFieldChange(field.key, e.target.checked, parentKey)}
                className="w-5 h-5 rounded border-gray-600 bg-[#1a1b1f] text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
              />
              <span className="text-sm font-medium text-gray-300">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </span>
            </label>
            {field.description && (
              <p className="text-xs text-gray-400 ml-8">{field.description}</p>
            )}
            {hasError && <p className="text-xs text-red-400 ml-8">{error}</p>}
          </div>
        );

      case 'array':
        const arrayValue = (value as any[]) || [];
        return (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
              {field.minItems !== undefined && field.maxItems !== undefined && (
                <span className="text-gray-400 text-xs font-normal ml-2">
                  ({field.minItems}-{field.maxItems} items)
                </span>
              )}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}
            <div className="space-y-2">
              {arrayValue.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type={field.itemType === 'number' ? 'number' : 'text'}
                    value={item || ''}
                    onChange={(e) => {
                      const newValue = field.itemType === 'number' ? Number(e.target.value) : e.target.value;
                      handleArrayItemChange(field.key, index, newValue);
                    }}
                    className={`flex-1 px-4 py-2.5 bg-[#1a1b1f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      hasError
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
                    }`}
                    placeholder={`Item ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleArrayItemRemove(field.key, index)}
                    className="px-4 py-2.5 bg-red-600/20 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {(!field.maxItems || arrayValue.length < field.maxItems) && (
                <button
                  type="button"
                  onClick={() => handleArrayItemAdd(field.key)}
                  className="px-4 py-2.5 bg-purple-600/20 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all text-sm"
                >
                  + Add Item
                </button>
              )}
            </div>
            {hasError && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'enum':
        const enumOptions = field.options || (field.enum ? field.enum.map(v => ({ label: String(v), value: v })) : []);
        return (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400">{field.description}</p>
            )}
            <select
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) => {
                const selectedValue = e.target.value;
                // Convert to proper type if needed
                const option = enumOptions.find(opt => String(opt.value) === selectedValue);
                handleFieldChange(field.key, option ? option.value : selectedValue, parentKey);
              }}
              className={`w-full px-4 py-2.5 bg-[#1a1b1f] border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                hasError
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
              }`}
            >
              {!field.required && <option value="">-- Select --</option>}
              {enumOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasError && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'object':
        // Skip rendering object fields - they are not needed in the UI
        return null;

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
      onClick={(e) => {
        // Open confirm dialog when clicking on overlay (background)
        if (e.target === e.currentTarget) {
          setConfirmOpen(true);
        }
      }}
    >
      <div
        className="p-[1px] rounded-2xl bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="bg-[#141519] rounded-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/10 to-transparent">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
              Execute Workflow
            </h2>
            <button
              onClick={() => setConfirmOpen(true)}
              className="p-2 text-gray-400 hover:text-red-400 transition-all rounded-full hover:bg-red-900/20 hover:scale-110"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-300">Loading workflow requirements...</span>
              </div>
            ) : requirements && ((requirements.fields && requirements.fields.length > 0) || (requirements.userFields && requirements.userFields.length > 0)) ? (
              <>
                {workflowName && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">{workflowName}</h3>
                  </div>
                )}

                {/* Dynamic fields - prompt will be rendered here if it's in userFields */}
                <div className="space-y-4">
                  {(requirements.fields || requirements.userFields || []).map(field => renderField(field))}
                </div>
              </>
            ) : (
              <>
                {workflowName && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">{workflowName}</h3>
                  </div>
                )}
                <p className="text-sm text-gray-400">
                  This workflow doesn't require additional fields. You can execute it directly.
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700/50 bg-gradient-to-r from-transparent to-purple-900/10">
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="px-6 py-2.5 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800/50 hover:border-gray-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg transition-all font-medium shadow-lg bg-gradient-to-r from-[#A500E1] to-[#7B61FF] text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Executing...
                </>
              ) : (
                'Execute'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onClose();
        }}
        title="Cancel execution?"
        message="Are you sure you want to cancel and discard the entered data?"
        confirmText="Cancel"
        cancelText="Keep editing"
        type="warning"
      />
    </div>,
    document.body
  ) as React.ReactElement;
};

