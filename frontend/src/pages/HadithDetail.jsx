import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Copy, Share2, Check, ExternalLink, ChevronLeft, ChevronRight, BookOpen, AlertCircle, ArrowLeft, Tag, Hash, Calendar, Bookmark, Info, Star, ShieldCheck, EyeOff } from 'lucide-react';
import { useHadithDetail, useRelatedHadiths } from '../api/client';
import Layout from '../components/Layout';
import GradeBadge from '../components/GradeBadge';
import { HadithCardSkeleton } from '../components/Skeleton';
import DOMPurify from 'dompurify'; // For rich text safely

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
        text: `${hadith.narrator ? hadith.narrator + ' அறிவிக்கிறார்கள்: ' : ''}${hadith.tamilTranslation?.substring(0, 120)}...`,
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
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Navigation & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          {hadith && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
              <span>/</span>
              <Link to={`/collection/${hadith.collectionSlug}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold text-slate-700 dark:text-slate-200">{hadith.collectionName}</Link>
              <span>/</span>
              <span className="font-bold text-slate-900 dark:text-white">#{hadith.hadithNumber}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <HadithCardSkeleton />
        ) : isError || !hadith ? (
          <div className="p-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">Hadith not found</h2>
            <p className="text-amber-700 dark:text-amber-400">The requested hadith might have been moved or deleted.</p>
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors">Return Home</button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Status Warnings */}
            {!hadith.published && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm font-semibold">
                <EyeOff className="h-5 w-5" />
                This hadith is unpublished and only visible to admins.
              </div>
            )}

            {/* Tabs */}
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
              {(data?.explanationAvailable || data?.externalExplanationUrl || hadith.description || hadith.detailedExplanation) && (
                <button
                  onClick={() => setActiveTab('explanation')}
                  className={`px-4 py-2 font-bold font-tamil rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'explanation'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Info className="h-4 w-4" />
                  விளக்கம் (Explanation)
                </button>
              )}
            </div>

            {/* Main Article */}
            <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
              {activeTab === 'hadith' && (
                <>
                  {/* Header Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link 
                        to={`/collection/${hadith.collectionSlug}`} 
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
                      >
                        {hadith.collectionName}
                      </Link>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                        # {hadith.hadithNumber}
                      </span>
                      {hadith.featured && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-400"><Star className="h-3.5 w-3.5" /> Featured</span>}
                      {hadith.verified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400"><ShieldCheck className="h-3.5 w-3.5" /> Verified</span>}
                    </div>
                    {hadith.grade && <GradeBadge grade={hadith.grade} slug={hadith.gradeSlug} />}
                  </div>

                  {/* Narrator */}
                  {hadith.narrator && (
                    <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm md:text-base font-tamil bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">அறிவிப்பாளர்:</span>
                      <Link to={`/narrator/${encodeURIComponent(hadith.narrator)}`} className="font-bold hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors">
                        {hadith.narrator}
                      </Link>
                    </div>
                  )}

                  {/* Arabic Text */}
                  {hadith.arabicText && (
                    <div className="arabic-text text-2xl md:text-3xl text-slate-800 dark:text-slate-100 leading-relaxed font-arabic select-text" dir="rtl">
                      {hadith.arabicText}
                    </div>
                  )}

                  {/* Tamil Text */}
                  {hadith.tamilTranslation && (
                    <div className="tamil-text text-slate-700 dark:text-slate-200 text-[16px] md:text-[18px] leading-loose font-tamil select-text">
                      {hadith.tamilTranslation}
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    {(hadith.bookName || hadith.bookNo) && (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Book</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-tamil mt-1">{hadith.bookNo ? `${hadith.bookNo}. ` : ''}{hadith.bookName || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    
                    {(hadith.chapterName || hadith.chapterNo) && (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Bookmark className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Chapter</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-tamil mt-1">{hadith.chapterNo ? `${hadith.chapterNo}. ` : ''}{hadith.chapterName || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {hadith.referenceNumber && (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Hash className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Reference No</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{hadith.referenceNumber}</p>
                        </div>
                      </div>
                    )}

                    {hadith.source && (
                      <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <ExternalLink className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Source</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-tamil mt-1">{hadith.source}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags & Keywords */}
                  {(hadith.tags?.length > 0 || hadith.keywords?.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Tag className="h-4 w-4 text-slate-400 mr-2" />
                      {[...(hadith.tags || []), ...(hadith.keywords || [])].map((item, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 font-tamil">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Footer Last Updated */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium pt-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Last updated: {new Date(hadith.updatedAt).toLocaleDateString()}
                  </div>
                </>
              )}

              {activeTab === 'explanation' && (
                <div className="space-y-8 font-tamil">
                  {/* Hadith Description (Rich Text) */}
                  {hadith.description && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                        விளக்கம் (Description)
                      </h2>
                      <div 
                        className="prose dark:prose-invert prose-emerald max-w-none prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(hadith.description) }}
                      />
                    </div>
                  )}

                  {/* Hadith Detailed Explanation */}
                  {hadith.detailedExplanation && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                        {hadith.detailedExplanationTitle || 'விரிவான விளக்கம் (Detailed Explanation)'}
                      </h2>
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                        {hadith.detailedExplanation}
                      </div>
                    </div>
                  )}

                  {/* Extracted Grading/Narrator Explanations (from related collection) */}
                  {data?.explanationAvailable && (
                    <>
                      {explanation?.gradingExplanation?.tamil && (
                        <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                          <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800/50 pb-2">
                            தர விளக்கம் (Grading Explanation)
                          </h2>
                          <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                            {explanation.gradingExplanation.tamil}
                          </div>
                        </div>
                      )}

                      {explanation?.narratorAnalysis?.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                            அறிவிப்பாளர் ஆய்வு (Narrator Analysis)
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {explanation.narratorAnalysis.map((na, i) => (
                              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-3 text-lg">{na.name}</span>
                                <ul className="list-none space-y-2 text-slate-700 dark:text-slate-300 text-sm">
                                  {na.opinions.map((op, j) => (
                                    <li key={j} className="flex gap-2">
                                      <span className="text-emerald-500 mt-1">•</span>
                                      <span className="leading-relaxed">{op}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {explanation?.gradingExplanation?.sourcesReferenced?.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                            மேற்கோள்கள் (References)
                          </h2>
                          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                            {explanation.gradingExplanation.sourcesReferenced.map((src, idx) => (
                              <li key={idx}>{src}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {/* External URLs */}
                  {/* {(data?.externalExplanationUrl || hadith.originalUrl) && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium font-tamil text-center sm:text-left">
                        மேலும் விவரங்களுக்கு மூல தளத்தை பார்வையிடவும்.
                      </p>
                      <a
                        href={data.externalExplanationUrl || hadith.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 text-slate-800 dark:text-slate-200 rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow"
                      >
                        Open Source <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {(!data?.explanationAvailable && !data?.externalExplanationUrl && !hadith.description && !hadith.detailedExplanation) && (
                     <div className="p-8 text-center text-slate-500 italic font-tamil">
                        இந்த ஹதீஸிற்கான தர விளக்கம் தற்போது கிடைக்கவில்லை.
                     </div>
                  )} */}
                </div>
              )}

              {/* Action buttons (Always visible at bottom of card) */}
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 text-slate-700 dark:text-slate-300 transition-all text-xs font-bold font-tamil shadow-sm hover:shadow"
                >
                  {copied ? (
                    <>
                      <Check className="h-4.5 w-4.5 text-emerald-600" />
                      நகலெடுக்கப்பட்டது!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
                      நகலெடு (Copy)
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800 text-slate-700 dark:text-slate-300 transition-all text-xs font-bold font-tamil shadow-sm hover:shadow"
                >
                  <Share2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
                  பகிர் (Share)
                </button>
              </div>
            </article>

            {/* Pagination (Prev / Next) */}
            {(data?.prev || data?.next) && (
              <div className="flex items-center justify-between gap-4 pt-2">
                {data.prev ? (
                  <Link
                    to={`/hadith/${data.prev.collection}/${data.prev.number}`}
                    className="flex-1 flex items-center justify-start gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all group"
                  >
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
                      <ChevronLeft className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        முந்தைய ஹதீஸ்
                      </p>
                      <p className="text-sm font-bold font-tamil mt-0.5">
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
                    className="flex-1 flex items-center justify-end gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all group text-right"
                  >
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        அடுத்த ஹதீஸ்
                      </p>
                      <p className="text-sm font-bold font-tamil mt-0.5">
                        எண்: {data.next.number}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
                      <ChevronRight className="h-5 w-5 text-emerald-600" />
                    </div>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            )}

            {/* Related Hadiths */}
            <div className="space-y-4 pt-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-tamil flex items-center gap-2 px-1">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                தொடர்புடைய ஹதீஸ்கள் (Related Hadiths)
              </h3>

              {isRelatedLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((n) => (
                    <div key={n} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                    </div>
                  ))}
                </div>
              ) : relatedHadiths?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedHadiths.map((rel) => (
                    <Link
                      key={rel._id}
                      to={`/hadith/${rel.collectionSlug}/${rel.hadithNumber}`}
                      className="group p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                            {rel.collectionName}
                          </span>
                          <span className="text-slate-400 font-bold">
                            # {rel.hadithNumber}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-tamil leading-relaxed line-clamp-3">
                          {rel.tamilTranslation}
                        </p>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Hadith →
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-tamil italic px-1">
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
