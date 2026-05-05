'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { USFlagIcon, UkraineFlagIcon, FranceFlagIcon, SpainFlagIcon, RussiaFlagIcon } from '@/components/icons';

const languages = [
  { code: 'en', name: 'English', FlagIcon: USFlagIcon },
  { code: 'uk', name: 'Українська', FlagIcon: UkraineFlagIcon },
  { code: 'ru', name: 'Русский', FlagIcon: RussiaFlagIcon },
  { code: 'fr', name: 'Français', FlagIcon: FranceFlagIcon },
  { code: 'es', name: 'Español', FlagIcon: SpainFlagIcon }
];

interface LanguageSwitcherMenuProps {
  onClose?: () => void;
  variant?: 'desktop' | 'mobile' | 'mobileHeader';
}

export function LanguageSwitcherMenu({ onClose, variant = 'desktop' }: LanguageSwitcherMenuProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  const isMobile = variant === 'mobile';
  const isMobileHeader = variant === 'mobileHeader';
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
  const dropdownLanguages = languages.filter((lang) => lang.code !== locale);
  const desktopFlagClass = isMobileHeader ? 'w-6 h-4 flex-shrink-0' : 'w-6 h-4 flex-shrink-0';

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      if (onClose) onClose();
      return;
    }
    
    setIsOpen(false);
    
    // Set cookie for next-intl to detect the new locale
    const cookieOptions = `path=/; max-age=31536000; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    document.cookie = `NEXT_LOCALE=${newLocale}; ${cookieOptions}`;
    document.cookie = `locale=${newLocale}; ${cookieOptions}`;
    document.cookie = `next-intl-locale=${newLocale}; ${cookieOptions}`;
    
    if (onClose) onClose();
    
    // Use startTransition for smooth transition
    startTransition(() => {
      router.push(pathname, { locale: newLocale as any });
    });
  };

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownMenuRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = variant === 'mobile' ? 92 : 72;
      
      dropdownMenuRef.current.style.top = `${rect.bottom + window.scrollY + 8}px`;
      if (variant === 'mobile') {
        dropdownMenuRef.current.style.left = `${rect.left + window.scrollX}px`;
      } else {
        // For desktop, align to the right edge of the button
        dropdownMenuRef.current.style.right = `${window.innerWidth - (rect.right + window.scrollX)}px`;
      }
      dropdownMenuRef.current.style.width = `${dropdownWidth}px`;
    }
  }, [isOpen, variant]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      
      if (
        buttonRef.current && 
        !buttonRef.current.contains(target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside, true);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button - circular flag icon for desktop, text menu item for mobile */}
      {isMobile ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-gray-300 hover:bg-white/10 hover:text-white"
          aria-label="Language"
        >
          {currentLanguage.FlagIcon && React.createElement(currentLanguage.FlagIcon, {
            className: 'w-6 h-6 flex-shrink-0'
          })}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] flex items-center justify-between overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/60 ${
            isMobileHeader
              ? 'h-[36px] w-[54px] rounded-[7.5px] px-[8.25px] py-[10.25px]'
              : 'h-[48px] w-[72px] rounded-[10px] px-[10px] py-[14px]'
          }`}
          aria-label="Language"
        >
          {currentLanguage.FlagIcon && React.createElement(currentLanguage.FlagIcon, {
            className: desktopFlagClass
          })}
          <svg
            className={`${isMobileHeader ? 'h-[9px] w-[9px]' : 'h-[14px] w-[14px]'} text-[var(--color-secondary-10)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {/* Dropdown menu - rendered via portal */}
      {isOpen && typeof document !== 'undefined' && (createPortal(
        <>
          {/* Backdrop - only for desktop, for mobile we don't need backdrop */}
          {!isMobile && (
            <div
              className="fixed inset-0 z-[101]"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsOpen(false);
                }
              }}
            />
          )}
          {/* Dropdown */}
          <div
            ref={dropdownMenuRef}
            className={`fixed ${isMobile ? 'z-[200]' : 'z-[102]'} bg-[var(--color-secondary-2)] border border-[var(--color-secondary-4)] ${isMobile ? 'rounded-lg' : 'rounded-[10px]'} shadow-xl overflow-hidden`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {dropdownLanguages.map((lang) => {
              const FlagComponent = lang.FlagIcon;
              
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLanguageChange(lang.code);
                  }}
                  className={`w-full flex items-center justify-center ${
                    isMobile ? 'gap-2 px-3 py-2 text-sm' : 'h-[46px] px-0'
                  } text-gray-300 transition-colors hover:bg-white/10 hover:text-white ${
                    !isMobile ? 'border-b border-[var(--color-secondary-4)] last:border-b-0' : ''
                  }`}
                >
                  {FlagComponent && React.createElement(FlagComponent, {
                    className: isMobile ? 'w-5 h-5 flex-shrink-0' : 'w-6 h-4 flex-shrink-0'
                  })}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      ) as React.ReactNode)}
    </div>
  );
}
