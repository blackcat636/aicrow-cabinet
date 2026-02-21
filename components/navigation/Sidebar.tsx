'use client';

import React from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavigation } from './SidebarNavigation';

interface SidebarProps {
  currentPath?: string;
  className?: string;
  showHeader?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  className = '',
  showHeader = true,
}) => {
  return (
    <aside className={`flex flex-col h-full w-[240px] bg-[var(--color-secondary-2)] border-r border-[var(--color-secondary-4)] relative z-10 ${className}`}>
      {showHeader && (
        <div className="border-b border-[var(--color-secondary-4)]">
          <SidebarHeader />
        </div>
      )}

      {/* Navigation Menu */}
      <SidebarNavigation currentPath={currentPath} />
    </aside>
  );
};
