import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, Search, AlertCircle, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { useNarratorsList } from '../api/client';
import Layout from '../components/Layout';

const NarratorsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';

  // API Call using custom hook
  const { data, isLoading, isError } = useNarratorsList({
    page,
    limit: 48,
    search
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to page 1 on search
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-tamil flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600" />
              அறிவிப்பாளர்கள் (Hadith Narrators)
            </h2>
            <p className="text-xs text-slate-450 dark:text-slate-400 font-tamil">
              நபிகள் நாயகம் (ஸல்) அவர்களின் பொன்மொழிகளை அறிவித்த நபித்தோழர்கள் மற்றும் தாபியீன்கள்.
            </p>
          </div>

          {/* Search bar inside header */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center max-w-xs w-full">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="அறிவிப்பாளரைத் தேடு..."
              className="w-full text-xs font-tamil pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button type="submit" className="absolute right-3 text-slate-400 hover:text-emerald-700 transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Content View States */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 h-16"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-center font-tamil text-red-750 dark:text-red-400">
            அறிவிப்பாளர்களைப் பெறுவதில் சிக்கல் ஏற்பட்டது.
          </div>
        ) : data?.narrators?.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 border rounded-2xl text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-amber-550 mx-auto" />
            <h4 className="font-bold font-tamil">அறிவிப்பாளர்கள் யாரும் இல்லை</h4>
            <p className="text-xs text-slate-500 font-tamil">வேறு தேடல் சொற்களைப் பயன்படுத்தி முயற்சிக்கவும்.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Grid display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.narrators.map((n) => (
                <Link
                  key={n.name}
                  to={`/narrator/${encodeURIComponent(n.name)}`}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:border-emerald-500/25 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-150 font-tamil line-clamp-1">
                      {n.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-tamil bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md shrink-0">
                    {n.count} ஹதீஸ்
                  </span>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data?.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-350 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold flex items-center gap-1 font-tamil"
                >
                  <ArrowLeft className="h-4 w-4" />
                  முந்தைய பக்கம்
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-450 font-bold font-tamil">
                  பக்கம் {page} / {data?.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data?.totalPages}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-350 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold flex items-center gap-1 font-tamil"
                >
                  அடுத்த பக்கம்
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
};

export default NarratorsList;
