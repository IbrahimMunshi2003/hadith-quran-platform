import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Star, Sparkles, HelpCircle, ArrowRight, BookOpen, User, Hash } from 'lucide-react';
import { useStats } from '../api/client';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import { StatsSkeleton, CollectionCardSkeleton } from '../components/Skeleton';

// Pre-defined popular collections with descriptive detail and custom accent colors
const POPULAR_COLLECTIONS = [
  { slug: 'bukhari', name: 'புஹாரி', fullName: 'ஸஹீஹ் அல்-புஹாரி', description: 'இமாம் புஹாரி அவர்களால் தொகுக்கப்பட்ட மிக நம்பகமான ஹதீஸ் நூல்.', color: 'from-emerald-700 to-emerald-600' },
  { slug: 'muslim', name: 'முஸ்லிம்', fullName: 'ஸஹீஹ் முஸ்லிம்', description: 'இமாம் முஸ்லிம் அவர்களால் தொகுக்கப்பட்ட இரண்டாவது மிக நம்பகமான ஹதீஸ் நூல்.', color: 'from-teal-700 to-teal-600' },
  { slug: 'abu-dawood', name: 'அபூ தாவூத்', fullName: 'ஸுனன் அபூ தாவூத்', description: 'சட்டதிட்டங்களை உள்ளடக்கிய இமாம் அபூ தாவூத் அவர்களின் தொகுப்பு.', color: 'from-cyan-700 to-cyan-600' },
  { slug: 'tirmidhi', name: 'திர்மிதி', fullName: 'ஜாமீ அத்-திர்மிதி', description: 'ஹதீஸ்களின் தரங்களைக் குறிப்பிட்டு இமாம் திர்மிதி தொகுத்த நூல்.', color: 'from-indigo-700 to-indigo-650' },
  { slug: 'nasaayi', name: 'நஸயீ', fullName: 'ஸுனன் அன்-நஸயீ', description: 'இமாம் நஸயீ அவர்களால் தொகுக்கப்பட்ட முக்கியமான சுனன் நூல்.', color: 'from-sky-700 to-sky-600' },
  { slug: 'ibn-majah', name: 'இப்னு மாஜா', fullName: 'ஸுனன் இப்னு மாஜா', description: 'இமாம் இப்னு மாஜா அவர்களின் சுனன் ஹதீஸ் தொகுப்பு.', color: 'from-rose-700 to-rose-650' },
  { slug: 'musnad-ahmad', name: 'முஸ்னத் அஹ்மத்', fullName: 'முஸ்னத் அஹ்மத் பின் ஹன்பல்', description: 'இமாம் அஹ்மத் பின் ஹன்பல் அவர்களின் பிரம்மாண்ட ஹதீஸ் தொகுப்பு.', color: 'from-amber-700 to-amber-600' },
  { slug: 'ibn-hibban', name: 'இப்னு ஹிப்பான்', fullName: 'ஸஹீஹ் இப்னு ஹிப்பான்', description: 'இமாம் இப்னு ஹிப்பான் அவர்களின் முக்கிய ஹதீஸ் நூல்.', color: 'from-emerald-800 to-teal-700' }
];

const Home = () => {
  const { data: stats, isLoading, isError } = useStats();

  return (
    <Layout hideHeaderSearch={true}>
      <div className="space-y-12">
        
        {/* Hero Banner Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-islamic-deep to-slate-950 text-white py-16 px-6 sm:px-12 md:py-20 text-center shadow-xl border border-emerald-900/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-800/10 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="relative max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/35 border border-emerald-600/40 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-spin-slow" />
              <span>நம்பகமான தமிழ் ஹதீஸ்கள் தளம்</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-tamil leading-tight">
              ஹதீஸ்கள் மற்றும் குர்ஆன் தகவல்களைத் தேடுங்கள்
            </h2>
            
            <p className="text-sm sm:text-base text-emerald-100/80 font-tamil max-w-2xl mx-auto">
              புஹாரி, முஸ்லிம் போன்ற பிரசித்தி பெற்ற ஹதீஸ் தொகுப்புகளைத் தமிழ் மொழிபெயர்ப்புடன் வாசிக்கவும், ஆய்ந்து கற்கவும் எளிய வடிவம்.
            </p>
            
            {/* Embedded Large Search Bar */}
            <div className="pt-4 max-w-2xl mx-auto">
              <SearchBar placeholder="ஹதீஸ் எண்கள் மூலம் தேடுங்கள், உதாரணமாக: 1234...." />
              
            </div>
          </div>
        </section>

        {/* Stats Counter Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-tamil flex items-center gap-2">
            <span>புள்ளிவிவரங்கள்</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
          </h3>
          
          {isLoading ? (
            <StatsSkeleton />
          ) : isError ? (
            <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-center text-red-700 dark:text-red-400 text-sm font-semibold">
              புள்ளிவிவரங்களை ஏற்றுவதில் பிழை ஏற்பட்டுள்ளது.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Stat 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:border-emerald-500/20 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 font-tamil">மொத்த ஹதீஸ்கள்</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {stats?.totalHadiths?.toLocaleString() || '10,000+'}
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:border-emerald-500/20 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-700 dark:text-teal-450">
                  <Hash className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 font-tamil">தொகுப்புகள்</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {stats?.totalCollections || '8'}
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm flex items-center gap-4 hover:border-emerald-500/20 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-450">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 font-tamil">அறிவிப்பாளர்கள்</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {stats?.totalNarrators?.toLocaleString() || '1,000+'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Popular Collections Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-tamil flex items-center gap-2">
              <span>முக்கிய ஹதீஸ் தொகுப்புகள்</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            </h3>
            <Link 
              to="/collections" 
              className="text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:underline flex items-center gap-1 font-tamil"
            >
              அனைத்தையும் பார்
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POPULAR_COLLECTIONS.map((col) => {
              // Get actual record count if available in statistics
              const dbRecord = stats?.collections?.find(c => c.slug.toLowerCase() === col.slug.toLowerCase());
              const countText = dbRecord ? `${dbRecord.count.toLocaleString()} ஹதீஸ்கள்` : 'விவரம் பார்க்க';

              return (
                <Link
                  key={col.slug}
                  to={`/collection/${col.slug}`}
                  className="group relative flex flex-col justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${col.color} text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform`}>
                      {col.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 font-tamil group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {col.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        {col.slug}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-tamil leading-relaxed">
                      {col.description}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-750 dark:text-emerald-400">
                    <span className="font-tamil">{countText}</span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default Home;
