'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { USFlagIcon, UkraineFlagIcon, FranceFlagIcon, SpainFlagIcon } from '@/components/icons';

const languages = [
  { code: 'en', name: 'English', FlagIcon: USFlagIcon },
  { code: 'uk', name: 'Українська', FlagIcon: UkraineFlagIcon },
  { code: 'fr', name: 'Français', FlagIcon: FranceFlagIcon },
  { code: 'es', name: 'Español', FlagIcon: SpainFlagIcon }
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('profile');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    
    // Close dropdown first
    setIsOpen(false);
    
    // Set cookie for next-intl to detect the new locale
    // next-intl uses these cookie names
    const cookieOptions = `path=/; max-age=31536000; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    document.cookie = `NEXT_LOCALE=${newLocale}; ${cookieOptions}`;
    document.cookie = `locale=${newLocale}; ${cookieOptions}`;
    document.cookie = `next-intl-locale=${newLocale}; ${cookieOptions}`;
    
    // Use startTransition for smooth transition without blocking UI
    startTransition(() => {
      // Update the URL with the new locale using push to ensure proper navigation
      // pathname from usePathname() already has locale prefix removed, so we need to add it
      router.push(pathname, { locale: newLocale as any });
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both button and dropdown menu
      if (
        buttonRef.current && 
        !buttonRef.current.contains(target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    // Use capture phase to catch clicks early
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  return (
    <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50 relative">
      <label className="block text-sm font-semibold text-gray-200 mb-3">
        {t('language')}
      </label>
      <div className="relative" ref={dropdownRef}>
        {/* Custom dropdown button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-4 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 cursor-pointer transition-all hover:bg-gray-700/50 flex items-center gap-3"
        >
          {currentLanguage.FlagIcon && React.createElement(currentLanguage.FlagIcon, { className: 'w-5 h-4 flex-shrink-0' })}
          <span className="flex-1 text-left">{currentLanguage.name}</span>
          {/* Dropdown arrow */}
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

        {/* Dropdown menu - rendered via portal */}
        {isOpen && typeof document !== 'undefined' && (createPortal(
          <>
            {/* Backdrop - invisible but captures clicks outside */}
            <div
              className="fixed inset-0 z-[99998]"
              onClick={(e) => {
                // Only close if clicking directly on backdrop, not on dropdown
                if (e.target === e.currentTarget) {
                  setIsOpen(false);
                }
              }}
            />
            {/* Dropdown */}
            <div
              ref={dropdownMenuRef}
              className="fixed z-[99999] bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`
              }}
              onClick={(e) => {
                // Prevent backdrop from closing when clicking inside dropdown
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
                    onMouseDown={(e) => {
                      // Prevent backdrop from interfering
                      e.stopPropagation();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer relative z-[100000] ${
                      isActive
                        ? 'bg-purple-600/20 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {FlagComponent && React.createElement(FlagComponent, { className: 'w-5 h-4 flex-shrink-0' })}
                    <span className="flex-1 text-sm font-medium">{lang.name}</span>
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
      <p className="mt-3 text-xs text-gray-400">
        {t('languageDescription')}
      </p>
    </div>
  );
}

