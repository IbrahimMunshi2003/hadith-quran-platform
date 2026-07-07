import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, BookOpen, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useHadithSearch, useStats } from '../api/client';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import HadithCard from '../components/HadithCard';
import { HadithCardSkeleton } from '../components/Skeleton';
import { sortHadithsNumeric } from '../utils/hadithSort';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const collection = searchParams.get('collection') || '';
  const grade = searchParams.get('grade') || '';

  // API Hooks
  const { data: statsData } = useStats();
  const { data, isLoading, isError } = useHadithSearch({
    q,
    collection,
    grade,
    page,
    limit: 20
  });

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({ q });
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Search header area */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-tamil">
            தேடல் முடிவுகள் (Global Search)
          </h2>
          <div className="max-w-3xl">
            <SearchBar initialValue={q} />
          </div>
        </div>

        {/* Search Layout Grid: Left Sidebar (Filters), Right Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Panel */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-6 h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-100 font-tamil flex items-center gap-1.5 text-sm">
                <Filter className="h-4 w-4 text-emerald-600" />
                வடிகட்டிகள்
              </span>
              {(collection || grade) && (
                <button 
                  onClick={clearFilters}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline font-tamil"
                >
                  நீக்கு
                </button>
              )}
            </div>

            {/* Collection Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-tamil block">
                நூல் தொகுப்பு
              </label>
              <select
                value={collection}
                onChange={(e) => handleFilterChange('collection', e.target.value)}
                className="w-full text-sm font-tamil p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">அனைத்துத் தொகுப்புகள்</option>
                {statsData?.collections?.map((col) => (
                  <option key={col.slug} value={col.slug}>
                    {col.name} ({col.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-tamil block">
                ஹதீஸ் தரம் (Grade)
              </label>
              <select
                value={grade}
                onChange={(e) => handleFilterChange('grade', e.target.value)}
                className="w-full text-sm font-tamil p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">அனைத்து தரங்கள்</option>
                <option value="sahih">ஸஹீஹ் (Sahih)</option>
                <option value="hasan">ஹஸன் (Hasan)</option>
                <option value="layeef">ளயீஃப் (Dai'f)</option>
                <option value="other">இதர செய்திகள்</option>
              </select>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Meta Info Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold font-tamil">
              {isLoading ? (
                <span>முடிவுகளைத் தேடுகிறது...</span>
              ) : (
                <span>
                  மொத்தம் <span className="text-emerald-700 dark:text-emerald-400 font-bold">{data?.total || 0}</span> முடிவுகள் காணப்படுகின்றன
                </span>
              )}
              {q && (
                <span className="italic">Query: "{q}"</span>
              )}
            </div>

            {/* Loading / Results / Error States */}
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((n) => (
                  <HadithCardSkeleton key={n} />
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <p className="font-semibold text-red-700 dark:text-red-400 font-tamil">தேடுவதில் பிழை ஏற்பட்டது.</p>
              </div>
            ) : data?.results?.length === 0 ? (
              <div className="p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-center space-y-4">
                <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 mx-auto">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 font-tamil">ஹதீஸ்கள் எதுவும் கிடைக்கவில்லை</h4>
                  <p className="text-sm text-slate-550 dark:text-slate-400 font-tamil max-w-sm mx-auto">
                    வித்தியாசமான சொற்களைப் பயன்படுத்தியோ, அல்லது வடிகட்டிகளை நீக்கியோ மீண்டும் தேட முயற்சிக்கவும்.
                  </p>
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl transition-colors font-tamil"
                >
                  வடிகட்டிகளை நீக்கு
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Result Cards */}
                {sortHadithsNumeric(data?.results || []).map((hadith) => (
                  <HadithCard key={hadith._id} hadith={hadith} searchQuery={q} />
                ))}

                {/* Pagination Controls */}
                {data?.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold flex items-center gap-1 font-tamil"
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
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold flex items-center gap-1 font-tamil"
                    >
                      அடுத்த பக்கம்
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Search;
