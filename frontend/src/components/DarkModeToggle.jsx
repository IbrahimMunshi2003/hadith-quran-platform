import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-500 animate-pulse" />
      ) : (
        <Moon className="h-5 w-5 text-emerald-800" />
      )}
    </button>
  );
};

export default DarkModeToggle;
