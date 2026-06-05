import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, BookOpen, User, ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCollectionDetail } from '../api/client';
import Layout from '../components/Layout';
import HadithCard from '../components/HadithCard';
import { HadithCardSkeleton } from '../components/Skeleton';

const Collection = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from search query parameters
  const page = parseInt(searchParams.get('page')) || 1;
  const book = searchParams.get('book') || '';
  const chapter = searchParams.get('chapter') || '';
  const grade = searchParams.get('grade') || '';
  const narrator = searchParams.get('narrator') || '';

  // API Call using custom React Query hook
  const { data, isLoading, isError, refetch } = useCollectionDetail({
    slug,
    book,
    chapter,
    grade,
    narrator,
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
    params.set('page', '1'); // Reset to page 1 on filter modification
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  // Check if any filter is active
  const hasActiveFilters = book || chapter || grade || narrator;

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="text-xs text-slate-500 font-semibold font-tamil flex items-center gap-1.5">
          <Link to="/collections" className="hover:text-emerald-700 transition-colors">தொகுப்புகள்</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 uppercase">{slug}</span>
        </div>

        {/* Collection Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-br from-emerald-900 to-islamic-emerald text-white rounded-3xl shadow-sm border border-emerald-800/40">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-tamil">
              {isLoading ? 'ஏற்றப்படுகிறது...' : data?.collectionName}
            </h2>
            <p className="text-xs text-emerald-100 font-tamil">
              மொத்த பதிவுகள்: <span className="font-bold text-white">{data?.totalHadiths || 0}</span> ஹதீஸ்கள்
            </p>
          </div>
          <div className="text-xs font-tamil bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 w-fit">
            விளக்கம்: நம்பகமான ஆதாரப்பூர்வத் தொகுப்பு
          </div>
        </div>

        {/* Filtering & Listing Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Panel */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-6 h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-100 font-tamil flex items-center gap-1.5 text-sm">
                <Filter className="h-4 w-4 text-emerald-600" />
                தொகுப்பு வடிகட்டி
              </span>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline font-tamil"
                >
                  நீக்கு
                </button>
              )}
            </div>

            {/* Book Filter */}
            {data?.books?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-tamil block">
                  அதிகாரம் (Book)
                </label>
                <select
                  value={book}
                  onChange={(e) => handleFilterChange('book', e.target.value)}
                  className="w-full text-xs font-tamil p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">அனைத்து அதிகாரங்கள்</option>
                  {data.books.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Chapter Filter */}
            {data?.chapters?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-tamil block">
                  பாடம் (Chapter)
                </label>
                <select
                  value={chapter}
                  onChange={(e) => handleFilterChange('chapter', e.target.value)}
                  className="w-full text-xs font-tamil p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">அனைத்து பாடங்கள்</option>
                  {data.chapters.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Grade Filter */}
            {data?.grades?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-tamil block">
                  ஹதீஸ் தரம் (Grade)
                </label>
                <select
                  value={grade}
                  onChange={(e) => handleFilterChange('grade', e.target.value)}
                  className="w-full text-xs font-tamil p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">அனைத்து தரங்கள்</option>
                  {data.grades.map((g) => (
                    <option key={g.slug} value={g.slug}>{g.name} ({g.count})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Narrator Filter */}
            {data?.narrators?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-tamil block">
                  அறிவிப்பாளர்
                </label>
                <select
                  value={narrator}
                  onChange={(e) => handleFilterChange('narrator', e.target.value)}
                  className="w-full text-xs font-tamil p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">அனைத்து அறிவிப்பாளர்கள்</option>
                  {data.narrators.map((n) => (
                    <option key={n.name} value={n.name}>{n.name} ({n.count})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Hadiths Listing */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Page Count */}
            <div className="text-xs text-slate-550 dark:text-slate-400 font-semibold font-tamil">
              {isLoading ? (
                <span>ஹதீஸ்களைத் திரட்டுகிறது...</span>
              ) : (
                <span>
                  வடிகட்டப்பட்ட முடிவுகள்: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{data?.filteredHadithsCount || 0}</span> ஹதீஸ்கள்
                </span>
              )}
            </div>

            {/* Main view states */}
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((n) => <HadithCardSkeleton key={n} />)}
              </div>
            ) : isError ? (
              <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-center space-y-2">
                <ShieldAlert className="h-8 w-8 text-red-500 mx-auto" />
                <p className="font-semibold text-red-700 dark:text-red-400 font-tamil">தரவுகளைப் பெறுவதில் சிக்கல் ஏற்பட்டது.</p>
              </div>
            ) : data?.hadiths?.length === 0 ? (
              <div className="p-12 bg-white dark:bg-slate-900 border rounded-2xl text-center space-y-4">
                <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-700 mx-auto">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-805 dark:text-slate-200 font-tamil">ஹதீஸ்கள் எதுவும் இல்லை</h4>
                <p className="text-xs text-slate-500 font-tamil max-w-sm mx-auto">
                  இங்கு வடிகட்டியத் தரம் அல்லது பிரிவுக்குட்பட்ட ஹதீஸ்கள் எதுவும் கண்டறியப்படவில்லை.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl transition-colors font-tamil"
                >
                  வடிகட்டிகளை நீக்கு
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* List cards */}
                {data.hadiths.map((hadith) => (
                  <HadithCard key={hadith._id} hadith={hadith} />
                ))}

                {/* Pagination */}
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

export default Collection;
