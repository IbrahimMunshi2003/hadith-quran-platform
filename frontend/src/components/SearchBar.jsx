import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

const SearchBar = ({ placeholder = "ஹதீஸ்கள், அறிவிப்பாளர்கள் அல்லது தலைப்புகளைத் தேடுங்கள்...", initialValue = "" }) => {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Keep input in sync with URL queries (e.g. when user navigates using back/forward buttons)
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-600 dark:focus:ring-emerald-500/10 dark:focus:border-emerald-500 transition-all shadow-sm shadow-slate-100 dark:shadow-none text-base font-tamil"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
