import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { User, ShieldAlert, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { useNarratorDetail } from '../api/client';
import Layout from '../components/Layout';
import HadithCard from '../components/HadithCard';
import { HadithCardSkeleton } from '../components/Skeleton';

const Narrator = () => {
  const { name } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page')) || 1;

  // API query
  const { data, isLoading, isError } = useNarratorDetail({
    name,
    page,
    limit: 20
  });

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="text-xs text-slate-500 font-semibold font-tamil flex items-center gap-1.5">
          <Link to="/narrators" className="hover:text-emerald-700 transition-colors">அறிவிப்பாளர்கள்</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200">{name}</span>
        </div>

        {/* Narrator Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <User className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-tamil">
                {name} (அறிவிப்பாளர்)
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-400 font-tamil">
                மொத்தம் அறிவித்தவை: <span className="font-bold text-emerald-700 dark:text-emerald-400">{data?.totalHadiths || 0}</span> ஹதீஸ்கள்
              </p>
            </div>
          </div>

          {/* Collection distribution tags */}
          <div className="flex flex-wrap items-center gap-2">
            {data?.collections?.map((col) => (
              <span key={col.slug} className="text-[10px] font-bold font-tamil bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-350 px-2.5 py-1 rounded-lg">
                {col.name}: {col.count}
              </span>
            ))}
          </div>
        </div>

        {/* Hadith List Split */}
        <div className="space-y-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-tamil flex items-center gap-1.5">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            அறிவித்த ஹதீஸ்கள் பட்டியல்
          </h3>

          {/* Loaders */}
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((n) => <HadithCardSkeleton key={n} />)}
            </div>
          ) : isError ? (
            <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-center space-y-2">
              <ShieldAlert className="h-8 w-8 text-red-500 mx-auto" />
              <p className="font-semibold text-red-750 dark:text-red-400 font-tamil">தரவுகளைப் பெறுவதில் சிக்கல் ஏற்பட்டது.</p>
            </div>
          ) : data?.hadiths?.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border rounded-2xl font-tamil text-slate-500">
              இந்த அறிவிப்பாளரைக் கொண்ட ஹதீஸ்கள் ஏதும் இல்லை.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hadith cards */}
              {data.hadiths.map((hadith) => (
                <HadithCard key={hadith._id} hadith={hadith} />
              ))}

              {/* Pagination */}
              {data?.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-350 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold flex items-center gap-1 font-tamil"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    முந்தைய பக்கம்
                  </button>
                  <span className="text-xs text-slate-555 dark:text-slate-450 font-bold font-tamil">
                    பக்கம் {page} / {data?.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === data?.totalPages}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-350 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-xs font-bold flex items-center gap-1 font-tamil"
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
    </Layout>
  );
};

export default Narrator;
