'use client';

import React from 'react';
import Image from 'next/image';
import { Link as I18nLink } from '@/i18n/routing';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcherMenu } from '@/components/LanguageSwitcherMenu';
import { useAuth } from '@/contexts/AuthContext';
import aiPillsLogo from '@/public/brand/aiPillsLogo.png';

interface SidebarHeaderProps {
  className?: string;
}

const getInitials = (firstName?: string, lastName?: string, username?: string) => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (username) {
    const parts = username.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  }
  return 'A';
};

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  className = '',
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const userInitials = authLoading ? '…' : getInitials(user?.firstName, user?.lastName, user?.username);

  return (
    <div className={`flex items-center justify-between px-4 py-4 ${className}`}>
      {/* Logo and App Name */}
      <I18nLink href="/" className="flex items-center gap-3 hover:opacity-90">
        <Image 
          src={aiPillsLogo} 
          alt="AI Pills logo" 
          className="h-auto w-10" 
          priority 
        />
        <h1 className="text-xl font-semibold text-white">AI Pills</h1>
      </I18nLink>

      {/* Right Side: Language, Avatar */}
      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <div className="hidden md:block">
          <LanguageSwitcherMenu variant="desktop" />
        </div>

        {/* User Avatar */}
        <Avatar className="w-10 h-10 cursor-pointer">
          <AvatarImage 
            src={user?.photo || undefined} 
            alt={authLoading ? '' : (user?.username || 'User')} 
          />
          <AvatarFallback className={authLoading ? 'bg-[var(--color-secondary-3)] animate-pulse' : 'bg-purple-600 text-white'}>
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};
