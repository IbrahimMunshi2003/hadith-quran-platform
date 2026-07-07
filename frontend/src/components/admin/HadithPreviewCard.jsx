import React from 'react';
import DOMPurify from 'dompurify';

const HadithPreviewCard = ({ hadith }) => {
  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-emerald-600 font-semibold">{hadith.collectionName || hadith.collectionSlug || 'Collection'}</p>
          <h4 className="text-lg font-bold">Hadith #{hadith.hadithNumber || '-'}</h4>
        </div>
        <span className="text-xs rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1">{hadith.grade || 'No Grade'}</span>
      </header>

      <div className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
        <p><span className="font-semibold">Book:</span> {hadith.bookName || '-'}</p>
        <p><span className="font-semibold">Chapter:</span> {hadith.chapterName || '-'}</p>
        <p><span className="font-semibold">Narrator:</span> {hadith.narrator || '-'}</p>
        <p><span className="font-semibold">Reference:</span> {hadith.referenceNumber || '-'}</p>
        <p><span className="font-semibold">Source:</span> {hadith.source || '-'}</p>
      </div>

      <section className="space-y-2">
        <h5 className="text-xs uppercase tracking-wide text-slate-500">Arabic</h5>
        <p className="arabic-text text-right text-slate-900 dark:text-slate-50">{hadith.arabicText || '-'}</p>
      </section>

      <section className="space-y-2">
        <h5 className="text-xs uppercase tracking-wide text-slate-500">Tamil Translation</h5>
        <p className="tamil-text text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{hadith.tamilTranslation || '-'}</p>
      </section>

      <section className="space-y-2">
        <h5 className="text-xs uppercase tracking-wide text-slate-500">Explanation</h5>
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{hadith.detailedExplanation || '-'}</p>
      </section>

      <section className="space-y-2">
        <h5 className="text-xs uppercase tracking-wide text-slate-500">Description</h5>
        <div
          className="text-sm text-slate-700 dark:text-slate-300 leading-7"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(hadith.description || '<p>-</p>') }}
        />
      </section>

      <footer className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>{hadith.featured ? 'Featured' : 'Standard'}</span>
        <span>•</span>
        <span>{hadith.verified ? 'Verified' : 'Unverified'}</span>
        <span>•</span>
        <span>{hadith.published ? 'Published' : 'Draft'}</span>
      </footer>
    </article>
  );
};

export default HadithPreviewCard;
