import React from 'react';

export const HadithCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-full w-16"></div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-5/6"></div>
      </div>
      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-full ml-auto"></div>
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-4/5 ml-auto"></div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-lg w-16"></div>
      </div>
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3 mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
};

export const CollectionCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm animate-pulse space-y-3">
      <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2"></div>
    </div>
  );
};
