'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { facebookApi } from '@/lib/apiFacebook';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FacebookLoginButtonProps {
  variant?: 'login' | 'link';
  className?: string;
  fullWidth?: boolean;
}

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M22 12.073C22 6.505 17.523 2 12 2S2 6.505 2 12.073c0 5.024 3.657 9.19 8.438 9.927v-7.027H7.898v-2.9h2.54V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.48h-1.26c-1.243 0-1.63.777-1.63 1.573v1.888h2.773l-.443 2.9h-2.33V22c4.78-.737 8.437-4.903 8.437-9.927Z" />
  </svg>
);

export const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  variant = 'login',
  className,
  fullWidth = true
}) => {
  const t = useTranslations('auth');
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    try {
      setLoading(true);
      const url = facebookApi.getAuthUrl(variant === 'link');
      window.location.href = url;
    } catch (error: any) {
      setLoading(false);
      console.error('[FacebookLoginButton] error', error);
      const message = error?.message || t('facebookDisabled');
      toast.error(message);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'bg-[#1877F2] hover:bg-[#0f5dc0] text-white flex items-center gap-2',
        fullWidth ? 'w-full justify-center' : 'justify-center',
        className
      )}
    >
      <FacebookIcon className="w-5 h-5" />
      <span>{variant === 'login' ? t('continueWithFacebook') : t('profile.facebookConnect')}</span>
    </Button>
  );
};

