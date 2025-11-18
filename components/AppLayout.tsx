'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import { Link as I18nLink, useRouter } from '@/i18n/routing';
import aiPillsLogo from '@/public/brand/aiPillsLogo.png';
import {
  LogOutIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  WorkflowsIcon,
  ExecutionIcon,
  BalanceIcon,
  SettingsNewIcon
} from '@/components/icons';

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

// Memoized TopNavItem component with shimmer effects and mouse tracking on letters
const TopNavItem: React.FC<{
  href: string;
  icon?: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}> = React.memo(({ href, icon, label, isActive, onClick }) => {
  const locale = useLocale();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const labelRef = useRef<HTMLSpanElement>(null);
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Log navigation
    console.log('[TopNavItem] Navigation clicked:', {
      href,
      currentLocale: locale,
      currentUrl: window.location.href,
      currentPathname: window.location.pathname,
      cookies: document.cookie,
      expectedUrl: `/${locale}${href}`
    });
    
    if (onClick) {
      onClick();
    }
    
    // Log after navigation
    setTimeout(() => {
      console.log('[TopNavItem] After navigation:', {
        newUrl: window.location.href,
        newPathname: window.location.pathname,
        cookies: document.cookie
      });
    }, 100);
  };

  // Mouse tracking for interactive gradient on label text
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!labelRef.current || isActive) return;
    
    const rect = labelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  }, [isActive]);

  const handleMouseEnter = useCallback(() => {
    if (!isActive) {
      setIsHovering(true);
    }
  }, [isActive]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <I18nLink
      href={href}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center ${icon ? 'gap-2' : 'gap-0'} px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden ${
        isActive
          ? 'shadow-lg shadow-purple-500/30'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon && (
        <span className={`relative z-10 transition-all duration-300 ${isActive ? 'font-bold scale-110' : 'font-medium'}`}>
          {icon}
        </span>
      )}
      <span className="relative z-10 hidden lg:inline-block text-center">
        {/* Base text - always visible */}
        <span 
          ref={labelRef}
          className={`transition-all duration-300 ${
            isActive 
              ? 'font-bold bg-gradient-to-r from-[#A500E1] to-[#7B61FF] bg-clip-text text-transparent' 
              : 'font-medium text-gray-300'
          }`}
        >
          {label}
        </span>
        
        {/* Gradient overlay that follows mouse - only visible on hover */}
        {!isActive && isHovering && (
          <span
            className="absolute inset-0 font-medium pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(100px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(165,0,225,1) 0%, rgba(123,97,255,1) 18%, rgba(165,0,225,0.8) 32%, rgba(123,97,255,0.4) 48%, transparent 65%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {label}
          </span>
        )}
      </span>

      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#A500E1] to-[#7B61FF]"></span>
      )}
    </I18nLink>
  );
});

TopNavItem.displayName = 'TopNavItem';

// Integrations Nav Button with mouse tracking on letters
const IntegrationsNavButton: React.FC<{
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  label: string;
}> = React.memo(({ isActive, isOpen, onToggle, label }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const labelRef = useRef<HTMLSpanElement>(null);

  // Mouse tracking for interactive gradient on label text
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!labelRef.current || isActive) return;
    
    const rect = labelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  }, [isActive]);

  const handleMouseEnter = useCallback(() => {
    if (!isActive) {
      setIsHovering(true);
    }
  }, [isActive]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <button
      onClick={onToggle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden ${
        isActive
          ? 'shadow-lg shadow-purple-500/30'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
      aria-label="Integrations"
      aria-expanded={isOpen}
    >
      {/* Icon removed for cleaner text-only nav */}
      <span className="relative z-10 hidden lg:inline-block text-center">
        {/* Base text - always visible */}
        <span 
          className={`transition-all duration-300 ${
            isActive 
              ? 'font-bold bg-gradient-to-r from-[#A500E1] to-[#7B61FF] bg-clip-text text-transparent' 
              : 'font-medium text-gray-300'
          }`}
        >
          {label}
        </span>
        
        {/* Gradient overlay that follows mouse - only visible on hover */}
        {!isActive && isHovering && (
          <span
            ref={labelRef}
            className="absolute inset-0 font-medium pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(100px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(165,0,225,1) 0%, rgba(123,97,255,1) 18%, rgba(165,0,225,0.8) 32%, rgba(123,97,255,0.4) 48%, transparent 65%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {label}
          </span>
        )}
      </span>
      {/* Caret icon to indicate dropdown */}
      <svg
        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#A500E1] to-[#7B61FF]"></span>
      )}
    </button>
  );
});

IntegrationsNavButton.displayName = 'IntegrationsNavButton';

// Memoized Telegram icon component
const TelegramIcon: React.FC<{ className?: string }> = React.memo(({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
));

TelegramIcon.displayName = 'TelegramIcon';

export const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const t = useTranslations('nav');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isIntegrationsDropdownOpen, setIsIntegrationsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const integrationsDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Ensure pathname is only used on client side
  // usePathname from next-intl may fail during static export, so we use window.location
  const [pathname, setPathname] = useState<string>('/');
  
  // Get pathname from window.location (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePathname = () => {
      const currentPath = window.location.pathname;
      // Remove locale prefix if present (uk, en, fr)
      const normalizedPath = currentPath.replace(/^\/(uk|en|fr)(\/|$)/, '/') || '/';
      setPathname(normalizedPath);
    };
    
    // Initial update
    updatePathname();
    
    // Listen to route changes via Next.js router events
    const handleRouteChange = () => {
      // Small delay to ensure window.location is updated
      setTimeout(updatePathname, 0);
    };
    
    // Listen to browser navigation
    window.addEventListener('popstate', updatePathname);
    
    // Also update when router changes (via custom event or polling)
    const interval = setInterval(updatePathname, 100);
    
    return () => {
      window.removeEventListener('popstate', updatePathname);
      clearInterval(interval);
    };
  }, []);

  // Memoize active states to prevent unnecessary recalculations
  const activeStates = useMemo(() => ({
    dashboard: pathname === '/dashboard' || pathname === '/' || pathname.startsWith('/dashboard/') || pathname.startsWith('/workflows/'),
    workflows: pathname === '/workflows',
    executions: pathname === '/executions',
    balance: pathname === '/balance',
    integrations: pathname.startsWith('/integrations'),
    telegram: pathname === '/integrations/telegram'
  }), [pathname]);

  // Memoize user initials to prevent recalculation
  const userInitials = useMemo(() => 
    getInitials(user?.firstName, user?.lastName, user?.username),
    [user?.firstName, user?.lastName, user?.username]
  );

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);

  // Close mobile menu and integrations submenu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsIntegrationsDropdownOpen(false);
  }, [pathname]);

  // Memoize toggle functions
  const toggleIntegrationsDropdown = useCallback(() => {
    setIsIntegrationsDropdownOpen(prev => !prev);
  }, []);

  const closeIntegrationsDropdown = useCallback(() => {
    setIsIntegrationsDropdownOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Fixed useEffect with proper cleanup
  useEffect(() => {
    if (!isIntegrationsDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (integrationsDropdownRef.current && !integrationsDropdownRef.current.contains(event.target as Node)) {
        setIsIntegrationsDropdownOpen(false);
      }
    };

    // Use capture phase for better performance
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isIntegrationsDropdownOpen]);

  // Close user menu on outside click
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isUserMenuOpen]);

  return (
    <div className='h-screen bg-black overflow-hidden'>
      {/* Global Top Navbar */}
      <nav className='w-full px-4 lg:px-8 py-4 bg-[#141519] shadow-2xl shadow-purple-500/10 relative overflow-visible z-50'>
        <div className='flex items-center justify-between relative'>
          {/* Logo */}
          <I18nLink href='/' className='hover:opacity-90 flex-shrink-0'>
            <Image src={aiPillsLogo} alt="AiPills logo" className="h-auto w-10" priority />
          </I18nLink>
          
          {/* Navigation Items - Centered (desktop only) */}
          <div className='absolute left-1/2 transform -translate-x-1/2 overflow-visible hidden md:block'>
            <div className='relative flex items-center gap-2 lg:gap-4 overflow-visible'>
              <TopNavItem
                href="/dashboard"
                label={t('dashboard')}
                isActive={activeStates.dashboard}
              />
              <TopNavItem
                href="/workflows"
                label={t('workflows')}
                isActive={activeStates.workflows}
              />

              {/* Integrations Dropdown */}
              <div className="relative z-50" ref={integrationsDropdownRef}>
                <IntegrationsNavButton
                  isActive={activeStates.integrations}
                  isOpen={isIntegrationsDropdownOpen}
                  onToggle={toggleIntegrationsDropdown}
                  label={t('integrations')}
                />

                {/* Integrations Dropdown Menu */}
                <div 
                  className={`absolute left-0 top-full mt-2 w-48 bg-[#141519] border border-gray-700 rounded-lg shadow-xl z-[100] overflow-hidden transition-all duration-500 ease-out ${
                    isIntegrationsDropdownOpen 
                      ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' 
                      : 'opacity-0 -translate-y-4 pointer-events-none scale-95'
                  }`}
                  aria-hidden={!isIntegrationsDropdownOpen}
                  {...(!isIntegrationsDropdownOpen && { tabIndex: -1, 'aria-disabled': true })}
                >
                  <I18nLink
                    href="/integrations/telegram"
                    onClick={closeIntegrationsDropdown}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      activeStates.telegram
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    tabIndex={isIntegrationsDropdownOpen ? 0 : -1}
                  >
                    <div className="p-1 bg-blue-600 rounded">
                      <TelegramIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className='font-medium'>Telegram</span>
                  </I18nLink>
                </div>
              </div>

              <TopNavItem
                href="/executions"
                label={t('executions')}
                isActive={activeStates.executions}
              />
              <TopNavItem
                href="/balance"
                label={t('balance')}
                isActive={activeStates.balance}
              />
            </div>
          </div>
          
          {/* Right Side - User */}
          <div className='flex items-center gap-2 lg:gap-4 flex-shrink-0 ml-auto'>
            {/* User Avatar with dropdown */}
            <div className='hidden md:flex items-center gap-3 relative' ref={userMenuRef}>
              <button
                className='rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500'
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  setIsIntegrationsDropdownOpen(false);
                  setIsUserMenuOpen(prev => !prev);
                }}
                aria-haspopup='menu'
                aria-expanded={isUserMenuOpen}
              >
                <Avatar className='w-10 h-10 cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all'>
                  <AvatarImage 
                    src={user?.photo || undefined} 
                    alt={user?.username || 'User'} 
                  />
                  <AvatarFallback className='bg-purple-600 text-white'>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>

              <div className='flex flex-col leading-tight'>
                <span className='text-sm font-semibold text-white'>
                  {`${(user?.firstName || '').trim()} ${(user?.lastName || '').trim()}`.trim() || user?.username || 'User'}
                </span>
                <span className='text-xs text-gray-400'>
                  {user?.email}
                </span>
              </div>

              {/* Dropdown */}
              <div
                className={`absolute right-0 mt-2 w-44 bg-[#141519] border border-gray-700 rounded-lg shadow-xl z-[100] overflow-hidden transition-all duration-200 ease-out ${isUserMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                role='menu'
                aria-hidden={!isUserMenuOpen}
                {...(!isUserMenuOpen && { tabIndex: -1, 'aria-disabled': true })}
              >
                <I18nLink
                  href='/profile'
                  className='block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white'
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  {t('profile')}
                </I18nLink>
                <div className='my-1 h-px bg-white/10' role='separator' />
                <button
                  onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}
                  className='w-full text-left px-4 py-2 text-sm text-red-500 hover:text-red-400'
                >
                  {t('logout')}
                </button>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                setIsIntegrationsDropdownOpen(false);
                toggleMobileMenu();
              }}
              className='p-2 text-gray-300 hover:text-white transition-colors md:hidden'
              aria-label='Toggle menu'
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <XIcon className='w-6 h-6' />
              ) : (
                <MenuIcon className='w-6 h-6' />
              )}
            </button>
            {/* Fullscreen burger menu overlay */}
            {isMobileMenuOpen && (
              <div
                className='fixed inset-0 z-[100] bg-[#0b0c10]/80 backdrop-blur-sm'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div
                  className='absolute inset-0 bg-[#141519]/95'
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className='absolute top-4 right-4'>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label='Close menu'
                      className='p-2 text-gray-300 hover:text-white'
                    >
                      <XIcon className='w-7 h-7' />
                    </button>
                  </div>
                  <nav className='h-full w-full flex flex-col items-center justify-center gap-6 px-6'>
                    <I18nLink href='/dashboard' onClick={() => setIsMobileMenuOpen(false)}>
                      <span className={`text-2xl md:text-3xl transition-all ${
                        activeStates.dashboard
                          ? 'font-bold bg-gradient-to-r from-[#A500E1] to-[#7B61FF] bg-clip-text text-transparent'
                          : 'font-medium text-gray-300 hover:text-white'
                      }`}>
                        {t('dashboard')}
                      </span>
                    </I18nLink>
                    <I18nLink href='/workflows' onClick={() => setIsMobileMenuOpen(false)}>
                      <span className={`text-2xl md:text-3xl transition-all ${
                        activeStates.workflows
                          ? 'font-bold bg-gradient-to-r from-[#A500E1] to-[#7B61FF] bg-clip-text text-transparent'
                          : 'font-medium text-gray-300 hover:text-white'
                      }`}>
                        {t('workflows')}
                      </span>
                    </I18nLink>
                    <I18nLink href='/executions' onClick={() => setIsMobileMenuOpen(false)}>
                      <span className={`text-2xl md:text-3xl transition-all ${
                        activeStates.executions
                          ? 'font-bold bg-gradient-to-r from-[#A500E1] to-[#7B61FF] bg-clip-text text-transparent'
                          : 'font-medium text-gray-300 hover:text-white'
                      }`}>
                        {t('executions')}
                      </span>
                    </I18nLink>
                    <I18nLink href='/balance' onClick={() => setIsMobileMenuOpen(false)}>
                      <span className={`text-2xl md:text-3xl transition-all ${
                        activeStates.balance
                          ? 'font-bold bg-gradient-to-r from-[#A500E1] to-[#7B61FF] bg-clip-text text-transparent'
                          : 'font-medium text-gray-300 hover:text-white'
                      }`}>
                        {t('balance')}
                      </span>
                    </I18nLink>
                    <div className='flex flex-col items-center gap-2 mt-2'>
                      <span className='text-sm uppercase tracking-wider text-gray-400'>{t('integrations')}</span>
                      <I18nLink
                        href='/integrations/telegram'
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`text-2xl md:text-3xl transition-all ${
                          activeStates.telegram
                            ? 'font-bold bg-gradient-to-r from-[#A500E1] to-[#7B61FF] bg-clip-text text-transparent'
                            : 'font-medium text-gray-300 hover:text-white'
                        }`}
                      >
                        Telegram
                      </I18nLink>
                    </div>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* Desktop Layout */}
      <div className='hidden md:flex h-[calc(100vh-88px)] overflow-hidden'>
        {/* Main Content with gradient background */}
        <div className='flex-1 pt-8 pb-8 px-4 lg:px-8 h-full overflow-y-auto relative'>
          {/* Dark purple gradient background - starts with navbar color and transitions smoothly */}
          <div 
            className="fixed inset-0 top-[88px] pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #141519 0%, #141519 20%, rgba(20, 21, 25, 0.995) 25%, rgba(25, 22, 35, 0.9) 32%, rgba(35, 28, 50, 0.75) 40%, rgba(45, 32, 65, 0.6) 48%, rgba(70, 40, 90, 0.5) 55%, rgba(101, 43, 155, 0.45) 62%, rgba(80, 35, 110, 0.55) 68%, rgba(65, 21, 100, 0.65) 75%, rgba(45, 15, 70, 0.8) 82%, rgba(35, 10, 55, 0.9) 88%, rgba(20, 7, 35, 0.95) 94%, rgba(15, 5, 25, 1) 100%)',
              zIndex: 0,
            }}
          />
          <div 
            className="relative z-10 max-w-6xl mx-auto" 
            style={{ 
              minHeight: '600px',
              containIntrinsicSize: '1152px 600px'
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className='md:hidden h-[calc(100vh-88px)] overflow-hidden relative'>
        {/* Dark purple gradient background for mobile */}
        <div 
          className="fixed inset-0 top-[88px] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #141519 0%, #141519 10%, rgba(20, 21, 25, 0.98) 15%, rgba(50, 20, 80, 0.4) 25%, rgba(101, 43, 155, 0.5) 40%, rgba(65, 21, 100, 0.7) 55%, rgba(35, 10, 55, 0.9) 75%, rgba(15, 5, 25, 1) 100%)',
            zIndex: 0,
          }}
        />
        {/* Mobile Menu Overlay */}
        {false && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeMobileMenu}>
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
                      <I18nLink
                        href="/dashboard"
                        onClick={closeMobileMenu}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
                          activeStates.dashboard
                            ? 'bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <WorkflowsIcon className='w-5 h-5' />
                        <span className='font-medium'>Dashboard</span>
                      </I18nLink>
                      <I18nLink
                        href="/workflows"
                        onClick={closeMobileMenu}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
                          activeStates.workflows
                            ? 'bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <WorkflowsIcon className='w-5 h-5' />
                        <span className='font-medium'>Workflows</span>
                      </I18nLink>
                      
                      {/* Integrations Section */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            closeMobileMenu();
                            toggleIntegrationsDropdown();
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            activeStates.integrations
                              ? 'bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <SettingsNewIcon className='w-5 h-5' />
                          <span className='font-medium'>Integrations</span>
                          <ChevronRightIcon className={`w-4 h-4 ml-auto transition-transform ${isIntegrationsDropdownOpen ? 'rotate-90' : ''}`} />
                        </button>
                        
                        {/* Integrations Submenu */}
                        {isIntegrationsDropdownOpen && (
                          <div className="ml-4 mt-2 space-y-1 border-l border-gray-600 pl-4">
                            <I18nLink
                              href="/integrations/telegram"
                              onClick={closeMobileMenu}
                              className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                                activeStates.telegram
                                  ? 'bg-purple-600 text-white'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              }`}
                            >
                              <div className="p-1 bg-blue-600 rounded">
                                <TelegramIcon className="w-4 h-4 text-white" />
                              </div>
                              <span>Telegram</span>
                            </I18nLink>
                          </div>
                        )}
                      </div>
                      
                      <I18nLink
                        href="/executions"
                        onClick={closeMobileMenu}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
                          activeStates.executions
                            ? 'bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <ExecutionIcon className='w-5 h-5' />
                        <span className='font-medium'>Executions</span>
                      </I18nLink>
                      <I18nLink
                        href="/balance"
                        onClick={closeMobileMenu}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
                          activeStates.balance
                            ? 'bg-[#A500E1] text-white shadow-lg shadow-[#A500E1]/25'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <BalanceIcon className='w-5 h-5' />
                        <span className='font-medium'>Balance</span>
                      </I18nLink>
                    </div>
                  </div>
                </nav>

                {/* Logout */}
                <div className='mt-auto'>
                  <button
                    onClick={() => {
                      closeMobileMenu();
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
        <div className="relative z-10 p-4 h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
