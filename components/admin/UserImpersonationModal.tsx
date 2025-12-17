'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { authApi } from '@/lib/apiAuth';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface UserListItem {
  id: number | string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  isActive?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImpersonate: (userId: number | string, user: UserListItem) => Promise<void>;
}

export const UserImpersonationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImpersonate
}) => {
  const t = useTranslations('impersonation');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState('');
  const [submittingId, setSubmittingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await authApi.getUsersList();
        const list: UserListItem[] = data?.data || data || [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (error: any) {
        toast.error(error?.message || t('loadUsersError'));
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [isOpen]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      [u.email, u.username, u.firstName, u.lastName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [search, users]);

  const handleImpersonate = async (user: UserListItem) => {
    if (user.role === 'admin') {
      toast.error(t('cannotImpersonateAdmin'));
      return;
    }
    if (user.isActive === false) {
      toast.error(t('userInactive'));
      return;
    }
    setSubmittingId(user.id);
    try {
      await onImpersonate(user.id, user);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || t('impersonationFailed'));
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl bg-[#141519] border border-gray-700 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{t('loginMenu')}</h3>
            <p className="text-sm text-gray-400">
              {t('pickUser')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-lg bg-[#0f1014] border border-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-800 bg-[#0f1014]">
          {loading ? (
            <div className="p-8 text-center text-gray-400">{t('loading')}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">{t('notFound')}</div>
          ) : (
            <table className="min-w-full text-sm text-gray-200">
              <thead className="bg-gray-900/60 text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">{t('columnUsername')}</th>
                  <th className="px-4 py-3 text-left">{t('columnEmail')}</th>
                  <th className="px-4 py-3 text-left">{t('columnRole')}</th>
                  <th className="px-4 py-3 text-right">{t('columnAction')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const disabled = user.role === 'admin' || user.isActive === false;
                  return (
                    <tr key={user.id} className="border-t border-gray-800/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{user.username}</div>
                        <div className="text-xs text-gray-500">
                          {(user.firstName || '') + ' ' + (user.lastName || '')}
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3 capitalize">{user.role || 'user'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={disabled || submittingId === user.id}
                          onClick={() => handleImpersonate(user)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            disabled
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {submittingId === user.id ? t('processing') : t('loginMenu')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

