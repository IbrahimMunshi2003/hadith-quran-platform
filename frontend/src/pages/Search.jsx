import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, BookOpen, AlertCircle, ArrowLeft, ArrowRight, X, ChevronDown, ChevronUp, Search as SearchIcon, Sparkles } from 'lucide-react';
import { useHadithSearch, useStats } from '../api/client';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import HadithCard from '../components/HadithCard';
import { HadithCardSkeleton } from '../components/Skeleton';
import { sortHadithsNumeric } from '../utils/hadithSort';

// All available filter keys and their Tamil labels
const FILTER_META = {
  collection: { label: 'நூல் தொகுப்பு', type: 'select' },
  book: { label: 'அதிகாரம்', type: 'text' },
  chapter: { label: 'பாடம்', type: 'text' },
  grade: { label: 'ஹதீஸ் தரம்', type: 'select' },
  narrator: { label: 'அறிவிப்பாளர்', type: 'text' },
  source: { label: 'மூலம்', type: 'text' },
  hadithNumber: { label: 'ஹதீஸ் எண்', type: 'text' },
  reference: { label: 'குறிப்பு எண்', type: 'text' },
  arabic: { label: 'அரபி', type: 'text' },
  tamil: { label: 'தமிழ்', type: 'text' },
  hasExplanation: { label: 'விளக்கம் உள்ளது', type: 'toggle' },
  featured: { label: 'சிறப்பு', type: 'toggle' },
  verified: { label: 'சரிபார்க்கப்பட்டது', type: 'toggle' },
};

const GRADE_OPTIONS = [
  { value: '', label: 'அனைத்து தரங்கள்' },
  { value: 'sahih', label: 'ஸஹீஹ் (Sahih)' },
  { value: 'hasan', label: 'ஹஸன் (Hasan)' },
  { value: 'layeef', label: 'ளயீஃப் (Dai\'f)' },
  { value: 'other', label: 'இதர செய்திகள்' },
];

const FILTER_KEYS = Object.keys(FILTER_META);

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Parse all filter values from URL
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const filters = {};
  FILTER_KEYS.forEach(key => {
    const val = searchParams.get(key);
    if (val) filters[key] = val;
  });

  // API Hooks
  const { data: statsData } = useStats();
  const { data, isLoading, isError } = useHadithSearch({
    q,
    ...filters,
    page,
    limit: 20
  });

  // Auto-expand filters panel if any advanced filter is active
  useEffect(() => {
    const hasAdvanced = FILTER_KEYS.some(k => k !== 'collection' && k !== 'grade' && searchParams.get(k));
    if (hasAdvanced) setShowAdvanced(true);
  }, []);

  const activeFilterCount = FILTER_KEYS.filter(k => searchParams.get(k)).length;

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
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    setSearchParams(params);
  };

  const removeFilter = (key) => {
    handleFilterChange(key, '');
  };

  // Build page numbers for pagination
  const totalPages = data?.totalPages || 0;
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Determine if results are relevance-sorted
  const isRelevanceSorted = data?.searchMode === 'text';

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
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-5 h-fit">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-100 font-tamil flex items-center gap-1.5 text-sm">
                  <Filter className="h-4 w-4 text-emerald-600" />
                  வடிகட்டிகள்
                  {activeFilterCount > 0 && (
                    <span className="ml-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                {activeFilterCount > 0 && (
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
                  value={filters.collection || ''}
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
                  value={filters.grade || ''}
                  onChange={(e) => handleFilterChange('grade', e.target.value)}
                  className="w-full text-sm font-tamil p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {GRADE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all text-xs font-bold font-tamil group"
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  மேம்பட்ட வடிகட்டிகள்
                </span>
                {showAdvanced 
                  ? <ChevronUp className="h-3.5 w-3.5 transition-transform" /> 
                  : <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                }
              </button>

              {/* Advanced Filter Fields (Collapsible) */}
              {showAdvanced && (
                <div className="space-y-4 pt-2 advanced-filters-enter">
                  {/* Narrator */}
                  <FilterTextInput
                    label="அறிவிப்பாளர்"
                    value={filters.narrator || ''}
                    onChange={(v) => handleFilterChange('narrator', v)}
                    placeholder="எ.கா. அபூஹுரைரா"
                  />

                  {/* Book */}
                  <FilterTextInput
                    label="அதிகாரம் (Book)"
                    value={filters.book || ''}
                    onChange={(v) => handleFilterChange('book', v)}
                    placeholder="அதிகாரம் பெயர்"
                  />

                  {/* Chapter */}
                  <FilterTextInput
                    label="பாடம் (Chapter)"
                    value={filters.chapter || ''}
                    onChange={(v) => handleFilterChange('chapter', v)}
                    placeholder="பாடம் பெயர்"
                  />

                  {/* Source */}
                  <FilterTextInput
                    label="மூலம் (Source)"
                    value={filters.source || ''}
                    onChange={(v) => handleFilterChange('source', v)}
                    placeholder="மூலம்"
                  />

                  {/* Hadith Number */}
                  <FilterTextInput
                    label="ஹதீஸ் எண்"
                    value={filters.hadithNumber || ''}
                    onChange={(v) => handleFilterChange('hadithNumber', v)}
                    placeholder="எ.கா. 240"
                  />

                  {/* Reference Number */}
                  <FilterTextInput
                    label="குறிப்பு எண் (Reference)"
                    value={filters.reference || ''}
                    onChange={(v) => handleFilterChange('reference', v)}
                    placeholder="குறிப்பு எண்"
                  />

                  {/* Arabic */}
                  <FilterTextInput
                    label="அரபி உரையில் தேடு"
                    value={filters.arabic || ''}
                    onChange={(v) => handleFilterChange('arabic', v)}
                    placeholder="أرابي..."
                    dir="rtl"
                  />

                  {/* Tamil */}
                  <FilterTextInput
                    label="தமிழ் மொழிபெயர்ப்பில் தேடு"
                    value={filters.tamil || ''}
                    onChange={(v) => handleFilterChange('tamil', v)}
                    placeholder="தமிழ் சொல்..."
                  />

                  {/* Toggle filters */}
                  <div className="flex flex-col gap-3 pt-1">
                    <FilterToggle
                      label="விளக்கம் உள்ளது"
                      active={filters.hasExplanation === 'true'}
                      onChange={(on) => handleFilterChange('hasExplanation', on ? 'true' : '')}
                    />
                    <FilterToggle
                      label="சிறப்பு (Featured)"
                      active={filters.featured === 'true'}
                      onChange={(on) => handleFilterChange('featured', on ? 'true' : '')}
                    />
                    <FilterToggle
                      label="சரிபார்க்கப்பட்டது (Verified)"
                      active={filters.verified === 'true'}
                      onChange={(on) => handleFilterChange('verified', on ? 'true' : '')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold font-tamil">செயலில்:</span>
                {FILTER_KEYS.map(key => {
                  const val = searchParams.get(key);
                  if (!val) return null;
                  const meta = FILTER_META[key];
                  const displayVal = meta.type === 'toggle' ? '' : `: ${val}`;
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold font-tamil"
                    >
                      {meta.label}{displayVal}
                      <button
                        onClick={() => removeFilter(key)}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline font-tamil"
                >
                  அனைத்தையும் நீக்கு
                </button>
              </div>
            )}

            {/* Meta Info Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold font-tamil">
              {isLoading ? (
                <span>முடிவுகளைத் தேடுகிறது...</span>
              ) : (
                <span className="flex items-center gap-2">
                  மொத்தம் <span className="text-emerald-700 dark:text-emerald-400 font-bold">{data?.total || 0}</span> முடிவுகள் காணப்படுகின்றன
                  {isRelevanceSorted && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Sparkles className="h-3 w-3" />
                      பொருத்தம் வரிசை
                    </span>
                  )}
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
                {/* Result Cards — use relevance order for text search, numeric for browse/number */}
                {(isRelevanceSorted ? (data?.results || []) : sortHadithsNumeric(data?.results || [])).map((hadith) => (
                  <HadithCard key={hadith._id} hadith={hadith} searchQuery={q} />
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 pt-4 border-t border-slate-200 dark:border-slate-800">
                    {/* Previous */}
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold flex items-center gap-1 font-tamil"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      முந்தைய
                    </button>

                    {/* Page Numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {getPageNumbers().map((p, idx) =>
                        p === '...' ? (
                          <span key={`dots-${idx}`} className="px-2 text-slate-400 dark:text-slate-500 text-xs">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all ${
                              p === page
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    {/* Mobile page indicator */}
                    <span className="sm:hidden text-xs text-slate-500 dark:text-slate-450 font-bold font-tamil px-2">
                      {page} / {totalPages}
                    </span>

                    {/* Next */}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold flex items-center gap-1 font-tamil"
                    >
                      அடுத்த
                      <ArrowRight className="h-3.5 w-3.5" />
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

/* ── Reusable Filter Sub-Components ────────────────────────── */

const FilterTextInput = ({ label, value, onChange, placeholder, dir }) => {
  const [localVal, setLocalVal] = useState(value);

  // Sync when URL-driven value changes
  useEffect(() => { setLocalVal(value); }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onChange(localVal.trim());
  };

  const handleBlur = () => {
    if (localVal.trim() !== value) {
      onChange(localVal.trim());
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-tamil block">
        {label}
      </label>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          dir={dir}
          className="w-full text-sm font-tamil p-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
        {localVal && (
          <button
            type="button"
            onClick={() => { setLocalVal(''); onChange(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>
    </div>
  );
};

const FilterToggle = ({ label, active, onChange }) => {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
      <div
        onClick={() => onChange(!active)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          active
            ? 'bg-emerald-600 dark:bg-emerald-500'
            : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            active ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className={`text-xs font-semibold font-tamil transition-colors ${
        active
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
      }`}>
        {label}
      </span>
    </label>
  );
};

export default Search;
