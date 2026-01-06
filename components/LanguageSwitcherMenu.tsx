'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { USFlagIcon, UkraineFlagIcon, FranceFlagIcon, SpainFlagIcon } from '@/components/icons';

const languages = [
  { code: 'en', name: 'English', FlagIcon: USFlagIcon },
  { code: 'uk', name: 'Українська', FlagIcon: UkraineFlagIcon },
  { code: 'fr', name: 'Français', FlagIcon: FranceFlagIcon },
  { code: 'es', name: 'Español', FlagIcon: SpainFlagIcon }
];

interface LanguageSwitcherMenuProps {
  onClose?: () => void;
  variant?: 'desktop' | 'mobile';
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
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

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
      const dropdownWidth = variant === 'mobile' ? 192 : 176; // w-48 = 192px, w-44 = 176px
      
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

    const handleClickOutside = (event: MouseEvent) => {
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

    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
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
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-300 hover:bg-white/10 hover:text-white"
          aria-label="Language"
        >
          {currentLanguage.FlagIcon && React.createElement(currentLanguage.FlagIcon, { 
            className: 'w-5 h-5 flex-shrink-0' 
          })}
          <span className='text-lg font-medium'>{currentLanguage.name}</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-auto ${isOpen ? 'rotate-180' : ''}`}
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
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Language"
        >
          {currentLanguage.FlagIcon && React.createElement(currentLanguage.FlagIcon, { 
            className: 'w-5 h-4' 
          })}
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
            className={`fixed ${isMobile ? 'z-[200]' : 'z-[102]'} bg-[#141519] border border-gray-700 rounded-lg shadow-xl overflow-hidden`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {languages.map((lang) => {
              const FlagComponent = lang.FlagIcon;
              const isActive = lang.code === locale;
              
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLanguageChange(lang.code);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-purple-600/20 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {FlagComponent && React.createElement(FlagComponent, { className: 'w-4 h-4 flex-shrink-0' })}
                  <span className="flex-1 text-left">{lang.name}</span>
                  {isActive && (
                    <svg
                      className="w-4 h-4 text-purple-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
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
