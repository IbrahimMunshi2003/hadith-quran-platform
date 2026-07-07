import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminLogin } from '../../api/adminClient';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: adminLogin,
    onSuccess: (data) => {
      // With httpOnly cookies, we don't need to manually store a token here
      // The cookie is automatically set by the browser from the Set-Cookie header.
      queryClient.setQueryData(['admin-me'], { user: data.user });
      const redirectTo = location.state?.from || '/admin';
      navigate(redirectTo, { replace: true });
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Login failed.');
    }
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(form);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-100 to-emerald-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-lg space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-bold">Admin CMS</p>
          <h1 className="text-2xl font-bold mt-1">Sign in</h1>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Username</label>
          <input
            required
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Password</label>
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {error ? <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-lg border border-rose-200 dark:border-rose-800">{error}</div> : null}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 transition-colors"
        >
          {loginMutation.isPending ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
