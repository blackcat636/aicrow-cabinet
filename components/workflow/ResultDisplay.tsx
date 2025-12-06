'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface ResultData {
  type?: string;
  kind?: string;
  text?: string;
  url?: string;
  title?: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

interface ResultDisplayProps {
  resultData: any;
  className?: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ resultData, className = '' }) => {
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle string results
  if (typeof resultData === 'string') {
    try {
      const parsed = JSON.parse(resultData);
      if (parsed && typeof parsed === 'object') {
        return <ResultDisplay resultData={parsed} className={className} />;
      }
    } catch {
      // Not JSON, just return as text
      return (
        <div className={`p-3 bg-gray-800/50 rounded border border-gray-700/50 ${className}`}>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">{resultData}</pre>
        </div>
      );
    }
  }

  // Handle object results
  if (typeof resultData === 'object' && resultData !== null) {
    const data = resultData as ResultData;
    const type = data.type || data.kind;

    // Text type
    if (type === 'text' && data.text) {
      return (
        <div className={`p-3 bg-gray-800/50 rounded border border-gray-700/50 ${className}`}>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">{data.text}</pre>
        </div>
      );
    }

    // Video type
    if (type === 'video' && data.url) {
      return (
        <div className={`p-3 bg-gray-800/50 rounded border border-gray-700/50 ${className}`}>
          {data.title && (
            <h5 className="text-sm font-medium text-gray-300 mb-2">{data.title}</h5>
          )}
          <div className="w-full max-w-2xl">
            <video
              src={data.url}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: '600px' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline break-all"
            >
              {data.url}
            </a>
          )}
        </div>
      );
    }

    // Image type
    if (type === 'image' && data.url) {
      const isOpen = openImage === data.url;

      return (
        <div className={`p-3 bg-gray-800/50 rounded border border-gray-700/50 ${className}`}>
          {data.title && (
            <h5 className="text-sm font-medium text-gray-300 mb-2">{data.title}</h5>
          )}
          <div className="w-full max-w-sm">
            <button
              type="button"
              onClick={() => setOpenImage(data.url!)}
              className="group relative block w-full overflow-hidden rounded-lg border border-gray-700/60 bg-black"
            >
              <img
                src={data.url}
                alt={data.title || 'Result image'}
                className="w-full max-h-48 object-contain transition-transform duration-200 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-[11px] px-2 py-1 rounded bg-black/70 text-gray-200 border border-white/10">
                  Click to enlarge
                </span>
              </div>
            </button>
          </div>
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline break-all"
            >
              {data.url}
            </a>
          )}

          {isOpen && mounted && (createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setOpenImage(null)}
            >
              <div
                className="relative max-h-[90vh] max-w-[90vw] rounded-lg overflow-hidden bg-black shadow-xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpenImage(null)}
                  className="absolute top-2 right-2 z-10 px-3 py-1 text-xs bg-black/70 text-white rounded border border-white/20 hover:bg-black/90"
                >
                  Close
                </button>
                <img
                  src={data.url}
                  alt={data.title || 'Result image'}
                  className="block max-h-[90vh] max-w-[90vw] object-contain"
                />
              </div>
            </div>,
            document.body
          ) as React.ReactNode)}
        </div>
      );
    }

    // Audio type
    if (type === 'audio' && data.url) {
      return (
        <div className={`p-3 bg-gray-800/50 rounded border border-gray-700/50 ${className}`}>
          {data.title && (
            <h5 className="text-sm font-medium text-gray-300 mb-2">{data.title}</h5>
          )}
          <div className="w-full max-w-2xl">
            <audio src={data.url} controls className="w-full">
              Your browser does not support the audio tag.
            </audio>
          </div>
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline break-all"
            >
              {data.url}
            </a>
          )}
        </div>
      );
    }

    // Resource type with URL (fallback for other types)
    if (data.url) {
      return (
        <div className={`p-3 bg-gray-800/50 rounded border border-gray-700/50 ${className}`}>
          {data.title && (
            <h5 className="text-sm font-medium text-gray-300 mb-2">{data.title}</h5>
          )}
          <div className="space-y-2">
            <div className="text-xs text-gray-400">
              <span className="font-medium">Type:</span> {type || 'unknown'}
            </div>
            {data.kind && (
              <div className="text-xs text-gray-400">
                <span className="font-medium">Kind:</span> {data.kind}
              </div>
            )}
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 underline break-all block"
            >
              {data.url}
            </a>
            {data.meta && Object.keys(data.meta).length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                  Metadata
                </summary>
                <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap break-words">
                  {JSON.stringify(data.meta, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // Fallback: try to extract text or stringify
    const fallbackText =
      (data as any).message ??
      (data as any).result ??
      (data as any).data ??
      data.text ??
      JSON.stringify(data, null, 2);

    return (
      <div className={`p-3 bg-gray-800/50 rounded border border-gray-700/50 ${className}`}>
        <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">{fallbackText}</pre>
      </div>
    );
  }

  // Fallback for other types
  return (
    <div className={`p-3 bg-gray-800/50 rounded border border-gray-700/50 ${className}`}>
      <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
        {String(resultData)}
      </pre>
    </div>
  );
};

