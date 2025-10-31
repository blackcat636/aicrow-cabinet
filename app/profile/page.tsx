'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/icons';
import { userApi } from '@/lib/apiUser';
import { UserProfile, UpdateProfileRequest } from '@/types/user';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
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
  const router = useRouter();
  const { user: authUser } = useAuth();
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

    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    }

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

  const handleClose = () => {
    router.back();
  };

  const handleEmailChangeSuccess = () => {
    // Reload page to refresh authentication context with new email
    window.location.reload();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl p-6">
            <p className="text-gray-300 text-center">Failed to load profile</p>
            <Button
              onClick={handleClose}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
            >
              Close
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Modal-like overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-xl max-w-2xl w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-2xl font-semibold text-white">User Profile</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={formData.photo || profile.photo || undefined} alt={profile.username} />
                <AvatarFallback className="bg-purple-600 text-white text-2xl">
                  {getInitials(formData.firstName || profile.firstName, formData.lastName || profile.lastName, formData.username || profile.username)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowChangeEmailForm(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Change Email
                  </button>
                </div>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full p-3 bg-gray-800 text-gray-400 border border-gray-600 rounded-lg cursor-not-allowed"
                />
                {profile.isEmailVerified && (
                  <p className="mt-1 text-xs text-green-400">✓ Email verified</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordForm(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
                <input
                  type="password"
                  value="••••••••"
                  disabled
                  className="w-full p-3 bg-gray-800 text-gray-400 border border-gray-600 rounded-lg cursor-not-allowed"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter username"
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+11234567890"
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full p-3 bg-gray-800 text-white border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={formData.photo || ''}
                  onChange={(e) => handleInputChange('photo', e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.photo ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.photo && (
                  <p className="mt-1 text-sm text-red-400">{errors.photo}</p>
                )}
              </div>

              {/* Additional Info (read-only) */}
              {profile.referralCode && (
                <div className="pt-4 border-t border-gray-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Referral Code:</span>
                    <span className="text-white">{profile.referralCode}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
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
    </AppLayout>
  );
}

