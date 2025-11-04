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
  const [socialUpLoading, setSocialUpLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userApi.getProfile();
      setProfile(data);
      
      // Set form data - handle empty strings and null values
      const newFormData = {
        username: data.username || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        photo: data.photo || '',
        dateOfBirth: data.dateOfBirth || ''
      };
      
      setFormData(newFormData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      if (isNaN(date.getTime())) {
        newErrors.dateOfBirth = 'Invalid date format';
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
        dateOfBirth: formData.dateOfBirth?.trim() || undefined
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UpdateProfileRequest] === undefined) {
          delete updateData[key as keyof UpdateProfileRequest];
        }
      });

      const updatedProfile = await userApi.updateProfile(updateData);
      setProfile(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
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

  // Social Up handler
  const handleSocialUp = async () => {
    try {
      setSocialUpLoading(true);
      const result = await userApi.updateSocialUp();
      
      // Open URL in new window
      if (result.access_url) {
        window.open(result.access_url, '_blank', 'noopener,noreferrer');
        toast.success('Connection link opened in new window. The link will be valid for 1 hour.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to get social up access URL');
    } finally {
      setSocialUpLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading profile...</p>
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
            <p className="text-gray-300 text-center">Failed to load profile</p>
            <Button
              onClick={() => loadProfile()}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
            >
              Retry
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
            User Profile
          </h1>
          <p className="text-gray-400 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Content */}
        <div className="p-6 rounded-2xl bg-[#141519] border border-gray-700/50 space-y-6">
          {/* Avatar Section with enhanced styling */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <Avatar className="w-28 h-28 mb-4 relative ring-4 ring-purple-500/30 shadow-lg shadow-purple-500/20">
                <AvatarImage src={formData.photo || profile.photo || undefined} alt={profile.username} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white text-3xl font-bold">
                  {getInitials(formData.firstName || profile.firstName, formData.lastName || profile.lastName, formData.username || profile.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Form with improved spacing and styling */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email (read-only) */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-200">
                  Email
                </label>
                <button
                  type="button"
                  onClick={() => setShowChangeEmailForm(true)}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-all hover:underline"
                >
                  Change Email
                </button>
              </div>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-3 bg-gray-800/50 text-gray-300 border border-gray-700 rounded-lg cursor-not-allowed focus:outline-none"
              />
              {profile.isEmailVerified && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-green-400 text-sm">✓</span>
                  <p className="text-xs text-green-400 font-medium">Email verified</p>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-200">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordForm(true)}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-all hover:underline"
                >
                  Change Password
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
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter first name"
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
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter last name"
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
                Phone
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
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`w-full p-3 bg-gray-800/50 text-white border rounded-lg transition-all focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-gray-800 ${
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

            {/* Photo URL */}
            <div className="p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Photo URL
              </label>
              <input
                type="url"
                value={formData.photo || ''}
                onChange={(e) => handleInputChange('photo', e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className={`w-full p-3 bg-gray-800/50 text-white placeholder-gray-500 border rounded-lg transition-all focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-gray-800 ${
                  errors.photo ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-700'
                }`}
              />
              {errors.photo && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{errors.photo}</span>
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
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>

          {/* Social Up Section */}
          <div className="mt-6 p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 mb-1">
                  Connect Social Media Accounts
                </h3>
                <p className="text-xs text-gray-400">
                  Connect your social media accounts for automated posting
                </p>
              </div>
              <Button
                type="button"
                onClick={handleSocialUp}
                disabled={socialUpLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white disabled:opacity-50 shadow-lg shadow-purple-500/30 transition-all px-6"
              >
                {socialUpLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </div>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
            <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-xs text-yellow-300 flex items-center gap-2">
                <span>⚠️</span>
                <span>The connection link will be valid for 1 hour only. Please complete the connection process within this time.</span>
              </p>
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
            toast.success('Password changed successfully');
          }}
        />
      </div>
    </AppLayout>
  );
}

