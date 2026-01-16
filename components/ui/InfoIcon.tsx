'use client';

import React, { useState, useRef, useEffect } from 'react';

interface InfoIconProps {
  description: string;
  className?: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({ description, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [isHovered]);

  if (!description) return null;

  return (
    <>
      <div className="relative inline-block">
        <button
          ref={iconRef}
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
      </div>
      {isHovered && (
        <div
          ref={tooltipRef}
          className="fixed z-[99999] px-4 py-3 bg-gray-800 text-white text-sm rounded-lg shadow-2xl min-w-[300px] max-w-[600px] w-auto border border-gray-700 pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px'
          }}
        >
          <div className="whitespace-normal break-words overflow-wrap-anywhere leading-relaxed">
            {description}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-gray-800 border-r border-b border-gray-700 transform rotate-45"></div>
          </div>
        </div>
      )}
    </>
  );
};

