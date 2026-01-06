'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { userApi } from '@/lib/apiUser';
import { UserProfile, UpdateProfileRequest } from '@/types/user';
import { toast } from 'sonner';
import { ChangeEmailForm } from '@/components/profile/ChangeEmailForm';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { AvatarManager } from '@/components/profile/AvatarManager';
import { getAvatarUrl } from '@/lib/avatars';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';
import { telegramApi } from '@/lib/apiTelegram';
import { TelegramStatusResponse } from '@/types/telegram';
import { useRouter } from '@/i18n/routing';
import { FacebookIntegration } from '@/components/profile/FacebookIntegration';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const getInitials = (firstName: string, lastName: string, username: string) => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'U';
};

export default function ProfilePage() {
  const t = useTranslations('profile');
  const router = useRouter();
  // Use profile ID + timestamp for unique ID to avoid duplicates in React Strict Mode
  const [dateOfBirthId, setDateOfBirthId] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest & { username: string; firstName: string; lastName: string; phone: string; photo: string; dateOfBirth: string }>({
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    photo: '',
    dateOfBirth: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showChangeEmailForm, setShowChangeEmailForm] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [showAvatarManager, setShowAvatarManager] = useState(false);
  const [confirmAvatarClose, setConfirmAvatarClose] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusResponse['data'] | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Resolve avatar src: supports default names, dicebear ids and direct URLs
  const resolveAvatarSrc = (value?: string | null): string | undefined => getAvatarUrl(value);

  // Helper: convert MM/DD/YYYY to YYYY-MM-DD (returns undefined if invalid)
  const toIsoDate = (display: string | undefined): string | undefined => {
    if (!display) return undefined;
    const parts = display.split('/');
    if (parts.length !== 3) return undefined;
    const [mm, dd, yyyy] = parts;
    if (mm?.length !== 2 || dd?.length !== 2 || yyyy?.length !== 4) return undefined;
    // Basic sanity check
    const month = Number(mm);
    const day = Number(dd);
    const year = Number(yyyy);
    if (!month || !day || !year || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    loadProfile();
    loadTelegramStatus();
  }, []);

  const loadTelegramStatus = async () => {
    try {
      setTelegramLoading(true);
      const response = await telegramApi.getStatus();
      setTelegramStatus(response.data);
    } catch (err: any) {
      // Handle 404 error gracefully - API endpoint might not exist yet
      if (err.status === 404) {
        setTelegramStatus({ isLinked: false, notificationsEnabled: false });
      } else {
        console.error('Error loading Telegram status:', err);
        setTelegramStatus({ isLinked: false, notificationsEnabled: false });
      }
    } finally {
      setTelegramLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userApi.getProfile();
      setProfile(data);
      
      // Generate unique ID for dateOfBirth field using profile ID and timestamp
      setDateOfBirthId(`dateOfBirth-${data.id || 'profile'}-${Date.now()}`);
      
      // Set form data - handle empty strings and null values
      // Convert date from YYYY-MM-DD to MM/DD/YYYY for display
      let displayDate = '';
      if (data.dateOfBirth) {
        const dateParts = data.dateOfBirth.split('-');
        if (dateParts.length === 3) {
          displayDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
        }
      }
      
      const newFormData = {
        username: data.username || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        photo: data.photo || '',
        dateOfBirth: displayDate || ''
      };
      
      setFormData(newFormData);
    } catch (error: any) {
      toast.error(error.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('invalidPhone');
    }

    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      if (isNaN(date.getTime())) {
        newErrors.dateOfBirth = t('invalidDate');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      // Prepare data: convert empty strings to null for optional fields
      const updateData: UpdateProfileRequest = {
        username: formData.username?.trim() || undefined,
        firstName: formData.firstName?.trim() || undefined,
        lastName: formData.lastName?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        photo: formData.photo?.trim() || undefined,
        // Send ISO format (YYYY-MM-DD) built from display value
        dateOfBirth: toIsoDate(formData.dateOfBirth?.trim())
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UpdateProfileRequest] === undefined) {
          delete updateData[key as keyof UpdateProfileRequest];
        }
      });

      const updatedProfile = await userApi.updateProfile(updateData);
      setProfile(updatedProfile);
      toast.success(t('updateSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmailChangeSuccess = () => {
    // Reload page to refresh authentication context with new email
    loadProfile();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-300">{t('loading')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl p-6">
            <p className="text-gray-300 text-center">{t('loadError')}</p>
            <Button
              onClick={() => loadProfile()}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
            >
              {t('retry')}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-gray-400 mt-2">{t('description')}</p>
        </div>

        {/* Content */}
        <div className="p-6 rounded-2xl bg-[#141519] border border-gray-700/50 space-y-6">
          {/* Avatar Section with enhanced styling */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative">
                <Avatar className="w-28 h-28 mb-4 relative ring-4 ring-purple-500/30 shadow-lg shadow-purple-500/20 cursor-pointer" onClick={() => setShowAvatarManager(true)}>
                  <AvatarImage src={resolveAvatarSrc(formData.photo || profile.photo)} alt={profile.username} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white text-3xl font-bold">
                    {getInitials(formData.firstName || profile.firstName, formData.lastName || profile.lastName, formData.username || profile.username)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          

          {/* Form with improved spacing and styling */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email (read-only) */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-200">
                  {t('email')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowChangeEmailForm(true)}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-all hover:underline"
                >
                  {t('changeEmail')}
                </button>
              </div>
              <input
                type="email"
                value={profile.email ?? ''}
                disabled
                className="w-full p-3 bg-gray-800/50 text-gray-300 border border-gray-700 rounded-lg cursor-not-allowed focus:outline-none"
              />
              {profile.isEmailVerified && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-green-400 text-sm">✓</span>
                  <p className="text-xs text-green-400 font-medium">{t('emailVerified')}</p>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-200">
                  {t('password')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordForm(true)}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-all hover:underline"
                >
                  {t('changePassword')}
                </button>
              </div>
              <input
                type="password"
                value="••••••••"
                disabled
                className="w-full p-3 bg-gray-800/50 text-gray-300 border border-gray-700 rounded-lg cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* First Name */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                {t('firstName')}
              </label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder={t('enterFirstName')}
                className={`w-full p-3 bg-gray-800/50 text-white placeholder-gray-500 border rounded-lg transition-all focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-gray-800 ${
                  errors.firstName ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-700'
                }`}
              />
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{errors.firstName}</span>
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                {t('lastName')}
              </label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder={t('enterLastName')}
                className={`w-full p-3 bg-gray-800/50 text-white placeholder-gray-500 border rounded-lg transition-all focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-gray-800 ${
                  errors.lastName ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-700'
                }`}
              />
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{errors.lastName}</span>
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                {t('phone')}
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+11234567890"
                className={`w-full p-3 bg-gray-800/50 text-white placeholder-gray-500 border rounded-lg transition-all focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-gray-800 ${
                  errors.phone ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-700'
                }`}
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                {t('dateOfBirth')}
              </label>
              <input
                type="text"
                value={formData.dateOfBirth || ''}
                onChange={(e) => {
                  let value = e.target.value;
                  // Remove non-numeric characters except slashes
                  value = value.replace(/[^\d/]/g, '');
                  // Auto-format as MM/DD/YYYY
                  if (value.length > 2 && value.charAt(2) !== '/') {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                  }
                  if (value.length > 5 && value.charAt(5) !== '/') {
                    value = value.slice(0, 5) + '/' + value.slice(5);
                  }
                  // Limit to MM/DD/YYYY format (10 characters)
                  if (value.length <= 10) {
                    // Store as MM/DD/YYYY for display
                    setFormData(prev => ({ ...prev, dateOfBirth: value }));
                  }
                }}
                placeholder="MM/DD/YYYY"
                id={dateOfBirthId || `dateOfBirth-${Date.now()}`}
                className={`w-full p-3 bg-gray-800/50 text-white placeholder-gray-500 border rounded-lg transition-all focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-gray-800 ${
                  errors.dateOfBirth ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-700'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{errors.dateOfBirth}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 md:col-span-2">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white disabled:opacity-50 shadow-lg shadow-purple-500/30 transition-all"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('saving')}
                  </div>
                ) : (
                  t('saveChanges')
                )}
              </Button>
            </div>
          </form>

          {/* Integrations Section */}
          <div className="mt-6 p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">
              {t('integrations')}
            </h3>
            
            <div className="space-y-3">
              {/* Telegram Integration */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-600 rounded">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">Telegram</div>
                    {telegramLoading ? (
                      <div className="text-xs text-gray-400">{t('integrationsLoading')}</div>
                    ) : telegramStatus?.isLinked ? (
                      <div className="text-xs text-green-400">{t('integrationsConnected')}</div>
                    ) : (
                      <div className="text-xs text-gray-400">{t('integrationsNotConnected')}</div>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => router.push('/integrations/telegram')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs px-4 py-2"
                >
                  {telegramStatus?.isLinked ? t('integrationsManage') : t('integrationsConnect')}
                </Button>
              </div>

              {/* Facebook Integration */}
              <FacebookIntegration />
            </div>

          </div>
        </div>

        {/* Change Email Form Modal */}
        {profile && (
          <ChangeEmailForm
            isOpen={showChangeEmailForm}
            onClose={() => setShowChangeEmailForm(false)}
            currentEmail={profile.email}
            onSuccess={handleEmailChangeSuccess}
          />
        )}

        {/* Change Password Form Modal */}
        <ChangePasswordForm
          isOpen={showChangePasswordForm}
          onClose={() => setShowChangePasswordForm(false)}
          onSuccess={() => {
            toast.success(t('passwordChangedSuccess'));
          }}
        />

        {/* Avatar Manager Modal */}
        {showAvatarManager && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmAvatarClose(true);
            }}
          >
            <div className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">{t('changeAvatar')}</h2>
                <button
                  onClick={() => setConfirmAvatarClose(true)}
                  className="px-3 py-1 text-gray-300 hover:text-white rounded-lg hover:bg-gray-800"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <AvatarManager
                  current={profile.photo}
                  onSelect={async (value) => {
                    try {
                      const updated = await userApi.updateProfile({ photo: value as any });
                      setProfile(updated);
                      setFormData((prev) => ({ ...prev, photo: value ?? '' }));
                      toast.success('Avatar updated');
                      setShowAvatarManager(false);
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to update avatar');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <ConfirmDialog
          isOpen={confirmAvatarClose}
          onClose={() => setConfirmAvatarClose(false)}
          onConfirm={() => {
            setConfirmAvatarClose(false);
            setShowAvatarManager(false);
          }}
          title={t('discardChanges')}
          message={t('discardChangesMessage')}
          confirmText={t('discard')}
          cancelText={t('keepEditing')}
          type="warning"
        />
      </div>
    </AppLayout>
  );
}
