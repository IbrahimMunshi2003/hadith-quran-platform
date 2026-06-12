import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Share2, Check, BookOpen, User } from 'lucide-react';
import GradeBadge from './GradeBadge';

// Helper to escape regex special characters
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper function to highlight search terms
export const highlightText = (text, query) => {
  if (!text) return '';
  if (!query || typeof query !== 'string' || !query.trim()) return text;

  // Split query into words to highlight each word
  const words = query.trim().split(/\s+/).filter(word => word.length > 1);
  if (words.length === 0) return text;

  try {
    const escapedWords = words.map(w => escapeRegExp(w)).join('|');
    const regex = new RegExp(`(${escapedWords})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-amber-100 dark:bg-amber-950/80 dark:text-amber-200 text-amber-900 rounded-sm px-0.5 font-semibold">
          {part}
        </mark>
      ) : part
    );
  } catch (e) {
    return text;
  }
};

const HadithCard = ({ hadith, searchQuery = "" }) => {
  const [copied, setCopied] = useState(false);

  const {
    _id,
    hadithNumber,
    collectionSlug,
    collectionName,
    arabicText,
    tamilTranslation,
    bookName,
    chapterName,
    grade,
    gradeSlug,
    narrator,
    originalUrl,
    detailedExplanationUrl,
    detailedExplanationTitle,
    hasDetailedExplanation
  } = hadith;

  const handleCopy = async () => {
    try {
      const textToCopy = `ஹதீஸ் எண்: ${hadithNumber} (${collectionName})
அறிவிப்பாளர்: ${narrator || 'குறிப்பிடப்படவில்லை'}
தரம்: ${grade || 'இல்லை'}
${hasDetailedExplanation && detailedExplanationUrl ? `விளக்கம்: ${detailedExplanationUrl}\n` : ''}
அரபி உரை:
${arabicText || ''}

தமிழ் மொழிபெயர்ப்பு:
${tamilTranslation || ''}

மூலம்: ${window.location.origin}/hadith/${collectionSlug}/${hadithNumber}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy hadith:', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${collectionName} - ஹதீஸ் ${hadithNumber}`,
      text: `${narrator ? narrator + ' அறிவிக்கிறார்கள்: ' : ''}${tamilTranslation.substring(0, 100)}...`,
      url: `${window.location.origin}/hadith/${collectionSlug}/${hadithNumber}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copy link
        await navigator.clipboard.writeText(shareData.url);
        alert('ஹதீஸ் லிங்க் நகலெடுக்கப்பட்டது!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* Header Info */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Link 
              to={`/collection/${collectionSlug}`} 
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg hover:underline transition-all"
            >
              {collectionName}
            </Link>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              # {hadithNumber}
            </span>
          </div>
          <GradeBadge grade={grade} slug={gradeSlug} />
        </div>

        {/* Narrator */}
        {narrator && (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-tamil mb-4 bg-slate-50/50 dark:bg-slate-800/30 py-1 px-2.5 rounded-lg w-fit">
            <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">அறிவிப்பாளர்:</span>
            <Link to={`/narrator/${encodeURIComponent(narrator)}`} className="text-emerald-700 dark:text-emerald-400 hover:underline">
              {highlightText(narrator, searchQuery)}
            </Link>
          </div>
        )}

        {/* Arabic Text (Right-aligned, custom style) */}
        {arabicText && (
          <div className="arabic-text text-xl md:text-2xl text-slate-800 dark:text-slate-100 mb-6 mt-2 font-arabic tracking-wide select-all" lang="ar" dir="rtl">
            {arabicText}
          </div>
        )}

        {/* Tamil Translation (Left-aligned, custom style) */}
        {tamilTranslation && (
          <div className="tamil-text text-slate-700 dark:text-slate-200 mb-6 font-tamil text-[15px] leading-relaxed select-text">
            {highlightText(tamilTranslation, searchQuery)}
          </div>
        )}

        {/* Metadata (Book & Chapter) */}
        {(bookName || chapterName) && (
          <div className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/30 mb-4">
            {bookName && (
              <div className="flex items-start gap-1">
                <BookOpen className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
                <span><span className="font-semibold text-slate-600 dark:text-slate-300">அதிகாரம்:</span> {bookName}</span>
              </div>
            )}
            {chapterName && (
              <div className="flex items-start gap-1">
                <div className="w-3.5 h-3.5 shrink-0 bg-slate-400/20 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">C</div>
                <span><span className="font-semibold text-slate-600 dark:text-slate-300">பாடம்:</span> {chapterName}</span>
              </div>
            )}
          </div>
        )}

        {hasDetailedExplanation && detailedExplanationUrl && (
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-805 flex flex-col gap-1.5">
            <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold font-tamil">
              ஹதீஸ் தரம்: {grade || 'Da\'if'}
            </span>
            <a
              href={detailedExplanationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 w-fit text-xs font-bold text-amber-700 dark:text-amber-450 hover:text-amber-800 dark:hover:text-amber-350 transition-colors font-tamil"
            >
              [ விரிவான விவரம் &rarr; ]
            </a>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-850">
        {/* <Link 
          to={`/hadith/${collectionSlug}/${hadithNumber}`}
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
        >
          விவரம் &rarr;
        </Link> */}

        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="நகலெடு"
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all focus:outline-none"
          >
            {copied ? (
              <Check className="h-4.5 w-4.5 text-emerald-600" />
            ) : (
              <Copy className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            title="பகிர்க"
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all focus:outline-none"
          >
            <Share2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HadithCard;
