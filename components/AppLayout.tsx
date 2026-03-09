'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { balanceApi } from '@/lib/apiBalance';
import { useTranslations, useLocale } from 'next-intl';
import { Link as I18nLink, useRouter } from '@/i18n/routing';
import aiPillsLogo from '@/public/brand/aiPillsLogo.png';
import {
  LogOutIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DashBoardIcon,
  WorkflowsIcon,
  BalanceIcon,
  SettingsNewIcon
} from '@/components/icons';
import { UserImpersonationModal } from '@/components/admin/UserImpersonationModal';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { LanguageSwitcherMenu } from '@/components/LanguageSwitcherMenu';
import { Sidebar } from '@/components/navigation';
import { toast } from 'sonner';
import { getImpersonationMeta } from '@/lib/auth';
import { LogoutConfirmDialog } from '@/components/ui/LogoutConfirmDialog';
import { Badge } from '@/components/ui/badge';

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
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}> = React.memo(({ href, icon, label, isActive, onClick }) => {
  const locale = useLocale();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const labelRef = useRef<HTMLSpanElement>(null);
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
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
              ? 'font-bold bg-[var(--color-main)] bg-clip-text text-transparent' 
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
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-main)]"></span>
      )}
    </I18nLink>
  );
});

TopNavItem.displayName = 'TopNavItem';

export const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, impersonationInfo, impersonateUser, stopImpersonation, isLoading: authLoading } = useAuth();
  const { planName, isLoading: planLoading } = useSubscription();
  const t = useTranslations('nav');
  const tProfile = useTranslations('profile');
  const tImpersonation = useTranslations('impersonation');
  const tBilling = useTranslations('billing');

  // Real balance state
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Clean plan name - remove 'plan' suffix if present
  const cleanPlanName = planName ? planName.replace(/\s+plan$/i, '') : 'Free';

  // Fetch real balance from API
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setBalanceLoading(true);
        const response = await balanceApi.getBalance();
        
        // response.data is BalanceData[] array
        if (response?.data && response.data.length > 0) {
          const mainBalance = response.data[0];
          // Use available_balance which is the real usable balance
          const realBalance = mainBalance.available_balance;
          setBalance(realBalance);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        // Fallback to user balance if API fails
        setBalance(parseFloat(user?.balance || '0'));
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();
  }, [user?.balance]);

  const formattedBalance = balance.toLocaleString();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showImpersonationModal, setShowImpersonationModal] = useState(false);
  const [_isImpersonating, setIsImpersonating] = useState(false);
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
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
    dashboard: pathname === '/dashboard' || pathname === '/' || pathname.startsWith('/dashboard/') || pathname.startsWith('/market/'),
    market: pathname === '/market',
    workflows: pathname === '/workflows',
    executions: pathname === '/executions',
    balance: pathname === '/balance',
    billing: pathname === '/billing',
    integrations: pathname.startsWith('/integrations'),
    telegram: pathname === '/integrations/telegram'
  }), [pathname]);

  // Memoize user initials to prevent recalculation; show loading placeholder while auth is resolving
  const userInitials = useMemo(() =>
    authLoading ? '…' : getInitials(user?.firstName, user?.lastName, user?.username),
    [authLoading, user?.firstName, user?.lastName, user?.username]
  );
  const userDisplayName = authLoading ? '…' : (user?.username || (user ? '' : 'User'));

  const isAdmin = (() => {
    const role = (user?.role || '').toLowerCase();
    return role === 'admin' || role === 'administrator';
  })();
  const bannerInfo = useMemo(() => impersonationInfo || getImpersonationMeta(), [impersonationInfo]);
  const isImpersonated = bannerInfo?.isImpersonated;

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    try {
      setLogoutLoading(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
      setShowLogoutConfirm(false);
    }
  }, [logout]);

  const handleOpenImpersonation = useCallback(() => {
    setIsUserMenuOpen(false);
    setShowImpersonationModal(true);
  }, []);

  const handleImpersonate = useCallback(
    async (userId: number | string, targetUser: { username?: string; email?: string }) => {
      setIsImpersonating(true);
      try {
        await impersonateUser(Number(userId));
        toast.success(
          tImpersonation('impersonateSuccess', {
            user: targetUser?.username || targetUser?.email || 'user'
          })
        );
      } catch (error: any) {
        toast.error(error?.message || tImpersonation('impersonateError'));
      } finally {
        setIsImpersonating(false);
      }
    },
    [impersonateUser, tImpersonation]
  );

  const handleStopImpersonation = useCallback(async () => {
    setIsStoppingImpersonation(true);
    try {
      await stopImpersonation();
      toast.success(tImpersonation('stopSuccess'));
    } catch (error: any) {
      toast.error(error?.message || tImpersonation('stopError'));
    } finally {
      setIsStoppingImpersonation(false);
      setIsUserMenuOpen(false);
    }
  }, [stopImpersonation, tImpersonation]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Memoize toggle functions
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

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
    <>
    <div className='h-screen bg-black overflow-hidden flex flex-col'>
      <div className='hidden md:flex h-[78px] w-full bg-[var(--color-secondary-1)] border-b border-[var(--color-secondary-4)]'>
        <div className='h-full w-[240px] bg-[var(--color-secondary-2)] border-r border-[var(--color-secondary-4)] px-[40px] flex items-center'>
          <I18nLink href='/' className='hover:opacity-90 flex items-center gap-2'>
            <Image src={aiPillsLogo} alt="AiPills logo" className="h-[44px] w-[25px]" priority />
            <span className="text-[var(--color-secondary-10)] figma-body-1-medium">
              AI Pills
            </span>
          </I18nLink>
        </div>
        <div className='flex-1 h-full px-[40px] flex items-center justify-end'>
          <div className='flex items-center gap-[24px]'>
            {/* Balance and Plan Info */}
            <div className="flex items-center">
              <div className="font-normal text-[#9e9e9e] text-[16px] tracking-[0.32px]">
                <span>{tBilling('tokensInPlanPrefix', { count: formattedBalance })}</span>
                <Badge className="bg-[#757575] text-white text-[16px] font-semibold">{cleanPlanName}</Badge>
                <span>{tBilling('tokensInPlanSuffix')}</span>
              </div>
            </div>
            
            <LanguageSwitcherMenu variant="desktop" />
            <button
              type='button'
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsUserMenuOpen((prev) => !prev);
              }}
              className='rounded-full focus:outline-none'
              aria-label={t('profile')}
              aria-expanded={isUserMenuOpen}
            >
              <Avatar className='w-12 h-12'>
                <AvatarImage src={user?.photo || undefined} alt={authLoading ? '' : (user?.username || 'User')} />
                <AvatarFallback className={`text-lg ${authLoading ? 'bg-[var(--color-secondary-3)] animate-pulse' : 'bg-purple-600 text-white'}`}>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
      {/* Sidebar - Desktop */}
      <div className='hidden md:block'>
        <Sidebar 
          currentPath={pathname}
          showHeader={false}
        />
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Mobile Header */}
        <div className='md:hidden relative h-[71px] bg-[var(--color-secondary-1)] border-b border-[var(--color-secondary-4)]'>
          <div className='absolute left-4 top-1/2 -translate-y-1/2'>
            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                toggleMobileMenu();
              }}
              className='text-[var(--color-secondary-10)]'
              aria-label='Toggle menu'
              aria-expanded={isMobileMenuOpen}
            >
              <MenuIcon className='w-6 h-6' />
            </button>
          </div>

          <div className='absolute left-12 top-1/2 -translate-y-1/2 flex items-center gap-[8px]'>
            <I18nLink href='/' className='hover:opacity-90 flex items-center gap-[8px]'>
              <Image src={aiPillsLogo} alt="AiPills logo" className="h-[38.85px] w-[22.38px]" priority />
              <span className="text-[14.22px] font-medium leading-[1.4] tracking-[0.284px] text-[var(--color-secondary-10)]">
                AI Pills
              </span>
            </I18nLink>
          </div>

          <div className='absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4'>
            <LanguageSwitcherMenu variant="mobileHeader" />
            <button
              type='button'
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsUserMenuOpen((prev) => !prev);
              }}
              className='rounded-full focus:outline-none'
              aria-label={t('profile')}
              aria-expanded={isUserMenuOpen}
            >
              <Avatar className='w-8 h-8'>
                <AvatarImage src={user?.photo || undefined} alt={authLoading ? '' : (user?.username || 'User')} />
                <AvatarFallback className={`text-base ${authLoading ? 'bg-[var(--color-secondary-3)] animate-pulse' : 'bg-[var(--color-main)] text-[var(--color-secondary-10)]'}`}>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>

        {isUserMenuOpen && (
          <div
            ref={userMenuRef}
            className='fixed right-4 md:right-10 top-[68px] md:top-[70image.pngpx] z-[120] min-w-[188px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-2 shadow-[0px_0px_14px_0px_rgba(0,0,0,0.35)]'
          >
            <I18nLink
              href='/profile'
              onClick={() => setIsUserMenuOpen(false)}
              className='flex h-10 items-center rounded-[8px] px-3 text-[14px] font-medium text-[var(--color-secondary-10)] hover:bg-[var(--color-secondary-3)]'
            >
              {t('profile')}
            </I18nLink>

            {isAdmin && !isImpersonated && (
              <button
                type='button'
                onClick={handleOpenImpersonation}
                className='flex h-10 w-full items-center rounded-[8px] px-3 text-left text-[14px] font-medium text-[var(--color-secondary-10)] hover:bg-[var(--color-secondary-3)]'
              >
                {tImpersonation('loginMenu')}
              </button>
            )}

            {isImpersonated && (
              <button
                type='button'
                onClick={handleStopImpersonation}
                className='flex h-10 w-full items-center rounded-[8px] px-3 text-left text-[14px] font-medium text-[var(--color-secondary-10)] hover:bg-[var(--color-secondary-3)]'
              >
                {tImpersonation('exit')}
              </button>
            )}

          </div>
        )}

        {/* Mobile Side Menu Overlay */}
        {isMobileMenuOpen && (
          <div className='md:hidden fixed inset-x-0 top-[71px] bottom-0 z-[100]'>
            <div className='absolute inset-0 bg-black/55' onClick={() => setIsMobileMenuOpen(false)} />
            <aside className='absolute left-0 top-0 bottom-0 w-[240px] bg-[var(--color-secondary-2)] border-r border-[var(--color-secondary-4)] flex flex-col'>
              <nav className='flex-1 pt-4'>
                <I18nLink
                  href='/dashboard'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='relative flex h-[56px] items-center px-[24px]'
                >
                  {activeStates.dashboard && (
                    <div className='absolute -left-[1px] top-[4px] bottom-[2px] w-[5px] bg-[var(--color-secondary-10)] rounded-[10px]' />
                  )}
                  <div
                    className={`absolute inset-0 ${
                      activeStates.dashboard
                        ? 'left-[24px] right-[24px] top-[2px] bottom-[2px] bg-[var(--color-secondary-3)] rounded-[10px]'
                        : 'bg-transparent'
                    }`}
                  />
                  <div className='relative z-10 flex items-center gap-3 px-[16px] py-[13px]'>
                    <DashBoardIcon className={`${activeStates.dashboard ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'} w-5 h-5`} />
                    <span className={`figma-body-2-medium ${activeStates.dashboard ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'}`}>
                      {t('dashboard')}
                    </span>
                  </div>
                </I18nLink>

                <I18nLink
                  href='/market'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='relative flex h-[56px] items-center px-[24px]'
                >
                  {activeStates.market && (
                    <div className='absolute -left-[1px] top-[4px] bottom-[2px] w-[5px] bg-[var(--color-secondary-10)] rounded-[10px]' />
                  )}
                  <div
                    className={`absolute inset-0 ${
                      activeStates.market
                        ? 'left-[24px] right-[24px] top-[2px] bottom-[2px] bg-[var(--color-secondary-3)] rounded-[10px]'
                        : 'bg-transparent'
                    }`}
                  />
                  <div className='relative z-10 flex items-center gap-3 px-[16px] py-[13px]'>
                    <WorkflowsIcon className={`${activeStates.market ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'} w-5 h-5`} />
                    <span className={`figma-body-2-medium ${activeStates.market ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'}`}>
                      {t('market')}
                    </span>
                  </div>
                </I18nLink>

                <I18nLink
                  href='/balance'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='relative flex h-[56px] items-center px-[24px]'
                >
                  {activeStates.balance && (
                    <div className='absolute -left-[1px] top-[4px] bottom-[2px] w-[5px] bg-[var(--color-secondary-10)] rounded-[10px]' />
                  )}
                  <div
                    className={`absolute inset-0 ${
                      activeStates.balance
                        ? 'left-[24px] right-[24px] top-[2px] bottom-[2px] bg-[var(--color-secondary-3)] rounded-[10px]'
                        : 'bg-transparent'
                    }`}
                  />
                  <div className='relative z-10 flex items-center gap-3 px-[16px] py-[13px]'>
                    <BalanceIcon className={`${activeStates.balance ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'} w-5 h-5`} />
                    <span className={`figma-body-2-medium ${activeStates.balance ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'}`}>
                      {t('balance')}
                    </span>
                  </div>
                </I18nLink>

                <I18nLink
                  href='/billing'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='relative flex h-[56px] items-center px-[24px]'
                >
                  {activeStates.billing && (
                    <div className='absolute -left-[1px] top-[4px] bottom-[2px] w-[5px] bg-[var(--color-secondary-10)] rounded-[10px]' />
                  )}
                  <div
                    className={`absolute inset-0 ${
                      activeStates.billing
                        ? 'left-[24px] right-[24px] top-[2px] bottom-[2px] bg-[var(--color-secondary-3)] rounded-[10px]'
                        : 'bg-transparent'
                    }`}
                  />
                  <div className='relative z-10 flex items-center gap-3 px-[16px] py-[13px]'>
                    <BalanceIcon className={`${activeStates.billing ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'} w-5 h-5`} />
                    <span className={`figma-body-2-medium ${activeStates.billing ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'}`}>
                      {t('billing')}
                    </span>
                  </div>
                </I18nLink>
              </nav>

              <div className='border-t border-[var(--color-secondary-4)]'>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className='relative w-full h-[56px] flex items-center px-[24px]'
                >
                  <div className='relative z-10 flex items-center gap-3 px-[16px] py-[13px]'>
                    <LogOutIcon className='w-5 h-5 text-[var(--color-secondary-5)]' />
                    <span className='figma-body-1-medium text-[var(--color-secondary-5)]'>{t('logout')}</span>
                  </div>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Impersonation Banner */}
        <div className="sticky top-0 z-[45]">
          <ImpersonationBanner
            info={bannerInfo || null}
            onExit={handleStopImpersonation}
            loading={isStoppingImpersonation}
          />
        </div>

        {/* Desktop Layout */}
        <div className='hidden md:flex flex-1 overflow-hidden'>
          <div className='flex-1 pt-8 pb-8 px-4 lg:px-8 h-full overflow-y-auto bg-[var(--color-secondary-1)]'>
            <div
              className="max-w-[1262px] mx-auto"
              style={{
                minHeight: '600px',
                containIntrinsicSize: '1262px 600px'
              }}
            >
              {children}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className='md:hidden flex-1 overflow-hidden relative bg-[var(--color-secondary-1)]'>
        {/* Mobile Menu Overlay */}
        {false && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeMobileMenu}>
            <div className="fixed left-0 top-0 h-full w-80 bg-[var(--color-secondary-2)] border-r border-gray-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 flex flex-col h-full">
                {/* Welcome Header */}
                <div className='mb-4'>
                  <h2 className='text-2xl font-semibold'>
                    <span className='text-[#85A0BD]'>Welcome,</span>{' '}
                    <span className='text-white'>{userDisplayName || 'User'}</span>
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
                            ? 'bg-[var(--color-main)] text-white shadow-lg shadow-[var(--color-main)]/25'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <WorkflowsIcon className='w-5 h-5' />
                        <span className='font-medium'>Dashboard</span>
                      </I18nLink>
                      <I18nLink
                        href="/market"
                        onClick={closeMobileMenu}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
                          activeStates.market
                            ? 'bg-[var(--color-main)] text-white shadow-lg shadow-[var(--color-main)]/25'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <WorkflowsIcon className='w-5 h-5' />
                        <span className='font-medium'>{t('market')}</span>
                      </I18nLink>
                      
                      <I18nLink
                        href="/balance"
                        onClick={closeMobileMenu}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
                          activeStates.balance
                            ? 'bg-[var(--color-main)] text-white shadow-lg shadow-[var(--color-main)]/25'
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
                    className='w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--color-main)] text-white hover:opacity-90 transition-colors'
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
    </div>
    </div>
    <UserImpersonationModal
      isOpen={showImpersonationModal}
      onClose={() => setShowImpersonationModal(false)}
      onImpersonate={handleImpersonate}
    />
    <LogoutConfirmDialog
      isOpen={showLogoutConfirm}
      onClose={() => setShowLogoutConfirm(false)}
      onConfirm={handleLogout}
      loading={logoutLoading}
    />
    </>
  );
};
