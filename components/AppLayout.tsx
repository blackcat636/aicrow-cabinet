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
  WalletIcon,
  WorkflowsIcon,
  ExecutionIcon,
  BalanceIcon,
  SettingsNewIcon,
  SearchIcon,
  BellIcon,
  HeartIcon,
  MicIcon,
  UserIcon
} from '@/components/icons';
import { siteConfig } from '@/config/site';

interface LayoutProps {
  children: React.ReactNode;
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
  return 'U';
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
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      <span className='font-medium'>{label}</span>
    </Link>
  );

  return (
    <div className='h-screen bg-black overflow-hidden'>
      {/* Global Top Navbar */}
      <nav className='w-full px-8 pt-[40px] pb-4 bg-[#141519] border-b border-gray-700'>
        <div className='flex items-center justify-between'>
          <Link href='/' className='text-2xl font-semibold text-white hover:opacity-90 ml-[40px]'>AiPills</Link>
          
          {/* User Avatar */}
          <div className='flex items-center gap-4'>
            <Link
              href='/profile'
              className='hidden md:block'
            >
              <Avatar className='w-10 h-10 cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all'>
                <AvatarImage 
                  src={user?.photo || undefined} 
                  alt={user?.username || 'User'} 
                />
                <AvatarFallback className='bg-purple-600 text-white'>
                  {getInitials(user?.firstName, user?.lastName, user?.username)}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='p-2 text-gray-300 hover:text-white transition-colors md:hidden'
              aria-label='Toggle menu'
            >
              {isMobileMenuOpen ? (
                <XIcon className='w-6 h-6' />
              ) : (
                <MenuIcon className='w-6 h-6' />
              )}
            </button>
          </div>
        </div>
      </nav>
      {/* Desktop Layout */}
      <div className='hidden md:flex h-[calc(100vh-100px)] ml-[100px] overflow-hidden'>
        {/* Sidebar */}
        <div className='w-[320px] xl:w-[360px] 2xl:w-[390px] 3xl:w-[420px] 4xl:w-[450px] pt-[40px] bg-[#141519] border-r border-gray-700 shadow-sm flex-shrink-0 h-full overflow-hidden'>
          <div className='ml-7 flex flex-col h-full'>
            {/* Welcome Header */}
            <div className='w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px] mb-6'>
              <h2 className='text-2xl font-semibold'>
                <span className='text-[#85A0BD]'>Welcome,</span>{' '}
                <span className='text-white'>{user?.username || 'User'}</span>
              </h2>
            </div>

            <div className='mt-4 mb-6 h-px bg-white/10 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px]'></div>

            {/* Navigation */}
            <nav className='space-y-6 w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px] overflow-auto'>
              {/* Main Menu Section */}
              <div className='space-y-3'>
                <h3 className='text-xs font-medium text-gray-400 uppercase tracking-wider px-3'>Main Menu</h3>
                <div className='space-y-3'>
                  <NavItem
                    href="/workflows"
                    icon={<WorkflowsIcon className='w-5 h-5' />}
                    label="Workflows"
                    isActive={pathname === '/workflows' || pathname === '/'}
                  />
                  <NavItem
                    href="/executions"
                    icon={<ExecutionIcon className='w-5 h-5' />}
                    label="Executions"
                    isActive={pathname === '/executions'}
                  />
                  <NavItem
                    href="/balance"
                    icon={<BalanceIcon className='w-5 h-5' />}
                    label="Balance"
                    isActive={pathname === '/balance'}
                  />
                </div>
              </div>

              {/* Settings Section */}
              <div className='space-y-3'>
                <h3 className='text-xs font-medium text-gray-400 uppercase tracking-wider px-3'>Settings</h3>
                <div className='space-y-3'>
                  <div className="relative">
                    <button
                      onClick={handleOpenSettings}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        pathname.startsWith('/settings')
                          ? 'bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <SettingsNewIcon className='w-5 h-5' />
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
                </div>
              </div>
            </nav>

            {/* Logout */}
            <div className='mt-auto w-[260px] xl:w-[300px] 2xl:w-[330px] 3xl:w-[360px] 4xl:w-[390px] pb-6'>
              <button
              onClick={handleLogout}
              className='w-full flex items-center gap-3 p-3 rounded-lg bg-[#A500E1] text-white hover:bg-[#8F00C7] transition-colors'
              >
                <LogOutIcon className='w-5 h-5' />
                <span className='font-medium'>Log-out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 pt-[40px] pb-8 pr-[100px] pl-5 bg-black h-full overflow-y-auto'>
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className='md:hidden bg-black h-[calc(100vh-100px)] overflow-hidden'>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-80 bg-[#141519] border-r border-gray-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 flex flex-col h-full">
                {/* Welcome Header */}
                <div className='mb-4'>
                  <h2 className='text-2xl font-semibold'>
                    <span className='text-[#85A0BD]'>Welcome,</span>{' '}
                    <span className='text-white'>{user?.username || 'User'}</span>
                  </h2>
                  <div className='mt-3 h-px bg-white/10'></div>
                </div>

                {/* Navigation */}
                <nav className='space-y-4 mb-4'>
                  {/* Main Menu Section */}
                  <div className='space-y-2'>
                    <h3 className='text-xs font-medium text-gray-400 uppercase tracking-wider px-3'>Main Menu</h3>
                    <div className='space-y-2'>
                      <NavItem
                        href="/workflows"
                        icon={<WorkflowsIcon className='w-5 h-5' />}
                        label="Workflows"
                        isActive={pathname === '/workflows' || pathname === '/'}
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                      <NavItem
                        href="/executions"
                        icon={<ExecutionIcon className='w-5 h-5' />}
                        label="Executions"
                        isActive={pathname === '/executions'}
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                      <NavItem
                        href="/balance"
                        icon={<BalanceIcon className='w-5 h-5' />}
                        label="Balance"
                        isActive={pathname === '/balance'}
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                    </div>
                  </div>

                  {/* Settings Section */}
                  <div className='space-y-2'>
                    <h3 className='text-xs font-medium text-gray-400 uppercase tracking-wider px-3'>Settings</h3>
                    <div className='space-y-2'>
                      <div className="relative">
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleOpenSettings();
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            pathname.startsWith('/settings')
                              ? 'bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <SettingsNewIcon className='w-5 h-5' />
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
                    </div>
                  </div>
                </nav>

                {/* Logout */}
                <div className='mt-auto'>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className='w-full flex items-center gap-3 p-3 rounded-lg bg-[#A500E1] text-white hover:bg-[#8F00C7] transition-colors'
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
        <div className="p-4 h-full overflow-y-auto">
          <header className='mb-4'></header>
          {children}
        </div>
      </div>
    </div>
  );
};
