'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { workflowApi } from '@/lib/apiWorkflow';
import { AvailableChain, ChainExecutionRequest, WorkflowRequirements, UserField } from '@/types/workflow';
import { XIcon } from '@/components/icons';
import { DataMappingEditor } from './DataMappingEditor';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InfoIcon } from '@/components/ui/InfoIcon';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';

interface ChainToWorkflowModalProps {
  isOpen: boolean;
  executionId: number;
  availableChains: AvailableChain[];
  onClose: () => void;
  onSuccess: (newExecutionId: number) => void;
}

export const ChainToWorkflowModal: React.FC<ChainToWorkflowModalProps> = ({
  isOpen,
  executionId,
  availableChains,
  onClose,
  onSuccess
}) => {
  const t = useTranslations('executions');
  const tCommon = useTranslations('common');
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [allowEditPrefilled, setAllowEditPrefilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetRequirements, setTargetRequirements] = useState<WorkflowRequirements | null>(null);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Whitelist of fields to show - empty means show all non-hidden fields
  const FIELD_WHITELIST: string[] = [];

  const selectedChain = availableChains.find(c => c.userWorkflowId === selectedWorkflow);

  // Load requirements for target workflow when selected
  useEffect(() => {
    if (selectedChain?.userWorkflowId && isOpen) {
      loadTargetRequirements();
    } else {
      setTargetRequirements(null);
      setFormData({});
      setErrors({});
    }
  }, [selectedChain?.userWorkflowId, isOpen]);

  const loadTargetRequirements = async () => {
    if (!selectedChain?.userWorkflowId) return;
    
    try {
      setLoadingRequirements(true);
      // Use chain-form endpoint with executionId and targetUserWorkflowId
      const requirements = await workflowApi.getChainFormFields(
        executionId,
        selectedChain.userWorkflowId
      );
      setTargetRequirements(requirements);
      
      // Initialize form data with values from API (formFields contains fields with values)
      const fields = requirements?.formFields || requirements?.fields || requirements?.userFields || [];
      const initialData: Record<string, any> = {};
      
      const setDefaults = (fieldList: UserField[], prefix = '') => {
        fieldList.forEach(field => {
          // Skip hidden fields
          if (field.hidden === true) {
            return;
          }
          
          // Skip fields not in whitelist (if whitelist is not empty)
          if (FIELD_WHITELIST.length > 0 && !FIELD_WHITELIST.includes(field.key)) {
            return;
          }
          
          const fullKey = prefix ? `${prefix}.${field.key}` : field.key;
          
          // Use value from field if available (from chain-form API)
          // This is the main source of data - value contains pre-filled data
          const fieldValue = (field as any).value;
          
          // Set value if it exists (not null/undefined) and is not empty
          // formFields values have priority over transformedData
          if (fieldValue !== undefined && fieldValue !== null) {
            // Check if value is not empty (for strings, arrays, etc.)
            const isEmpty = 
              (typeof fieldValue === 'string' && fieldValue === '') ||
              (Array.isArray(fieldValue) && fieldValue.length === 0);
            
            if (!isEmpty) {
              // Handle array values (even if type is string but value is array)
              if (Array.isArray(fieldValue)) {
                initialData[fullKey] = fieldValue;
              } else if (field.type === 'enum' && field.options && field.options.length > 0) {
                const optionByValue = field.options.find(opt => String(opt.value) === String(fieldValue));
                if (optionByValue) {
                  initialData[fullKey] = optionByValue.value;
                } else {
                  initialData[fullKey] = fieldValue;
                }
              } else {
                initialData[fullKey] = fieldValue;
              }
            }
          }
          
          // Fallback to transformedData if value was not set from formFields
          if (initialData[fullKey] === undefined && requirements?.transformedData?.[field.key] !== undefined) {
            initialData[fullKey] = requirements.transformedData[field.key];
          }
          
          // Fallback to defaultValue/default if value was not set
          if (initialData[fullKey] === undefined) {
            const defaultValue = field.defaultValue !== undefined ? field.defaultValue : field.default;
            if (defaultValue !== undefined && defaultValue !== null) {
              if (field.type === 'enum' && field.options && field.options.length > 0) {
                const optionByValue = field.options.find(opt => String(opt.value) === String(defaultValue));
                if (optionByValue) {
                  initialData[fullKey] = optionByValue.value;
                } else {
                  initialData[fullKey] = defaultValue;
                }
              } else {
                initialData[fullKey] = defaultValue;
              }
            } else if (field.type === 'enum' && field.required && field.options && field.options.length > 0) {
              initialData[fullKey] = field.options[0].value;
            } else if (field.type === 'array') {
              initialData[fullKey] = [];
            } else if (field.type === 'object' && field.fields) {
              initialData[fullKey] = {};
              setDefaults(field.fields, fullKey);
            }
          }
        });
      };
      
      setDefaults(fields);
      setFormData(initialData);
    } catch (err: any) {
      // Silently handle error - requirements may not be available
      console.debug('Could not load chain form fields:', err.message);
      setTargetRequirements(null);
    } finally {
      setLoadingRequirements(false);
    }
  };

  const handleFieldChange = (key: string, value: any, parentKey?: string) => {
    if (parentKey) {
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...(prev[parentKey] || {}),
          [key]: value
        }
      }));
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
      if (errors[key]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const fields = targetRequirements?.formFields || targetRequirements?.fields || targetRequirements?.userFields || [];
    if (!targetRequirements || fields.length === 0) {
      return true;
    }

    const newErrors: Record<string, string> = {};

    const validateFields = (fieldList: UserField[], prefix = '') => {
      fieldList.forEach(field => {
        // Skip hidden fields
        if (field.hidden === true) {
          return;
        }
        
        // Skip fields not in whitelist (if whitelist is not empty)
        if (FIELD_WHITELIST.length > 0 && !FIELD_WHITELIST.includes(field.key)) {
          return;
        }
        const fullKey = prefix ? `${prefix}.${field.key}` : field.key;
        const value = prefix ? (formData[prefix]?.[field.key]) : formData[field.key];

        let isEmpty = false;
        if (field.type === 'boolean') {
          isEmpty = value === undefined || value === null;
        } else if (field.type === 'array') {
          // For array fields, check if it's undefined/null or empty array with minItems requirement
          if (value === undefined || value === null) {
            isEmpty = true;
          } else if (Array.isArray(value)) {
            // Check minItems requirement
            if (field.minItems !== undefined && value.length < field.minItems) {
              isEmpty = true;
            } else if (value.length === 0 && field.required) {
              isEmpty = true;
            }
          } else {
            isEmpty = true;
          }
        } else {
          isEmpty = value === undefined || value === null || value === '';
        }

        if (field.required && isEmpty) {
          newErrors[fullKey] = t('fieldRequired', { field: field.label }) || `${field.label} is required`;
          return;
        }

        // Check minItems for arrays even if not required
        if (field.type === 'array' && field.minItems !== undefined && !isEmpty) {
          if (Array.isArray(value) && value.length < field.minItems) {
            newErrors[fullKey] = t('chainModal.fieldRequiresAtLeast', { field: field.label, count: field.minItems }) || `${field.label} requires at least ${field.minItems} items`;
            return;
          }
        }

        // Check maxItems for arrays
        if (field.type === 'array' && field.maxItems !== undefined) {
          if (Array.isArray(value) && value.length > field.maxItems) {
            newErrors[fullKey] = t('chainModal.fieldMustHaveAtMost', { field: field.label, count: field.maxItems }) || `${field.label} must have at most ${field.maxItems} items`;
            return;
          }
        }

        if (field.type === 'object' && field.fields) {
          validateFields(field.fields, fullKey);
        }
      });
    };

    validateFields(fields);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format field label to readable format
  const formatFieldLabel = (label: string, key: string): string => {
    // If label is the same as key or looks like a system name (contains underscores),
    // format it to be more readable
    if (label === key || label.includes('_')) {
      return label
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return label;
  };

  // Build data array from formFields with values for display
  const buildFormFieldsData = (): Array<{ label: string; value: any }> => {
    const fields = targetRequirements?.formFields || [];
    const data: Array<{ label: string; value: any }> = [];
    
    fields.forEach(field => {
      const fieldValue = (field as any).value;
      if (fieldValue !== undefined && fieldValue !== null) {
        const isEmpty = 
          (typeof fieldValue === 'string' && fieldValue === '') ||
          (Array.isArray(fieldValue) && fieldValue.length === 0);
        
        if (!isEmpty) {
          // Format value for display
          let displayValue: any = fieldValue;
          if (field.type === 'enum' && field.options) {
            const option = field.options.find(opt => String(opt.value) === String(fieldValue));
            displayValue = option ? option.label : fieldValue;
          }
          
          data.push({
            label: formatFieldLabel(field.label || field.key, field.key),
            value: displayValue
          });
        }
      }
    });
    
    return data;
  };

  const renderField = (field: UserField, parentKey?: string) => {
    // Skip hidden fields
    if (field.hidden === true) {
      return null;
    }

    // Only show fields in whitelist (if whitelist is not empty)
    if (FIELD_WHITELIST.length > 0 && !FIELD_WHITELIST.includes(field.key)) {
      return null;
    }
    
    // Check if field value is an array (even if type is string)
    const fieldValue = (field as any).value;
    const isArrayValue = Array.isArray(fieldValue);
    
    // Check if field should be treated as array based on defaultValue or type
    const shouldBeArray = isArrayValue || 
      (field.defaultValue !== undefined && Array.isArray(field.defaultValue)) ||
      field.type === 'array';
    
    // Check if field has a value from formFields - skip rendering as editable field
    const hasValueFromFormFields = fieldValue !== undefined && fieldValue !== null && 
      !((typeof fieldValue === 'string' && fieldValue === '') || 
        (Array.isArray(fieldValue) && fieldValue.length === 0));
    
    // Skip rendering fields with values from formFields if editing is not allowed
    // (they will be shown in info block)
    if (hasValueFromFormFields && !allowEditPrefilled) {
      return null;
    }

    const fullKey = parentKey ? `${parentKey}.${field.key}` : field.key;
    const value = parentKey ? (formData[parentKey]?.[field.key]) : formData[field.key];
    const error = errors[fullKey];
    const hasError = !!error;

    switch (field.type) {
      case 'string':
      case 'email':
      case 'url':
        // If value is an array or should be treated as array, render as array field
        if (shouldBeArray || Array.isArray(value)) {
          const arrayValue = Array.isArray(value) ? value : (isArrayValue ? fieldValue : []);
          return (
            <div key={field.key} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                {field.label}
                {field.required && <span className="text-red-400">*</span>}
                {field.description && (
                  <InfoIcon description={field.description} />
                )}
              </label>
              <div className="space-y-2">
                {arrayValue.map((item: any, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item || ''}
                      onChange={(e) => {
                        const newArray = [...arrayValue];
                        newArray[index] = e.target.value;
                        handleFieldChange(field.key, newArray, parentKey);
                      }}
                      className={`flex-1 px-4 py-2.5 bg-[#1a1b1f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        hasError
                          ? 'border-red-500 focus:ring-red-500/50'
                          : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
                      }`}
                      placeholder={t('chainModal.itemNumber', { number: index + 1 }) || `Item ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newArray = arrayValue.filter((_: any, i: number) => i !== index);
                        handleFieldChange(field.key, newArray, parentKey);
                      }}
                      className="px-4 py-2.5 bg-red-600/20 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                    >
                      {t('chainModal.remove') || 'Remove'}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange(field.key, [...arrayValue, ''], parentKey);
                  }}
                  className="px-4 py-2.5 bg-purple-600/20 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all text-sm"
                >
                  {t('chainModal.addItem') || 'Add Item'}
                </button>
              </div>
              {hasError && <p className="text-xs text-red-400">{error}</p>}
            </div>
          );
        }
        
        // Regular string input
        return (
          <div key={field.key} className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
              {field.description && (
                <InfoIcon description={field.description} />
              )}
            </label>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value, parentKey)}
              className={`w-full px-4 py-2.5 bg-[#1a1b1f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                hasError
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
              }`}
              placeholder={field.placeholder || field.hint || ''}
            />
            {hasError && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
              {field.description && (
                <InfoIcon description={field.description} />
              )}
            </label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : '', parentKey)}
              className={`w-full px-4 py-2.5 bg-[#1a1b1f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                hasError
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
              }`}
              placeholder={field.placeholder || field.hint || ''}
            />
            {hasError && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </span>
              {field.description && (
                <InfoIcon description={field.description} />
              )}
              <Switch
                checked={value || false}
                onCheckedChange={(checked) => handleFieldChange(field.key, checked, parentKey)}
              />
            </div>
            {hasError && <p className="text-xs text-red-400 ml-14">{error}</p>}
          </div>
        );

      case 'enum':
        const enumOptions = field.options || (field.enum ? field.enum.map(v => ({ label: String(v), value: v })) : []);
        return (
          <div key={field.key} className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
              {field.description && (
                <InfoIcon description={field.description} />
              )}
            </label>
            <div className="relative">
              <select
                value={value !== undefined && value !== null ? String(value) : ''}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  if (selectedValue === '') {
                    handleFieldChange(field.key, null, parentKey);
                  } else {
                    const option = enumOptions.find(opt => String(opt.value) === selectedValue);
                    handleFieldChange(field.key, option ? option.value : selectedValue, parentKey);
                  }
                }}
                className={`w-full pl-4 pr-12 py-2.5 bg-[#1a1b1f] border rounded-lg text-white focus:outline-none focus:ring-2 transition-all appearance-none ${
                  hasError
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
                }`}
                style={{ paddingRight: '3.5rem' }}
              >
                <option value="">{tCommon('select') || 'Select...'}</option>
                {enumOptions.map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {hasError && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );

      case 'array': {
        const isSimpleArrayDropdown =
          field.options && field.options.length > 0 && field.itemType === 'string';

        // Special case: backend sends "array" with options as a simple dropdown
        if (isSimpleArrayDropdown) {
          const enumOptions = field.options!;
          const currentValue =
            typeof value === 'string'
              ? value
              : Array.isArray(value) && value.length > 0
              ? value[0]
              : '';

          return (
            <div key={field.key} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                {field.label}
                {field.required && <span className="text-red-400">*</span>}
                {field.description && (
                  <InfoIcon description={field.description} />
                )}
              </label>
              <div className="relative">
                <select
                  value={currentValue !== undefined && currentValue !== null ? String(currentValue) : ''}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected === '') {
                      handleFieldChange(field.key, '', parentKey);
                    } else {
                      const option = enumOptions.find((opt) => String(opt.value) === selected);
                      handleFieldChange(field.key, option ? option.value : selected, parentKey);
                    }
                  }}
                  className={`w-full pl-4 pr-12 py-2.5 bg-[#1a1b1f] border rounded-lg text-white focus:outline-none focus:ring-2 transition-all appearance-none ${
                    hasError
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
                  }`}
                  style={{ paddingRight: '3.5rem' }}
                >
                  <option value="">{tCommon('select') || 'Select...'}</option>
                  {enumOptions.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {hasError && <p className="text-xs text-red-400">{error}</p>}
            </div>
          );
        }

        // Regular array input (without options)
        const arrayValue = Array.isArray(value) ? value : [];
        const canAddMore = field.maxItems === undefined || arrayValue.length < field.maxItems;
        const canRemove = field.minItems === undefined || arrayValue.length > field.minItems;
        
        // Check if array has enum itemType (array of enum values)
        // itemType can't be 'enum', but if field has options and itemType is 'string', treat it as enum array
        const isEnumArray = field.options && field.options.length > 0 && field.itemType === 'string';
        const enumOptions = isEnumArray ? (field.options || []) : [];
        
        const handleArrayItemAdd = () => {
          if (!canAddMore) return; // Don't add if maxItems reached
          const currentArray = Array.isArray(value) ? [...value] : [];
          // For enum arrays, add first option value, otherwise empty string
          const newItem = isEnumArray && enumOptions.length > 0 ? enumOptions[0].value : '';
          handleFieldChange(field.key, [...currentArray, newItem], parentKey);
        };

        const handleArrayItemChange = (index: number, newValue: any) => {
          const currentArray = Array.isArray(value) ? [...value] : [];
          currentArray[index] = newValue;
          handleFieldChange(field.key, currentArray, parentKey);
        };

        const handleArrayItemRemove = (index: number) => {
          if (!canRemove) return; // Don't remove if minItems reached
          const currentArray = Array.isArray(value) ? [...value] : [];
          currentArray.splice(index, 1);
          handleFieldChange(field.key, currentArray, parentKey);
        };

        return (
          <div key={field.key} className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
              {field.minItems !== undefined && field.maxItems !== undefined && (
                <span className="text-gray-400 text-xs font-normal">
                  ({field.minItems}-{field.maxItems} {t('chainModal.items') || 'items'})
                </span>
              )}
              {field.description && (
                <InfoIcon description={field.description} />
              )}
            </label>
            <div className="space-y-2">
              {arrayValue.map((item, index) => (
                <div key={index} className="flex gap-2">
                  {isEnumArray ? (
                    <div className="relative flex-1">
                      <select
                        value={item !== undefined && item !== null ? String(item) : ''}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          if (selectedValue === '') {
                            handleArrayItemChange(index, '');
                          } else {
                            const option = enumOptions.find(opt => String(opt.value) === selectedValue);
                            handleArrayItemChange(index, option ? option.value : selectedValue);
                          }
                        }}
                        className={`w-full pl-4 pr-12 py-2.5 bg-[#1a1b1f] border rounded-lg text-white focus:outline-none focus:ring-2 transition-all appearance-none ${
                          hasError
                            ? 'border-red-500 focus:ring-red-500/50'
                            : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
                        }`}
                        style={{ paddingRight: '3.5rem' }}
                      >
                        <option value="">{tCommon('select') || 'Select...'}</option>
                        {enumOptions.map((option) => (
                          <option key={String(option.value)} value={String(option.value)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <input
                      type={field.itemType === 'number' ? 'number' : 'text'}
                      value={item || ''}
                      onChange={(e) => {
                        const newValue =
                          field.itemType === 'number' ? Number(e.target.value) : e.target.value;
                        handleArrayItemChange(index, newValue);
                      }}
                      className={`flex-1 px-4 py-2.5 bg-[#1a1b1f] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        hasError
                          ? 'border-red-500 focus:ring-red-500/50'
                          : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/50'
                      }`}
                      placeholder={t('chainModal.itemNumber', { number: index + 1 }) || `Item ${index + 1}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleArrayItemRemove(index)}
                    disabled={!canRemove}
                    className="px-4 py-2.5 bg-red-600/20 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {canAddMore && (
                <button
                  type="button"
                  onClick={handleArrayItemAdd}
                  className="px-4 py-2.5 bg-purple-600/20 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all text-sm"
                >
                  {t('chainModal.addItem') || 'Add Item'}
                </button>
              )}
              {!canAddMore && field.maxItems !== undefined && (
                <p className="text-xs text-gray-400">
                  {t('chainModal.maxItemsAllowed', { count: field.maxItems }) || `Maximum ${field.maxItems} item(s) allowed`}
                </p>
              )}
            </div>
            {hasError && <p className="text-xs text-red-400">{error}</p>}
          </div>
        );
      }

      case 'object':
        return null;

      default:
        return null;
    }
  };

  // On Esc show confirmation instead of closing immediately
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedWorkflow) {
      setError(t('chainModal.selectWorkflowRequired'));
      return;
    }

    // Validate form if requirements are loaded
    if (targetRequirements && !validateForm()) {
      setError(t('chainModal.fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build payload from form data
      // Use formFields from chain-form endpoint, fallback to fields/userFields
      const fields = targetRequirements?.formFields || targetRequirements?.fields || targetRequirements?.userFields || [];
      const formPayload: Record<string, any> = {};
      
      const buildPayload = (fieldList: UserField[], parentKey?: string) => {
        fieldList.forEach(field => {
          // Skip hidden fields
          if (field.hidden === true) {
            return;
          }

          const value = parentKey ? (formData[parentKey]?.[field.key]) : formData[field.key];
          const isInWhitelist = FIELD_WHITELIST.length === 0 || FIELD_WHITELIST.includes(field.key);
          
          if (field.type === 'object' && field.fields) {
            return;
          } else {
            // Determine if field should be included in payload
            let shouldInclude = false;
            let valueToSend: any = value;
            
            // Include fields if whitelist is empty (show all) or field is in whitelist
            if (isInWhitelist) {
              // For arrays (including string fields with array values), include if:
              // 1. It's required (even if empty, backend will validate)
              // 2. It has values (not empty array)
              // 3. It has minItems requirement (even if empty, backend will validate)
              if (field.type === 'array' || Array.isArray(value)) {
                if (field.required || (field.minItems !== undefined && field.minItems > 0)) {
                  // Always include required arrays or arrays with minItems
                  shouldInclude = true;
                } else if (Array.isArray(value) && value.length > 0) {
                  // Include non-empty arrays
                  shouldInclude = true;
                }
              } else if (value !== undefined && value !== null && value !== '') {
                // For other types, include if not empty
                shouldInclude = true;
              } else if (field.required) {
                // Include required fields even if empty (backend will validate)
                shouldInclude = true;
              }
            }
            // Skip all fields NOT in whitelist (if whitelist is not empty)
            
            if (shouldInclude) {
              // For enum fields with options, convert value to label if needed
              if (field.type === 'enum' && field.options && field.options.length > 0 && isInWhitelist) {
                const selectedOption = field.options.find(opt => String(opt.value) === String(valueToSend));
                if (selectedOption) {
                  valueToSend = selectedOption.label;
                }
              }
              
              if (parentKey) {
                if (!formPayload[parentKey]) formPayload[parentKey] = {};
                formPayload[parentKey][field.key] = valueToSend;
              } else {
                formPayload[field.key] = valueToSend;
              }
            }
          }
        });
      };
      
      if (fields.length > 0) {
        buildPayload(fields);
      }

      const request: ChainExecutionRequest = {
        targetUserWorkflowId: selectedWorkflow,
        additionalData: Object.keys(formPayload).length > 0 ? formPayload : undefined
      };

      const data = await workflowApi.chainExecution(executionId, request);

      if (data.execution) {
        onSuccess(data.execution.id);
        onClose();
      } else {
        setError(t('chainModal.chainError'));
      }
    } catch (err: any) {
      // Parse error response to show detailed validation errors
      let errorMessage = err.message || t('chainModal.networkError');
      
      if (err.data) {
        const errorData = err.data;
        if (errorData.data?.errors && Array.isArray(errorData.data.errors)) {
          errorMessage = errorData.data.errors.join(', ');
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
        onClick={(e) => {
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
                {t('chainModal.title')}
              </h2>
              <button
                onClick={() => setConfirmOpen(true)}
                className="p-2 text-gray-400 hover:text-red-400 transition-all rounded-full hover:bg-red-900/20 hover:scale-110"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form Container */}
            <div className="flex flex-col flex-1 min-h-0 bg-[#141519]">
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Workflow Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('chainModal.selectTargetWorkflow')}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWorkflow || ''}
                      onChange={(e) => {
                        setSelectedWorkflow(Number(e.target.value));
                      }}
                      className="w-full pl-4 pr-12 py-2.5 border rounded-lg bg-gray-800/50 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all border-gray-600 hover:border-gray-500 appearance-none"
                      style={{ paddingRight: '3.5rem' }}
                    >
                      <option value="">-- {t('chainModal.selectTargetWorkflow')} --</option>
                      {availableChains.map(chain => (
                        <option key={chain.userWorkflowId} value={chain.userWorkflowId}>
                          {chain.workflowName}
                          {chain.workflowDescription && ` - ${chain.workflowDescription}`}
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pre-filled Data from formFields */}
                {(() => {
                  const formFieldsData = buildFormFieldsData();
                  return formFieldsData.length > 0 ? (
                    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-300">{t('chainModal.prefilledData') || 'Pre-filled Data'}</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowEditPrefilled}
                            onChange={(e) => setAllowEditPrefilled(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-xs text-gray-400">{t('chainModal.allowEditPrefilled') || 'Allow editing'}</span>
                        </label>
                      </div>
                      {!allowEditPrefilled && (
                        <div className="space-y-3">
                          {formFieldsData.map((item, index) => (
                            <div key={index} className="space-y-1">
                              <div className="text-xs font-medium text-gray-400">{item.label}</div>
                              {Array.isArray(item.value) ? (
                                <div className="space-y-1">
                                  {item.value.map((val: any, idx: number) => (
                                    <div key={idx} className="text-sm text-gray-300 break-words whitespace-normal">
                                      {String(val)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-300 break-words whitespace-normal">
                                  {String(item.value)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {/* Workflow Form Fields */}
                {loadingRequirements ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-300 text-sm">{t('chainModal.loadingFields') || 'Loading form fields...'}</span>
                  </div>
                ) : targetRequirements && ((targetRequirements.formFields && targetRequirements.formFields.length > 0) || (targetRequirements.fields && targetRequirements.fields.length > 0) || (targetRequirements.userFields && targetRequirements.userFields.length > 0)) ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">{selectedChain?.workflowName}</h3>
                    {(targetRequirements.formFields || targetRequirements.fields || targetRequirements.userFields || []).map(field => renderField(field))}
                  </div>
                ) : null}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Actions - moved outside scrollable area */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700/50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="px-6 py-2.5 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800/50 hover:border-gray-500 transition-all font-medium"
                  disabled={loading}
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !selectedWorkflow}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('chainModal.chaining')}
                    </>
                  ) : (
                    t('chainModal.chain')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onClose();
        }}
        title={t('chainModal.cancelTitle')}
        message={t('chainModal.cancelMessage')}
        confirmText={tCommon('cancel')}
        cancelText={t('chainModal.keepEditing')}
        type="warning"
      />
    </>,
    typeof document !== 'undefined' ? document.body : ({} as any)
  ) as unknown as JSX.Element;
};

