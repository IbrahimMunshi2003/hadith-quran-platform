import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useHadithScienceArticles } from '../api/client';
import { BookOpen } from 'lucide-react';

const HadithScience = () => {
  const { data: articles, isLoading, isError } = useHadithScienceArticles();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 font-tamil">
            <BookOpen className="w-8 h-8 text-emerald-600" />
            ஹதீஸ் கலை (Hadith Science)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-tamil">
            ஹதீஸ் கலை தொடர்பான கட்டுரைகள் மற்றும் விளக்கங்கள்.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 w-2/3 rounded mb-4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 w-1/4 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 bg-red-50 text-red-600 rounded-2xl text-center">
            கட்டுரைகளை ஏற்றுவதில் பிழை.
          </div>
        ) : (
          <div className="grid gap-4">
            {articles?.map(article => (
              <Link
                key={article.slug}
                to={`/hadith-science/${article.slug}`}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 font-tamil group-hover:text-emerald-700 transition-colors">
                  {article.title}
                </h2>
                <div className="mt-2 text-sm text-slate-500 font-tamil">
                  {new Date(article.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
            {(!articles || articles.length === 0) && (
              <div className="text-center p-8 text-slate-500">
                கட்டுரைகள் எதுவும் இல்லை.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HadithScience;
