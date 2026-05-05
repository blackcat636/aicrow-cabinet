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
// import { FacebookIntegration } from '@/components/profile/FacebookIntegration'; // Facebook auth disabled
import { ExternalServicesIntegration } from '@/components/profile/ExternalServicesIntegration';
import { CalendarDetailedIcon, ChevronLeftIcon } from '@/components/icons';
import { PageLoader } from '@/components/ui/PageLoader';

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
  const tCommon = useTranslations('common');
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
  const [nameEditor, setNameEditor] = useState<{ field: 'firstName' | 'lastName' | 'phone' | 'dateOfBirth'; value: string } | null>(null);

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

  const formatDateOfBirthForRow = (value?: string) => {
    if (!value) return '—';
    const parts = value.split('/');
    if (parts.length !== 3) return value;
    const [mm, dd, yyyy] = parts;
    if (!mm || !dd || !yyyy) return value;
    return `${dd}.${mm}.${yyyy}`;
  };

  const formatIsoToDot = (iso?: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const [yyyy, mm, dd] = parts;
    if (!yyyy || !mm || !dd) return iso;
    return `${dd}.${mm}.${yyyy}`;
  };

  const fromIsoDateToDisplay = (iso?: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const [yyyy, mm, dd] = parts;
    if (!yyyy || !mm || !dd) return iso;
    return `${mm}/${dd}/${yyyy}`;
  };

  const openNameEditor = (field: 'firstName' | 'lastName' | 'phone' | 'dateOfBirth') => {
    if (field === 'dateOfBirth') {
      setNameEditor({ field, value: toIsoDate(formData.dateOfBirth) || '' });
      return;
    }
    setNameEditor({ field, value: formData[field] || '' });
  };

  const closeNameEditor = () => {
    if (submitting) return;
    setNameEditor(null);
  };

  const saveNameEditor = async () => {
    if (!nameEditor) return;
    const value = nameEditor.value.trim();
    const field = nameEditor.field;
    try {
      setSubmitting(true);
      const updateData: UpdateProfileRequest = {};
      if (field === 'dateOfBirth') {
        updateData.dateOfBirth = value || undefined;
      } else {
        (updateData as any)[field] = value || undefined;
      }

      const updatedProfile = await userApi.updateProfile(updateData);
      setProfile(updatedProfile);
      setFormData((prev) => ({
        ...prev,
        [field]: field === 'dateOfBirth' ? fromIsoDateToDisplay(value) : value
      }));
      toast.success(t('updateSuccess'));
      setNameEditor(null);
    } catch (error: any) {
      toast.error(error.message || t('updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader label={tCommon('loading')} />;
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
      <div className="mx-auto max-w-[1260px]">
        <div className="mb-6">
          <h1 className="text-[32px] leading-[1.4] tracking-[0.64px] font-semibold text-[var(--color-secondary-10)]">
            {t('title')}
          </h1>
          <p className="mt-1 text-[16px] leading-[1.4] tracking-[0.32px] text-[var(--color-secondary-6)]">
            {t('description')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="min-h-[138px] md:min-h-[74px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div className="min-w-0 w-full">
              <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">{t('email')}</p>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)] truncate">{profile.email || '—'}</p>
            </div>
            <Button
              type="button"
              onClick={() => setShowChangeEmailForm(true)}
              className="min-h-12 h-auto w-full md:w-[211px] py-2 rounded-[10px] border border-[var(--color-main)] bg-transparent px-3 text-center text-[16px] leading-[1.2] tracking-[0.32px] font-semibold whitespace-normal text-[var(--color-main)] hover:bg-transparent"
            >
              {t('changeEmail')}
            </Button>
          </div>

          <div className="min-h-[138px] md:min-h-[74px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div className="min-w-0 w-full">
              <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">{t('password')}</p>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)]">*************</p>
            </div>
            <Button
              type="button"
              onClick={() => setShowChangePasswordForm(true)}
              className="min-h-12 h-auto w-full md:w-[211px] py-2 rounded-[10px] border border-[var(--color-main)] bg-transparent px-3 text-center text-[16px] leading-[1.2] tracking-[0.32px] font-semibold whitespace-normal text-[var(--color-main)] hover:bg-transparent"
            >
              {t('changePassword')}
            </Button>
          </div>

          <div className="min-h-[138px] md:min-h-[74px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div className="min-w-0 w-full">
              <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">{t('firstName')}</p>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)]">{formData.firstName || '—'}</p>
            </div>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => openNameEditor('firstName')}
              className="min-h-12 h-auto w-full md:w-[211px] py-2 rounded-[10px] border border-[var(--color-main)] bg-transparent px-3 text-center text-[16px] leading-[1.2] tracking-[0.32px] font-semibold whitespace-normal text-[var(--color-main)] hover:bg-transparent"
            >
              {t('updateFirstName')}
            </Button>
          </div>

          <div className="min-h-[138px] md:min-h-[74px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div className="min-w-0 w-full">
              <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">{t('lastName')}</p>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)]">{formData.lastName || '—'}</p>
            </div>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => openNameEditor('lastName')}
              className="min-h-12 h-auto w-full md:w-[211px] py-2 rounded-[10px] border border-[var(--color-main)] bg-transparent px-3 text-center text-[16px] leading-[1.2] tracking-[0.32px] font-semibold whitespace-normal text-[var(--color-main)] hover:bg-transparent"
            >
              {t('updateLastName')}
            </Button>
          </div>

          <div className="min-h-[138px] md:min-h-[74px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div className="min-w-0 w-full">
              <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">{t('phoneNumber')}</p>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)]">{formData.phone || '—'}</p>
            </div>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => openNameEditor('phone')}
              className="min-h-12 h-auto w-full md:w-[211px] py-2 rounded-[10px] border border-[var(--color-main)] bg-transparent px-3 text-center text-[16px] leading-[1.2] tracking-[0.32px] font-semibold whitespace-normal text-[var(--color-main)] hover:bg-transparent"
            >
              {t('updateNumber')}
            </Button>
          </div>

          <div className="min-h-[138px] md:min-h-[74px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div className="min-w-0 w-full">
              <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">{t('dateOfBirthLabel')}</p>
              <p className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)]">{formatDateOfBirthForRow(formData.dateOfBirth)}</p>
            </div>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => openNameEditor('dateOfBirth')}
              className="min-h-12 h-auto w-full md:w-[211px] py-2 rounded-[10px] border border-[var(--color-main)] bg-transparent px-3 text-center text-[16px] leading-[1.2] tracking-[0.32px] font-semibold whitespace-normal text-[var(--color-main)] hover:bg-[var(--color-main)]/10"
            >
              {t('updateDate')}
            </Button>
          </div>

        </div>

        <div className="mt-6 p-4 rounded-[10px] bg-[var(--color-secondary-2)] border border-[var(--color-secondary-4)]">
          <h3 className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)] mb-4">
            {t('integrations')}
          </h3>

          <div className="space-y-3">
            {/* External SSO Services */}
            <div className="p-3 bg-[var(--color-secondary-2)] rounded-[10px] border border-[var(--color-secondary-4)]">
              <div className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)] mb-3">
                {t('externalServicesTitle')}
              </div>
              <ExternalServicesIntegration />
            </div>

            {/* Telegram Integration */}
            <div className="flex items-center justify-between p-3 bg-[var(--color-secondary-2)] rounded-[10px] border border-[var(--color-secondary-4)]">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-600 rounded">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">Telegram</div>
                  {telegramLoading ? (
                    <div className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)]">{t('integrationsLoading')}</div>
                  ) : telegramStatus?.isLinked ? (
                    <div className="text-[14px] leading-[1.4] tracking-[0.28px] text-green-400">{t('integrationsConnected')}</div>
                  ) : (
                    <div className="text-[14px] leading-[1.4] tracking-[0.28px] text-[var(--color-secondary-6)]">{t('integrationsNotConnected')}</div>
                  )}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => router.push('/integrations/telegram')}
                className="h-12 rounded-[10px] border border-[var(--color-main)] bg-transparent text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-main)] px-5 hover:bg-[var(--color-main)]/10"
              >
                {telegramStatus?.isLinked ? t('integrationsManage') : t('integrationsConnect')}
              </Button>
            </div>

            {/* Facebook auth disabled
            <FacebookIntegration />
            */}
          </div>
        </div>

        {/* Change Email Form Modal */}
        {nameEditor && (
          <>
            <div
              className="hidden md:fixed md:inset-0 md:z-50 md:bg-black/80 md:flex md:items-center md:justify-center md:p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeNameEditor();
              }}
            >
              <div className="w-full max-w-[595px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] overflow-hidden">
                <div className="h-[66px] bg-[var(--color-secondary-3)] border-b border-[var(--color-secondary-4)] px-8 flex items-center justify-between">
                  <p className="text-[14px] leading-[1.4] tracking-[0.28px] font-semibold text-[var(--color-secondary-10)] uppercase">
                    {nameEditor.field === 'firstName'
                      ? t('updateFirstName')
                      : nameEditor.field === 'lastName'
                      ? t('updateLastName')
                      : nameEditor.field === 'phone'
                      ? t('updateNumber')
                      : t('updateDate')}
                  </p>
                  <button
                    type="button"
                    onClick={closeNameEditor}
                    className="h-8 w-8 rounded-full border border-[var(--color-secondary-5)] text-[var(--color-secondary-10)] flex items-center justify-center text-[18px] leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="px-8 py-6">
                  <label className="block text-[28px] mb-3 leading-[1.2] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]">
                    {nameEditor.field === 'firstName'
                      ? t('firstName')
                      : nameEditor.field === 'lastName'
                      ? t('lastName')
                      : nameEditor.field === 'phone'
                      ? t('phoneNumber')
                      : t('dateOfBirthLabel')}
                  </label>
                  {nameEditor.field === 'dateOfBirth' ? (
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={formatIsoToDot(nameEditor.value)}
                        className="w-full h-[48px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] pl-4 pr-12 text-[32px] leading-[1.2] font-normal text-[var(--color-secondary-10)] focus:outline-none"
                      />
                      <label className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-secondary-10)] cursor-pointer">
                        <input
                          type="date"
                          value={nameEditor.value}
                          onChange={(e) => setNameEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                          className="absolute inset-0 opacity-0 w-6 h-6 cursor-pointer"
                          aria-label="Open calendar"
                        />
                        <CalendarDetailedIcon className="h-6 w-6" />
                      </label>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={nameEditor.value}
                      onChange={(e) => setNameEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                      className="w-full h-[48px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] px-4 text-[32px] leading-[1.2] font-normal text-[var(--color-secondary-10)] focus:outline-none"
                    />
                  )}
                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      type="button"
                      onClick={closeNameEditor}
                      className="h-12 px-5 rounded-[10px] border border-[var(--color-secondary-4)] bg-transparent text-[var(--color-secondary-10)] hover:bg-transparent"
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={saveNameEditor}
                      className="h-12 px-5 rounded-[10px] border border-[var(--color-main)] bg-transparent text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-main)] hover:bg-[var(--color-main)]/10"
                    >
                      {nameEditor.field === 'firstName'
                        ? t('updateFirstName')
                        : nameEditor.field === 'lastName'
                        ? t('updateLastName')
                        : nameEditor.field === 'phone'
                        ? t('updateNumber')
                        : t('updateDate')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="fixed md:hidden inset-x-0 top-[71px] bottom-0 z-[70] bg-[var(--color-secondary-1)] overflow-y-auto px-4 pt-6 pb-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeNameEditor}
                  className="h-8 w-8 rounded-full border border-[var(--color-secondary-5)] flex items-center justify-center text-[var(--color-secondary-10)]"
                  aria-label="Back"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <p className="text-[14px] leading-[1.4] tracking-[0.28px] font-semibold uppercase text-[var(--color-secondary-10)]">
                  {nameEditor.field === 'firstName'
                    ? t('updateFirstName')
                    : nameEditor.field === 'lastName'
                    ? t('updateLastName')
                    : nameEditor.field === 'phone'
                    ? t('updateNumber')
                    : t('updateDate')}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block text-[14px] leading-[1.4] tracking-[0.28px] font-semibold text-[var(--color-secondary-10)]">
                  {nameEditor.field === 'firstName'
                    ? t('firstName')
                    : nameEditor.field === 'lastName'
                    ? t('lastName')
                    : nameEditor.field === 'phone'
                    ? t('phoneNumber')
                    : t('dateOfBirthLabel')}
                </label>

                {nameEditor.field === 'dateOfBirth' ? (
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={formatIsoToDot(nameEditor.value)}
                      className="w-full h-12 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] pl-4 pr-12 text-[16px] leading-[1.4] tracking-[0.32px] font-medium text-[var(--color-secondary-10)] focus:outline-none"
                    />
                    <label className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-secondary-10)] cursor-pointer">
                      <input
                        type="date"
                        value={nameEditor.value}
                        onChange={(e) => setNameEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                        className="absolute inset-0 opacity-0 w-6 h-6 cursor-pointer"
                        aria-label="Open calendar"
                      />
                      <CalendarDetailedIcon className="h-5 w-5" />
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={nameEditor.value}
                    onChange={(e) => setNameEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                    className="w-full h-12 rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] px-4 text-[16px] leading-[1.4] tracking-[0.32px] font-medium text-[var(--color-secondary-10)] focus:outline-none"
                  />
                )}

                <div className="h-px bg-[var(--color-secondary-4)] mt-4" />

                <Button
                  type="button"
                  disabled={submitting}
                  onClick={saveNameEditor}
                  className="w-full h-12 rounded-[10px] bg-[var(--color-main)] text-[var(--color-secondary-10)] text-[16px] leading-[1.4] tracking-[0.32px] font-semibold"
                >
                  {t('update')}
                </Button>
                <Button
                  type="button"
                  onClick={closeNameEditor}
                  className="w-full h-12 rounded-[10px] border border-[var(--color-main)] bg-transparent text-[var(--color-main)] text-[16px] leading-[1.4] tracking-[0.32px] font-semibold hover:bg-transparent"
                >
                  {t('discard')}
                </Button>
              </div>
            </div>
          </>
        )}

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
