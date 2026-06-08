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
  const [activeTab, setActiveTab] = useState('hadith');

  // Fetch hadith detail (includes prev and next pointers)
  const { data, isLoading, isError } = useHadithDetail({ collection, number });
  const hadith = data?.hadith;
  const explanation = data?.explanation;

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
            {/* ------------  Tabs  ------------ */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('hadith')}
                className={`px-4 py-2 font-bold font-tamil rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === 'hadith'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                ஹதீஸ் (Hadith)
              </button>
              <button
                onClick={() => setActiveTab('explanation')}
                className={`px-4 py-2 font-bold font-tamil rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === 'explanation'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                விளக்கம் (Explanation)
              </button>
            </div>

            {/* ------------  Hadith detail card (article)  ------------ */}
            <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {activeTab === 'hadith' && (
                <>
                  {/* Card header, narrator, Arabic, Tamil, metadata … */}
                  …
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold font-tamil">
                      ஹதீஸின் தரம்: <span className="text-emerald-700 dark:text-emerald-400">{hadith.grade || "இல்லை"}</span>
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab('explanation');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1 w-fit text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-tamil bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg"
                    >
                      {hadith.grade?.includes("Da'if") || hadith.grade?.includes("ளயீஃப்") || hadith.grade?.includes("பலவீன") ? "[ ஏன் ளயீஃப்? ]" : "[ விவரம் ]"}
                    </button>
                  </div>
                </>
              )}
              {activeTab === 'explanation' && (
                <div className="space-y-8 font-tamil">
                  {data?.explanationAvailable ? (
                    <>
                      {explanation?.gradingExplanation?.tamil && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
                            தர விளக்கம் (Grading Explanation)
                          </h2>
                          <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {explanation.gradingExplanation.tamil}
                          </div>
                        </div>
                      )}

                      {explanation?.narratorAnalysis?.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
                            அறிவிப்பாளர் ஆய்வு (Narrator Analysis)
                          </h2>
                          <div className="space-y-4">
                            {explanation.narratorAnalysis.map((na, i) => (
                              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-2">{na.name}</span>
                                <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
                                  {na.opinions.map((op, j) => (
                                    <li key={j}>{op}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {explanation?.gradingExplanation?.sourcesReferenced?.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
                            மேற்கோள்கள் (References)
                          </h2>
                          <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
                            {explanation.gradingExplanation.sourcesReferenced.map((src, idx) => (
                              <li key={idx}>{src}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : data?.externalExplanationUrl ? (
                    <div className="p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-center space-y-5">
                      <p className="text-lg text-amber-800 dark:text-amber-200 font-bold font-tamil leading-relaxed">
                        இந்த ஹதீஸிற்கான தர விளக்கம் மற்றும் அறிவிப்பாளர் ஆய்வு மூல தளத்தில் உள்ளது.
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" /> 
                        Detailed grading explanation not yet imported.
                      </p>
                      <a
                        href={data.externalExplanationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-sm hover:shadow font-bold font-tamil mt-2"
                      >
                        விரிவான விளக்கத்தை காண <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-center space-y-4">
                      <p className="text-slate-600 dark:text-slate-400 font-medium italic font-tamil">
                        இந்த ஹதீஸிற்கான தர விளக்கம் தற்போது கிடைக்கவில்லை.
                      </p>
                      {hadith.originalUrl && (
                        <div className="pt-4 flex flex-col items-center gap-4">
                          <p className="text-sm text-slate-500 font-tamil">முழு தர விளக்கத்தை மூல தளத்தில் பார்க்கலாம்.</p>
                          <a
                            href={hadith.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors font-bold text-sm"
                          >
                            Open Original Source <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
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

            {/* Footer Detailed Explanation removed as logic is now in Explanation tab */}

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
