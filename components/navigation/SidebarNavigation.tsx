'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link as I18nLink } from '@/i18n/routing';
import {
  WorkflowsIcon,
  LogOutIcon,
  BalanceIcon,
  SettingsNewIcon,
} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { LogoutConfirmDialog } from '@/components/ui/LogoutConfirmDialog';

interface SidebarNavigationProps {
  currentPath?: string;
  className?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  translationKey: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  currentPath = '/',
  className = '',
}) => {
  const t = useTranslations('nav');
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [logoutLoading, setLogoutLoading] = React.useState(false);

  // Normalize pathname (remove locale prefix if present)
  const normalizePath = (path: string) => {
    return path.replace(/^\/(uk|en|fr)(\/|$)/, '/') || '/';
  };

  const normalizedPath = normalizePath(currentPath);

  // Navigation items configuration
  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: t('dashboard'),
      icon: <WorkflowsIcon className="w-5 h-5" />,
      translationKey: 'dashboard',
    },
    {
      href: '/workflows',
      label: t('workflows'),
      icon: <WorkflowsIcon className="w-5 h-5" />,
      translationKey: 'workflows',
    },
    {
      href: '/balance',
      label: t('balance'),
      icon: <BalanceIcon className="w-5 h-5" />,
      translationKey: 'balance',
    },
    {
      href: '/billing',
      label: t('billing'),
      icon: <SettingsNewIcon className="w-5 h-5" />,
      translationKey: 'billing',
    },
  ];

  const isActive = (href: string) => {
    const normalizedHref = normalizePath(href);
    if (normalizedHref === '/dashboard') {
      return normalizedPath === '/dashboard' || normalizedPath === '/' || normalizedPath.startsWith('/dashboard/');
    }
    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <nav className={`flex flex-col h-full font-['Montserrat',sans-serif] ${className}`}>
      <div className="flex-1 flex flex-col">
        {/* Navigation Items */}
        <div className="flex-1">
          {navItems.map((item) => {
            const active = item.href !== '#' && isActive(item.href);
            
            return (
              <I18nLink
                key={item.href}
                href={item.href}
                onClick={item.onClick}
                className="relative flex h-[56px] items-center px-[24px] transition-all duration-200 group"
              >
                {active && (
                  <div className="absolute -left-[1px] top-[4px] bottom-[2px] w-[5px] bg-[var(--color-secondary-10)] rounded-[10px]" />
                )}
                
                <div
                  className={`absolute inset-0 rounded-lg transition-all duration-200 ${
                    active
                      ? 'left-[24px] right-[24px] top-[2px] bottom-[2px] bg-[var(--color-secondary-3)] rounded-[10px]'
                      : 'bg-transparent'
                  }`}
                />
                
                <div className="relative z-10 flex w-full items-center gap-3 px-[16px] py-[13px]">
                  <span className={`flex-shrink-0 transition-colors ${
                    active ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'
                  }`}>
                    {item.icon}
                  </span>
                  <span className={`figma-body-2-medium transition-colors ${
                    active ? 'text-[var(--color-secondary-10)]' : 'text-[var(--color-secondary-5)]'
                  }`}>
                    {item.label}
                  </span>
                </div>
              </I18nLink>
            );
          })}
        </div>

        {/* Log Out Button */}
        <div className="border-t border-[var(--color-secondary-4)] mt-auto">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="relative w-full h-[56px] flex items-center px-[24px] transition-all duration-200"
          >
            <div className="relative z-10 flex w-full items-center gap-3 px-[16px] py-[13px]">
              <LogOutIcon className="w-5 h-5 flex-shrink-0 text-[var(--color-secondary-5)]" />
              <span className="figma-body-1-medium text-[var(--color-secondary-5)]">
                Log Out
              </span>
            </div>
          </button>
        </div>
      </div>
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </nav>
  );
};
