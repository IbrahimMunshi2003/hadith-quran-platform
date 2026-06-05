import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Archive, ShieldCheck, HelpCircle } from 'lucide-react';
import { useCollections } from '../api/client';
import Layout from '../components/Layout';
import { CollectionCardSkeleton } from '../components/Skeleton';

const Collections = () => {
  const { data, isLoading, isError } = useCollections();

  const renderCollectionGrid = (collections) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((col) => (
        <Link
          key={col.slug}
          to={`/collection/${col.slug}`}
          className="group p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/45 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {col.slug}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-tamil">
              {col.count.toLocaleString()} ஹதீஸ்கள்
            </span>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-150 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors font-tamil text-base mb-2">
            {col.name}
          </h4>
          <p className="text-xs text-slate-450 dark:text-slate-400 font-tamil leading-relaxed line-clamp-2">
            {col.slug === 'bukhari' ? 'ஸஹீஹ் அல்-புஹாரி - இமாம் புஹாரி அவர்களின் தொகுப்பு' : 
             col.slug === 'muslim' ? 'ஸஹீஹ் முஸ்லிம் - இமாம் முஸ்லிம் அவர்களின் தொகுப்பு' : 
             `ஆய்வு செய்யத் தக்க ஹதீஸ் தொகுப்பு: ${col.name}`}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-end">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:underline font-tamil">
              தொகுப்பை வாசி &rarr;
            </span>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Intro */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-tamil">
            ஹதீஸ் தொகுப்புகள் (Hadith Collections)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-tamil max-w-2xl">
            இஸ்லாமிய மார்க்கச் சட்டங்கள், ஒழுக்க நெறிகளை உள்ளடக்கிய பிரதான ஹதீஸ் தொகுப்புகள்.
          </p>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="space-y-8">
            <div>
              <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => <CollectionCardSkeleton key={n} />)}
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-center text-red-700 dark:text-red-400 font-tamil">
            தொகுப்புகளைப் பெற முடியவில்லை.
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Kutub al-Sittah */}
            {data?.categorized?.kutub_al_sittah?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-tamil flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  குதுபுஸ் ஸித்தா (ஆறு ஆதாரப்பூர்வ நூல்கள்)
                </h3>
                {renderCollectionGrid(data.categorized.kutub_al_sittah)}
              </div>
            )}

            {/* Other Collections */}
            {data?.categorized?.others?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-tamil flex items-center gap-2">
                  <Archive className="h-5 w-5 text-teal-600" />
                  இதர ஹதீஸ் தொகுப்புகள்
                </h3>
                {renderCollectionGrid(data.categorized.others)}
              </div>
            )}

            {/* If empty */}
            {data?.all?.length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border rounded-2xl">
                <p className="font-tamil text-slate-500">ஹதீஸ் தொகுப்புகள் எதுவும் காணப்படவில்லை.</p>
              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
};

export default Collections;
