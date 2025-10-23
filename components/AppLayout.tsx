'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileTextIcon,
  LogOutIcon,
  DashBoardIcon,
  ClockIcon,
  MenuIcon,
  XIcon,
  SettingsIcon,
  ChevronRightIcon,
  WalletIcon
} from '@/components/icons';

interface LayoutProps {
  children: React.ReactNode;
}

const getInitials = (username: string) => {
  if (!username) return 'U';
  return username
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsSubmenuOpen, setIsSettingsSubmenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleOpenSettings = () => {
    setIsSettingsSubmenuOpen(!isSettingsSubmenuOpen);
  };

  // Auto-open settings submenu when on settings pages
  React.useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setIsSettingsSubmenuOpen(true);
    } else {
      setIsSettingsSubmenuOpen(false);
    }
  }, [pathname]);

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'AiPills CRM';
      case '/workflows':
        return 'Workflows';
      case '/executions':
        return 'Executions';
      case '/balance':
        return 'Balance';
      case '/settings/telegram':
        return 'Telegram Settings';
      default:
        return 'AiPills CRM';
    }
  };

  const NavItem: React.FC<{
    href: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick?: () => void;
  }> = ({ href, icon, label, isActive, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isActive
          ? 'bg-purple-600 text-white border-l-4 border-purple-500 shadow-lg shadow-purple-500/25'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white border-gray-600'
      }`}
    >
      {icon}
      <span className='font-medium'>{label}</span>
    </Link>
  );

  return (
    <div className='min-h-screen bg-gray-900'>
      {/* Desktop Layout */}
      <div className='hidden md:flex min-h-screen ml-8'>
        {/* Sidebar */}
        <div className='w-[320px] xl:w-[360px] 2xl:w-[390px] 3xl:w-[420px] 4xl:w-[450px] pt-[40px] bg-gray-800 shadow-sm border-r border-gray-700 flex-shrink-0'>
          <div className='ml-7'>
            {/* User Profile */}
            <div className='text-center mb-6 border rounded-lg border-gray-600 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px] p-5 bg-gray-700'>
              <Avatar className='w-16 h-16 mx-auto mb-3'>
                <AvatarImage src={user?.photo || undefined} />
                <AvatarFallback className='bg-purple-600 text-white text-lg font-semibold'>
                  {getInitials(user?.username || 'User')}
                </AvatarFallback>
              </Avatar>
              <h2 className='text-lg font-semibold text-white'>
                {user?.username || 'User'}
              </h2>
              <Badge variant='secondary' className='bg-purple-600 text-white mt-1'>
                {user?.role || 'User'}
              </Badge>
            </div>

            {/* Navigation */}
            <nav className='space-y-2 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px]'>
              <NavItem
                href="/"
                icon={<DashBoardIcon className='w-5 h-5' />}
                label="Dashboard"
                isActive={pathname === '/'}
              />
              <NavItem
                href="/workflows"
                icon={<FileTextIcon className='w-5 h-5' />}
                label="Workflows"
                isActive={pathname === '/workflows'}
              />
              <NavItem
                href="/executions"
                icon={<ClockIcon className='w-5 h-5' />}
                label="Executions"
                isActive={pathname === '/executions'}
              />
              <NavItem
                href="/balance"
                icon={<WalletIcon className='w-5 h-5' />}
                label="Balance"
                isActive={pathname === '/balance'}
              />
              <div className="relative">
                <button
                  onClick={handleOpenSettings}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    pathname.startsWith('/settings')
                      ? 'bg-purple-600 text-white border-l-4 border-purple-500 shadow-lg shadow-purple-500/25'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white border-gray-600'
                  }`}
                >
                  <SettingsIcon className='w-5 h-5' />
                  <span className='font-medium'>Settings</span>
                  <ChevronRightIcon className={`w-4 h-4 ml-auto transition-transform ${isSettingsSubmenuOpen ? 'rotate-90' : ''}`} />
                </button>
                
                {/* Settings Submenu */}
                {isSettingsSubmenuOpen && (
                  <div className="ml-4 mt-2 space-y-1 border-l border-gray-600 pl-4">
                    <Link
                      href="/settings/telegram"
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                        pathname === '/settings/telegram'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="p-1 bg-blue-600 rounded">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                      </div>
                      <span>Telegram</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Logout */}
            <div className='mt-4 border rounded-lg border-gray-600 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px]'>
              <button
                onClick={handleLogout}
                className='w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors'
              >
                <LogOutIcon className='w-5 h-5' />
                <span className='font-medium'>Log-out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 pt-[40px] pb-8 xl:pr-[278px] ml-[120px] pr-[40px] bg-gray-900'>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className='md:hidden bg-gray-900 min-h-screen'>
        {/* Mobile Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">{getPageTitle()}</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="fixed left-0 top-0 h-full w-80 bg-gray-800 border-r border-gray-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                {/* User Profile */}
                <div className="text-center mb-6 border rounded-lg border-gray-600 p-4 bg-gray-700">
                  <Avatar className='w-16 h-16 mx-auto mb-3'>
                    <AvatarImage src={user?.photo || undefined} />
                    <AvatarFallback className='bg-purple-600 text-white text-lg font-semibold'>
                      {getInitials(user?.username || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className='text-lg font-semibold text-white'>
                    {user?.username || 'User'}
                  </h2>
                  <Badge variant='secondary' className='bg-purple-600 text-white mt-1'>
                    {user?.role || 'User'}
                  </Badge>
                </div>

                {/* Navigation */}
                <nav className='space-y-2 mb-4'>
                  <NavItem
                    href="/"
                    icon={<DashBoardIcon className='w-5 h-5' />}
                    label="Dashboard"
                    isActive={pathname === '/'}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <NavItem
                    href="/workflows"
                    icon={<FileTextIcon className='w-5 h-5' />}
                    label="Workflows"
                    isActive={pathname === '/workflows'}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <NavItem
                    href="/executions"
                    icon={<ClockIcon className='w-5 h-5' />}
                    label="Executions"
                    isActive={pathname === '/executions'}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <div className="relative">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleOpenSettings();
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        pathname.startsWith('/settings')
                          ? 'bg-purple-600 text-white border-l-4 border-purple-500 shadow-lg shadow-purple-500/25'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white border-gray-600'
                      }`}
                    >
                      <SettingsIcon className='w-5 h-5' />
                      <span className='font-medium'>Settings</span>
                      <ChevronRightIcon className={`w-4 h-4 ml-auto transition-transform ${isSettingsSubmenuOpen ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {/* Settings Submenu */}
                    {isSettingsSubmenuOpen && (
                      <div className="ml-4 mt-2 space-y-1 border-l border-gray-600 pl-4">
                        <Link
                          href="/settings/telegram"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                            pathname === '/settings/telegram'
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <div className="p-1 bg-blue-600 rounded">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </div>
                          <span>Telegram</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>

                {/* Logout */}
                <div className='border rounded-lg border-gray-600'>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors'
                  >
                    <LogOutIcon className='w-5 h-5' />
                    <span className='font-medium'>Log-out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Main Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};
