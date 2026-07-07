import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, KeyRound } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminChangeUsername, adminChangePassword } from '../../api/adminClient';

const AdminProfile = () => {
  const queryClient = useQueryClient();
  
  // Change Username State
  const [usernameForm, setUsernameForm] = useState({ currentPassword: '', newUsername: '' });
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const changeUsernameMutation = useMutation({
    mutationFn: adminChangeUsername,
    onSuccess: (data) => {
      setUsernameSuccess('Username successfully updated!');
      setUsernameError('');
      setUsernameForm({ currentPassword: '', newUsername: '' });
      queryClient.setQueryData(['admin-me'], (old) => ({ ...old, user: data.user }));
    },
    onError: (err) => {
      setUsernameError(err.response?.data?.error || 'Failed to change username.');
      setUsernameSuccess('');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: adminChangePassword,
    onSuccess: () => {
      setPasswordSuccess('Password successfully updated!');
      setPasswordError('');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => {
      setPasswordError(err.response?.data?.error || 'Failed to change password.');
      setPasswordSuccess('');
    }
  });

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    if (usernameForm.newUsername.length < 4) {
      setUsernameError('New username must be at least 4 characters long.');
      return;
    }
    changeUsernameMutation.mutate(usernameForm);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  return (
    <AdminLayout title="Admin Profile" subtitle="Manage your account settings and security.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        
        {/* Change Username */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Change Username</h3>
              <p className="text-sm text-slate-500">Update your login username</p>
            </div>
          </div>

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">New Username</label>
              <input
                required
                type="text"
                value={usernameForm.newUsername}
                onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Current Password</label>
              <input
                required
                type="password"
                value={usernameForm.currentPassword}
                onChange={(e) => setUsernameForm({ ...usernameForm, currentPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {usernameError && <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-200 dark:border-rose-800">{usernameError}</div>}
            {usernameSuccess && <div className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">{usernameSuccess}</div>}

            <button
              type="submit"
              disabled={changeUsernameMutation.isPending}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              {changeUsernameMutation.isPending ? 'Saving...' : 'Update Username'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Change Password</h3>
              <p className="text-sm text-slate-500">Ensure your account is using a long, random password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Current Password</label>
              <input
                required
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">New Password</label>
              <input
                required
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input
                required
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {passwordError && <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-200 dark:border-rose-800">{passwordError}</div>}
            {passwordSuccess && <div className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">{passwordSuccess}</div>}

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
