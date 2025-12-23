'use client';

import React from 'react';
import { XIcon, TrashIcon, AlertTriangleIcon } from '@/components/icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
    onClose();
  };


  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`p-[1px] rounded-2xl ${
          type === 'danger' 
            ? 'bg-[linear-gradient(90deg,#DC2626_0%,#991B1B_100%)]' 
            : type === 'warning'
            ? 'bg-[linear-gradient(90deg,#D97706_0%,#B45309_100%)]'
            : 'bg-[linear-gradient(90deg,#2563EB_0%,#1E40AF_100%)]'
        } shadow-2xl ${
          type === 'danger' 
            ? 'shadow-red-500/20' 
            : type === 'warning'
            ? 'shadow-yellow-500/20'
            : 'shadow-blue-500/20'
        } max-w-md w-full overflow-hidden`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="bg-[#141519] w-full h-full overflow-hidden" style={{ borderRadius: 'calc(1rem - 1px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                type === 'danger'
                  ? 'bg-red-900/30 border border-red-500/30'
                  : type === 'warning'
                  ? 'bg-yellow-900/30 border border-yellow-500/30'
                  : 'bg-blue-900/30 border border-blue-500/30'
              }`}>
                <AlertTriangleIcon className={`w-6 h-6 ${
                  type === 'danger'
                    ? 'text-red-400'
                    : type === 'warning'
                    ? 'text-yellow-400'
                    : 'text-blue-400'
                }`} />
              </div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-400 transition-all rounded-full hover:bg-red-900/20 hover:scale-110"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 bg-[#141519]">
            <p className="text-gray-300 text-base leading-relaxed mb-6 break-words overflow-wrap-anywhere">
              {message}
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  if (loading) return;
                  onClose();
                }}
                disabled={loading}
                className="px-6 py-2.5 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800/50 hover:border-gray-500 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-6 py-2.5 rounded-lg transition-all font-medium shadow-lg ${
                  type === 'danger'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-500/25 hover:shadow-red-500/40'
                    : type === 'warning'
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white shadow-yellow-500/25 hover:shadow-yellow-500/40'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40'
                } hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading ? '...' : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
