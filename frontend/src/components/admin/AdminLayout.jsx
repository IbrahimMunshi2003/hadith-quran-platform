import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpenText, LogOut, User } from 'lucide-react';
import DarkModeToggle from '../DarkModeToggle';
import { adminLogout, clearAdminToken } from '../../api/adminClient';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/hadiths', label: 'Hadiths', icon: BookOpenText },
  { to: '/admin/profile', label: 'Profile', icon: User }
];

const AdminLayout = ({ title, subtitle, children }) => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await adminLogout();
    } catch (e) {
      console.error('Logout failed', e);
    }
    clearAdminToken(); // Clear fallback localStorage just in case
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-screen">
        <aside className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-bold">Admin CMS</p>
            <h1 className="text-xl font-bold mt-1">Hadith Platform</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <DarkModeToggle />
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">
          <header className="mb-6">
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle ? <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p> : null}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
