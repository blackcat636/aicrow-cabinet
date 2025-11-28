'use client';

import React, { useState } from 'react';

interface InfoIconProps {
  description: string;
  className?: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({ description, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!description) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`text-gray-400 hover:text-purple-400 transition-colors duration-200 cursor-pointer ${className}`}
        aria-label="Information"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg max-w-xs border border-gray-700 pointer-events-none whitespace-normal break-words">
          {description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-gray-800 border-r border-b border-gray-700 transform rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};

