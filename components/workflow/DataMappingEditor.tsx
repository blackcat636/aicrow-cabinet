'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface DataMappingEditorProps {
  value: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
}

export const DataMappingEditor: React.FC<DataMappingEditorProps> = ({ value, onChange }) => {
  const t = useTranslations('executions.chainModal');
  const [mappings, setMappings] = useState<Array<{ key: string; value: string }>>(
    Object.entries(value).map(([k, v]) => ({ key: k, value: v }))
  );

  useEffect(() => {
    const currentEntries = Object.entries(value).map(([k, v]) => ({ key: k, value: v }));
    setMappings(currentEntries.length > 0 ? currentEntries : [{ key: '', value: '' }]);
  }, [value]);

  const addMapping = () => {
    setMappings([...mappings, { key: '', value: '' }]);
  };

  const updateMapping = (index: number, field: 'key' | 'value', newValue: string) => {
    const updated = [...mappings];
    updated[index][field] = newValue;
    setMappings(updated);
    
    // Convert to object and notify parent component
    const mappingObj = updated.reduce((acc, item) => {
      if (item.key) {
        acc[item.key] = item.value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    onChange(mappingObj);
  };

  const removeMapping = (index: number) => {
    const updated = mappings.filter((_, i) => i !== index);
    setMappings(updated.length > 0 ? updated : [{ key: '', value: '' }]);
    
    const mappingObj = updated.reduce((acc, item) => {
      if (item.key) {
        acc[item.key] = item.value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    onChange(mappingObj);
  };

  return (
    <div className="data-mapping-editor space-y-3">
      {mappings.map((mapping, index) => (
        <div key={index} className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t('mappingTargetFieldPlaceholder') || 'Target field name (e.g., prompt)'}
            value={mapping.key}
            onChange={(e) => updateMapping(index, 'key', e.target.value)}
            className="flex-1 p-3 border rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all border-gray-600 hover:border-gray-500"
          />
          <span className="text-gray-400 text-xl">→</span>
          <input
            type="text"
            placeholder={t('mappingDataPathPlaceholder') || 'Data path with double curly braces'}
            value={mapping.value}
            onChange={(e) => updateMapping(index, 'value', e.target.value)}
            className="flex-1 p-3 border rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all border-gray-600 hover:border-gray-500"
          />
          <button
            type="button"
            onClick={() => removeMapping(index)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all"
            title={t('removeMapping') || 'Remove mapping'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addMapping}
        className="w-full px-4 py-2 text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-900/20 hover:border-purple-500 transition-all font-medium"
      >
        + {t('addMapping') || 'Add mapping'}
      </button>
      
      {/* Preview */}
      {Object.keys(value).length > 0 && (
        <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <h4 className="text-sm font-medium text-gray-300 mb-2">{t('preview') || 'Preview:'}</h4>
          <pre className="text-xs text-gray-400 overflow-x-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

