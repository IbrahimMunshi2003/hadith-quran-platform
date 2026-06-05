import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Copy, Share2, Check, ExternalLink, ChevronLeft, ChevronRight, BookOpen, AlertCircle, ArrowLeft } from 'lucide-react';
import { useHadithDetail, useRelatedHadiths } from '../api/client';
import Layout from '../components/Layout';
import GradeBadge from '../components/GradeBadge';
import { HadithCardSkeleton } from '../components/Skeleton';

const HadithDetail = () => {
  const { collection, number } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Fetch hadith detail (includes prev and next pointers)
  const { data, isLoading, isError } = useHadithDetail({ collection, number });
  const hadith = data?.hadith;

  // Fetch related hadiths based on the current hadith's ID
  const { data: relatedHadiths, isLoading: isRelatedLoading } = useRelatedHadiths(hadith?._id);

  const handleCopy = async () => {
    if (!hadith) return;
    try {
      const textToCopy = `ஹதீஸ் எண்: ${hadith.hadithNumber} (${hadith.collectionName})
அறிவிப்பாளர்: ${hadith.narrator || 'குறிப்பிடப்படவில்லை'}
தரம்: ${hadith.grade || 'இல்லை'}

அரபி உரை:
${hadith.arabicText || ''}

தமிழ் மொழிபெயர்ப்பு:
${hadith.tamilTranslation || ''}

மூலம்: ${window.location.href}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleShare = async () => {
    if (!hadith) return;
    try {
      const shareData = {
        title: `${hadith.collectionName} - ஹதீஸ் ${hadith.hadithNumber}`,
        text: `${hadith.narrator ? hadith.narrator + ' அறிவிக்கிறார்கள்: ' : ''}${hadith.tamilTranslation.substring(0, 120)}...`,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('லிங்க் நகலெடுக்கப்பட்டது!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Error sharing:', err);
    }
  };

  return (
    <Layout>
      {/* ----------------------------------------------------------------- */}
      {/* Outer container – one opening, one closing */}
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* -------------------  Navigation & Breadcrumb  ----------------- */}
        <div className="flex items-center justify-between gap-4">
          …
        </div>

        {/* --------------------------  Loaders  -------------------------- */}
        {isLoading ? (
          <HadithCardSkeleton />
        ) : isError || !hadith ? (
          <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-4">
            …
          </div>
        ) : (
          /* ------------------------  Main content  --------------------- */
          <div className="space-y-6">
            {/* ------------  Hadith detail card (article)  ------------ */}
            <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Card header, narrator, Arabic, Tamil, metadata … */}
              …
              {/* ---------------- Detailed Explanation block ---------------- */}
              {hadith.hasDetailedExplanation && hadith.detailedExplanationUrl && (
                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
                  <span className="text-sm text-slate-550 dark:text-slate-400 font-semibold font-tamil">
                    ஹதீஸ் தரம்: {hadith.grade || "Da'if"}
                  </span>
                  <a
                    href={hadith.detailedExplanationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 w-fit text-sm font-bold text-amber-700 dark:text-amber-450 hover:text-amber-800 dark:hover:text-amber-350 transition-colors font-tamil"
                  >
                    [ விரிவான விவரம் → ]
                  </a>
                </div>
              )}

              {/* ---------------------- Action buttons --------------------- */}
              <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-300 transition-colors text-xs font-bold font-tamil"
                >
                  {copied ? (
                    <>
                      <Check className="h-4.5 w-4.5 text-emerald-600" />
                      நகலெடுக்கப்பட்டது!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4.5 w-4.5 text-emerald-655" />
                      நகலெடு (Copy Hadith)
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-300 transition-colors text-xs font-bold font-tamil"
                >
                  <Share2 className="h-4.5 w-4.5 text-emerald-655" />
                  பகிர் (Share)
                </button>
              </div>
            </article>

            {/* ------------------- Footer: Detailed Explanation ------------------- */}
            {hadith.hasDetailedExplanation && hadith.detailedExplanationUrl && (
              <div className="p-6 bg-amber-50/40 dark:bg-slate-900/30 border border-amber-100 dark:border-slate-800 rounded-3xl space-y-4 font-tamil text-center sm:text-left">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Additional Information
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This hadith has a detailed grading analysis and scholarly explanation
                    available in the original source.
                  </p>
                </div>
                <a
                  href={hadith.detailedExplanationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Go to Original Source
                </a>
              </div>
            )}

            {/* ---------------------- Pagination (Prev / Next) ---------------------- */}
            {(data?.prev || data?.next) && (
              <div className="flex items-center justify-between gap-4 pt-2">
                {data.prev ? (
                  <Link
                    to={`/hadith/${data.prev.collection}/${data.prev.number}`}
                    className="flex-1 flex items-center justify-start gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:border-emerald-500/20 text-slate-700 dark:text-slate-300 hover:text-emerald-700 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        முந்தைய ஹதீஸ்
                      </p>
                      <p className="text-xs font-bold font-tamil">
                        எண்: {data.prev.number}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}

                {data.next ? (
                  <Link
                    to={`/hadith/${data.next.collection}/${data.next.number}`}
                    className="flex-1 flex items-center justify-end gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:border-emerald-500/20 text-slate-750 dark:text-slate-300 hover:text-emerald-700 transition-colors text-right"
                  >
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        அடுத்த ஹதீஸ்
                      </p>
                      <p className="text-xs font-bold font-tamil">
                        எண்: {data.next.number}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-emerald-600 shrink-0" />
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            )}

            {/* ------------------------ Related Hadiths ------------------------ */}
            <div className="space-y-4 pt-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-tamil flex items-center gap-1.5">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                தொடர்புடைய ஹதீஸ்கள் (Related Hadiths)
              </h3>

              {isRelatedLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((n) => (
                    <div key={n} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-5/6" />
                    </div>
                  ))}
                </div>
              ) : relatedHadiths?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedHadiths.map((rel) => (
                    <Link
                      key={rel._id}
                      to={`/hadith/${rel.collectionSlug}/${rel.hadithNumber}`}
                      className="group p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/25 transition-all duration-200 space-y-3"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                          {rel.collectionName}
                        </span>
                        <span className="text-slate-400 font-bold">
                          # {rel.hadithNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-tamil leading-relaxed line-clamp-3">
                        {rel.tamilTranslation}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-tamil italic">
                  தொடர்புடைய ஹதீஸ்கள் எதுவும் இல்லை.
                </p>
              )}
            </div>
                    </div>
        )}
      </div>
    </Layout>
  );
};

export default HadithDetail;
