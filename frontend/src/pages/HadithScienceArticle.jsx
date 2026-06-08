import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useHadithScienceArticleDetail } from '../api/client';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const HadithScienceArticle = () => {
  const { slug } = useParams();
  const { data: article, isLoading, isError } = useHadithScienceArticleDetail(slug);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/hadith-science" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-tamil text-sm font-bold">
          <ArrowLeft className="w-4 h-4" />
          பின்னால் செல்ல (Back)
        </Link>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 w-3/4 rounded" />
            <div className="space-y-2 mt-8">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            </div>
          </div>
        ) : isError || !article ? (
          <div className="p-8 bg-red-50 text-red-600 rounded-2xl text-center">
            கட்டுரை கிடைக்கவில்லை (Article not found).
          </div>
        ) : (
          <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
            <header className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 font-tamil leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center justify-between text-sm text-slate-500 font-tamil">
                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                <a href={article.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-600">
                  <ExternalLink className="w-4 h-4" /> மூலப் பக்கம் (Source)
                </a>
              </div>
            </header>

            <div 
              className="prose dark:prose-invert max-w-none font-tamil text-slate-700 dark:text-slate-300 leading-loose"
              dangerouslySetInnerHTML={{ __html: article.content }} 
            />
          </article>
        )}
      </div>
    </Layout>
  );
};

export default HadithScienceArticle;
