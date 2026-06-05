import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Compass, Users, Menu, X, Search } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import SearchBar from './SearchBar';

const Layout = ({ children, hideHeaderSearch = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 dark:from-emerald-700 dark:to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-all">
                  <BookOpen className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 font-sans leading-tight">
                    ஹதீஸ் தளம்
                  </h1>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-tamil">
                    TAMIL HADITH PLATFORM
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-slate-350 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`
                }
              >
                <Compass className="h-4.5 w-4.5" />
                முகப்பு
              </NavLink>
              <NavLink
                to="/collections"
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-slate-350 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`
                }
              >
                <BookOpen className="h-4.5 w-4.5" />
                தொகுப்புகள்
              </NavLink>
              <NavLink
                to="/narrators"
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-slate-350 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`
                }
              >
                <Users className="h-4.5 w-4.5" />
                அறிவிப்பாளர்கள்
              </NavLink>
            </nav>

            {/* Middle Search bar for Header (Hidden on Home page, visible when scrolled or on other pages) */}
            {!hideHeaderSearch && (
              <div className="hidden lg:block flex-1 max-w-md">
                <SearchBar placeholder="ஹதீஸைத் தேடுங்கள்..." />
              </div>
            )}

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              
              {/* Mobile menu trigger */}
              <button
                onClick={toggleMobileMenu}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 md:hidden transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-950/20 dark:bg-slate-950/50 backdrop-blur-sm pt-16">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6 space-y-4">
            <nav className="flex flex-col gap-4">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800"
              >
                <Compass className="h-5 w-5" />
                முகப்பு (Home)
              </NavLink>
              <NavLink
                to="/collections"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800"
              >
                <BookOpen className="h-5 w-5" />
                ஹதீஸ் தொகுப்புகள் (Collections)
              </NavLink>
              <NavLink
                to="/narrators"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800"
              >
                <Users className="h-5 w-5" />
                அறிவிப்பாளர்கள் (Narrators)
              </NavLink>
            </nav>
            <div className="pt-2">
              <SearchBar placeholder="தேடுக..." />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                  📖
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">ஹதீஸ் தளம்</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-450 font-tamil leading-relaxed">
                தமிழ் பேசும் உலகளாவிய முஸ்லிம்களுக்காக நம்பகமான, தரம் பிரிக்கப்பட்ட ஹதீஸ்கள் மற்றும் குர்ஆன் தகவல்களை எளிதாகத் தேடவும், கற்கவும் வடிவமைக்கப்பட்ட தளம்.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 text-sm">விரைவு இணைப்புகள்</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400 font-tamil">
                <li><Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">முகப்பு</Link></li>
                <li><Link to="/collections" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">அனைத்துத் தொகுப்புகள்</Link></li>
                <li><Link to="/narrators" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">அறிவிப்பாளர்கள் பட்டியல்</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 text-sm">தரங்கள் (Hadith Grades)</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">ஸஹீஹ் (Sahih) - நம்பகமானது</span>
                <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-450 border border-blue-200 dark:border-blue-900/40">ஹஸன் (Hasan) - நல்ல செய்தி</span>
                <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-200 dark:border-amber-900/40 font-tamil">ளயீஃப் (Dai'f) - பலவீனமானது</span>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-850 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500 font-tamil">
            <p>&copy; {new Date().getFullYear()} தமிழ் ஹதீஸ் தளம். All rights reserved.</p>
            <p>Hadith data from authentic books of Bukhari, Muslim, and Sunan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
