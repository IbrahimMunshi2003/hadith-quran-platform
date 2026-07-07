import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, User, BookOpen, Hash, Layers } from 'lucide-react';
import { useSearchSuggestions } from '../api/client';

const SearchBar = ({ placeholder = "ஹதீஸ்கள், அறிவிப்பாளர்கள் அல்லது தலைப்புகளைத் தேடுங்கள்...", initialValue = "" }) => {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Keep input in sync with URL queries (e.g. when user navigates using back/forward buttons)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
  }, [searchParams]);

  // Debounce: update debouncedQuery 300ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch suggestions via React Query
  const { data: suggestions } = useSearchSuggestions(debouncedQuery);

  // Flatten suggestions into a single navigable list for keyboard support
  const flatItems = React.useMemo(() => {
    if (!suggestions) return [];
    const items = [];
    (suggestions.narrators || []).forEach(n => items.push({ type: 'narrator', label: n.name, count: n.count }));
    (suggestions.collections || []).forEach(c => items.push({ type: 'collection', label: c.name, slug: c.slug, count: c.count }));
    (suggestions.chapters || []).forEach(ch => items.push({ type: 'chapter', label: ch.name, count: ch.count }));
    (suggestions.hadithNumbers || []).forEach(h => items.push({ type: 'hadith', label: h.hadithNumber, collection: h.collectionSlug, collectionName: h.collectionName }));
    return items;
  }, [suggestions]);

  const hasSuggestions = flatItems.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = useCallback((item) => {
    setShowSuggestions(false);
    switch (item.type) {
      case 'narrator':
        navigate(`/narrator/${encodeURIComponent(item.label)}`);
        break;
      case 'collection':
        navigate(`/collection/${item.slug}`);
        break;
      case 'chapter':
        setQuery(item.label);
        navigate(`/search?q=${encodeURIComponent(item.label)}`);
        break;
      case 'hadith':
        navigate(`/hadith/${item.collection}/${item.label}`);
        break;
      default:
        setQuery(item.label);
        navigate(`/search?q=${encodeURIComponent(item.label)}`);
    }
  }, [navigate]);

  const handleKeyDown = (e) => {
    if (!showSuggestions || !hasSuggestions) {
      if (e.key === 'ArrowDown' && hasSuggestions) {
        setShowSuggestions(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % flatItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatItems.length) {
          handleSuggestionClick(flatItems[activeIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveIndex(-1);
        break;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'narrator': return <User className="h-3.5 w-3.5" />;
      case 'collection': return <Layers className="h-3.5 w-3.5" />;
      case 'chapter': return <BookOpen className="h-3.5 w-3.5" />;
      case 'hadith': return <Hash className="h-3.5 w-3.5" />;
      default: return <Search className="h-3.5 w-3.5" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'narrator': return 'அறிவிப்பாளர்';
      case 'collection': return 'தொகுப்பு';
      case 'chapter': return 'பாடம்';
      case 'hadith': return 'ஹதீஸ்';
      default: return '';
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Search className="h-5 w-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setActiveIndex(-1);
            }}
            onFocus={() => { if (hasSuggestions) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
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

      {/* Suggestions Dropdown */}
      {showSuggestions && hasSuggestions && (
        <div className="suggestions-dropdown absolute z-50 w-full mt-2 py-2 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 max-h-80 overflow-y-auto">
          {/* Group headers + items */}
          {['narrator', 'collection', 'chapter', 'hadith'].map(type => {
            const items = flatItems.filter(item => item.type === type);
            if (items.length === 0) return null;
            return (
              <div key={type}>
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 font-tamil">
                  {getTypeLabel(type)}
                </div>
                {items.map((item, idx) => {
                  const globalIdx = flatItems.indexOf(item);
                  return (
                    <button
                      key={`${type}-${idx}`}
                      onClick={() => handleSuggestionClick(item)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm font-tamil transition-colors ${
                        globalIdx === activeIndex
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className={`flex-shrink-0 ${globalIdx === activeIndex ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {getIcon(type)}
                      </span>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.count && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                          {item.count}
                        </span>
                      )}
                      {item.collectionName && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {item.collectionName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
