import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Edit, Trash2, History, Plus, Download, Upload, FilterX, Settings2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import HadithPreviewCard from '../../components/admin/HadithPreviewCard';
import {
  adminBulkAction,
  adminDeleteHadith,
  adminGetHistory,
  adminListHadiths,
  adminRestoreHistory
} from '../../api/adminClient';

const defaultFilters = {
  q: '',
  collectionSlug: '',
  book: '',
  gradeSlug: '',
  source: '',
  arabic: '',
  tamil: '',
  narrator: '',
  reference: '',
  hadithNumber: '',
  page: 1,
  limit: 20,
  sortBy: 'hadithNumber',
  sortOrder: 'asc'
};

const AdminHadiths = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultFilters);
  const [searchDraft, setSearchDraft] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    collection: true,
    book: true,
    hadithNumber: true,
    chapter: true,
    narrator: true,
    grade: true,
    source: true,
    updatedAt: true,
    actions: true
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchDraft, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const [previewItem, setPreviewItem] = useState(null);
  const [historyItemId, setHistoryItemId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkActionTarget, setBulkActionTarget] = useState(null); // { action, value }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-hadiths', filters],
    queryFn: () => adminListHadiths(filters),
    keepPreviousData: true
  });

  const historyQuery = useQuery({
    queryKey: ['admin-hadith-history', historyItemId],
    queryFn: () => adminGetHistory(historyItemId),
    enabled: !!historyItemId
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteHadith,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hadiths'] });
      // Invalidate public queries
      queryClient.invalidateQueries({ queryKey: ['hadith'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['related'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['narrator'] });
      queryClient.invalidateQueries({ queryKey: ['narrators'] });
      setSelectedIds([]);
    }
  });

  const bulkMutation = useMutation({
    mutationFn: adminBulkAction,
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-hadiths'] });
      // Invalidate public queries
      queryClient.invalidateQueries({ queryKey: ['hadith'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['related'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['narrator'] });
      queryClient.invalidateQueries({ queryKey: ['narrators'] });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: adminRestoreHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hadiths'] });
      queryClient.invalidateQueries({ queryKey: ['admin-hadith-history', historyItemId] });
      // Invalidate public queries
      queryClient.invalidateQueries({ queryKey: ['hadith'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['related'] });
    }
  });

  const rows = data?.items || [];

  const allSelected = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every((row) => selectedIds.includes(row._id));
  }, [rows, selectedIds]);

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(rows.map((row) => row._id));
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setSearchDraft('');
    setFilters(defaultFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(
    k => !['page', 'limit', 'sortBy', 'sortOrder'].includes(k) && filters[k] !== ''
  );

  const runBulk = (action, value = true) => {
    if (action === 'delete') {
      setBulkActionTarget({ action, value });
      return;
    }
    bulkMutation.mutate({ action, ids: selectedIds, value });
  };

  const confirmBulkDelete = () => {
    if (bulkActionTarget?.action === 'delete') {
      bulkMutation.mutate({ action: 'delete', ids: selectedIds, value: true });
      setBulkActionTarget(null);
    }
  };

  const exportSelected = () => {
    bulkMutation.mutate(
      { action: 'export', ids: selectedIds },
      {
        onSuccess: (resp) => {
          const blob = new Blob([JSON.stringify(resp.exported, null, 2)], { type: 'application/json' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `hadith-export-${Date.now()}.json`;
          link.click();
          URL.revokeObjectURL(link.href);
        }
      }
    );
  };

  const importFile = async (file) => {
    const text = await file.text();
    const records = JSON.parse(text);
    bulkMutation.mutate({ action: 'import', records });
  };

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <AdminLayout title="Hadith Management" subtitle="Search, filter, paginate, edit, delete, preview, and audit every hadith field.">
      <div className="space-y-4">
        {/* Filters */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Filters & Search</h3>
            <div className="flex gap-2">
              <button onClick={() => setShowColumnsModal(true)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <Settings2 className="h-3.5 w-3.5" /> Columns
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700">
                  <FilterX className="h-3.5 w-3.5" /> Clear All
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <input placeholder="Instant global search" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input placeholder="Collection Slug" value={filters.collectionSlug} onChange={(e) => setFilter('collectionSlug', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input placeholder="Book Name" value={filters.book} onChange={(e) => setFilter('book', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input placeholder="Grade Slug" value={filters.gradeSlug} onChange={(e) => setFilter('gradeSlug', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input placeholder="Hadith Number" value={filters.hadithNumber} onChange={(e) => setFilter('hadithNumber', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            
            <input placeholder="Narrator" value={filters.narrator} onChange={(e) => setFilter('narrator', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input placeholder="Source" value={filters.source} onChange={(e) => setFilter('source', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input placeholder="Reference" value={filters.reference} onChange={(e) => setFilter('reference', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input placeholder="Arabic text" value={filters.arabic} onChange={(e) => setFilter('arabic', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
            <input placeholder="Tamil text" value={filters.tamil} onChange={(e) => setFilter('tamil', e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link to="/admin/hadiths/new/edit" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" />
              New Hadith
            </Link>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bulk Actions:</span>
            <button disabled={selectedIds.length === 0} onClick={() => runBulk('delete')} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-50 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 transition-colors">Delete</button>
            <button disabled={selectedIds.length === 0} onClick={() => runBulk('publish', true)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Publish</button>
            <button disabled={selectedIds.length === 0} onClick={() => runBulk('verify', true)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Verify</button>
            <button disabled={selectedIds.length === 0} onClick={() => runBulk('gradeUpdate', { grade: 'Sahih', gradeSlug: 'sahih' })} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Grade: Sahih</button>
            <button disabled={selectedIds.length === 0} onClick={exportSelected} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Download className="h-4 w-4" />Export</button>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Upload className="h-4 w-4" />Import
              <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
            </label>
            {bulkMutation.isPending && <span className="text-xs text-emerald-600 animate-pulse">Processing...</span>}
          </div>
        </div>

        {/* Table container with sticky header */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 w-12"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-slate-300" /></th>
                  {visibleColumns.collection && <th className="px-4 py-3 font-semibold">Collection</th>}
                  {visibleColumns.book && <th className="px-4 py-3 font-semibold">Book</th>}
                  {visibleColumns.hadithNumber && <th className="px-4 py-3 font-semibold">Number</th>}
                  {visibleColumns.chapter && <th className="px-4 py-3 font-semibold">Chapter</th>}
                  {visibleColumns.narrator && <th className="px-4 py-3 font-semibold">Narrator</th>}
                  {visibleColumns.grade && <th className="px-4 py-3 font-semibold">Grade</th>}
                  {visibleColumns.source && <th className="px-4 py-3 font-semibold">Source</th>}
                  {visibleColumns.updatedAt && <th className="px-4 py-3 font-semibold">Updated</th>}
                  {visibleColumns.actions && <th className="px-4 py-3 font-semibold sticky right-0 bg-slate-50 dark:bg-slate-800 z-20 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.1)]">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                      {visibleColumns.collection && <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                      {visibleColumns.book && <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                      {visibleColumns.hadithNumber && <td className="px-4 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                      {visibleColumns.chapter && <td className="px-4 py-4"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                      {visibleColumns.narrator && <td className="px-4 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                      {visibleColumns.grade && <td className="px-4 py-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                      {visibleColumns.source && <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                      {visibleColumns.updatedAt && <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>}
                      {visibleColumns.actions && <td className="px-4 py-4 sticky right-0 bg-white dark:bg-slate-900 z-10"><div className="flex gap-2"><div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded"></div><div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded"></div><div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded"></div></div></td>}
                    </tr>
                  ))
                ) : isError ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-rose-600">Failed to load hadiths.</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">No hadiths found matching criteria.</td></tr>
                ) : rows.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => toggleOne(item._id)} className="rounded border-slate-300" /></td>
                    {visibleColumns.collection && <td className="px-4 py-3 max-w-[150px] truncate" title={item.collectionName || item.collectionSlug}>{item.collectionName || item.collectionSlug}</td>}
                    {visibleColumns.book && <td className="px-4 py-3 max-w-[150px] truncate" title={item.bookName}>{item.bookName || '-'}</td>}
                    {visibleColumns.hadithNumber && <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">{item.hadithNumber}</td>}
                    {visibleColumns.chapter && <td className="px-4 py-3 max-w-[200px] truncate" title={item.chapterName}>{item.chapterName || '-'}</td>}
                    {visibleColumns.narrator && <td className="px-4 py-3 max-w-[150px] truncate" title={item.narrator}>{item.narrator || '-'}</td>}
                    {visibleColumns.grade && <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.gradeSlug === 'sahih' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {item.grade || 'None'}
                      </span>
                    </td>}
                    {visibleColumns.source && <td className="px-4 py-3 text-xs text-slate-500">{item.source || '-'}</td>}
                    {visibleColumns.updatedAt && <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.updatedAt).toLocaleDateString()}</td>}
                    {visibleColumns.actions && (
                      <td className="px-4 py-3 sticky right-0 bg-white group-hover:bg-slate-50/50 dark:bg-slate-900 dark:group-hover:bg-slate-800/80 transition-colors shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)] z-10 border-l border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors" title="Preview" onClick={() => setPreviewItem(item)}><Eye className="h-4 w-4" /></button>
                          <Link to={`/admin/hadiths/${item._id}/edit`} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Edit"><Edit className="h-4 w-4" /></Link>
                          <button className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 transition-colors" title="Delete" onClick={() => { setBulkActionTarget({action: 'delete_one', id: item._id}); setShowDeleteConfirm(true); }}><Trash2 className="h-4 w-4" /></button>
                          <button className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="History" onClick={() => setHistoryItemId(item._id)}><History className="h-4 w-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center justify-between text-sm">
            <p className="text-slate-600 dark:text-slate-400">Total: <span className="font-semibold text-slate-900 dark:text-slate-100">{data?.total || 0}</span></p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Per page:</span>
                <select 
                  value={filters.limit} 
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))} className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Prev</button>
                <span className="px-2">Page <span className="font-semibold">{filters.page}</span> of {data?.totalPages || 1}</span>
                <button disabled={filters.page >= (data?.totalPages || 1)} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))} className="rounded border border-slate-300 dark:border-slate-600 px-3 py-1 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 overflow-auto backdrop-blur-sm grid place-items-start pt-10" onClick={() => setPreviewItem(null)}>
          <div className="max-w-3xl w-full mx-auto" onClick={(e) => e.stopPropagation()}>
            <HadithPreviewCard hadith={previewItem} />
          </div>
        </div>
      ) : null}

      {/* Column Visibility Modal */}
      {showColumnsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 grid place-items-center" onClick={() => setShowColumnsModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xl w-64" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm mb-3 border-b pb-2">Visible Columns</h3>
            <div className="space-y-2">
              {Object.keys(visibleColumns).map(col => (
                <label key={col} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded">
                  <input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} className="rounded" />
                  <span className="capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
            <button onClick={() => setShowColumnsModal(false)} className="mt-4 w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-2 text-sm font-semibold">Done</button>
          </div>
        </div>
      )}

      {/* Bulk/Single Delete Confirm Modal */}
      {showDeleteConfirm || bulkActionTarget ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 grid place-items-center" onClick={() => { setShowDeleteConfirm(false); setBulkActionTarget(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Confirm Deletion</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              {bulkActionTarget?.action === 'delete_one' 
                ? 'Are you sure you want to soft-delete this hadith?' 
                : `Are you sure you want to soft-delete ${selectedIds.length} selected hadiths?`}
              <br/><br/>They can be restored later from history.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setBulkActionTarget(null); }} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
              <button 
                onClick={() => { 
                  if (bulkActionTarget?.action === 'delete_one') {
                    deleteMutation.mutate(bulkActionTarget.id);
                  } else {
                    confirmBulkDelete();
                  }
                  setShowDeleteConfirm(false); 
                  setBulkActionTarget(null); 
                }} 
                className="rounded-lg bg-rose-600 text-white px-4 py-2 text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* History Modal (Enhanced Before/After) */}
      {historyItemId ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 overflow-auto backdrop-blur-sm pt-10" onClick={() => setHistoryItemId('')}>
          <div className="max-w-4xl mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2"><History className="h-5 w-5 text-slate-400" /> Version History</h3>
              <button className="text-sm px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setHistoryItemId('')}>Close</button>
            </div>
            
            {historyQuery.isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
              </div>
            ) : (historyQuery.data?.history || []).length === 0 ? (
              <div className="text-center py-10 text-slate-500">No history recorded for this item.</div>
            ) : (
              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                {(historyQuery.data?.history || []).map((entry) => (
                  <div key={entry._id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                            entry.action === 'create' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            entry.action === 'delete' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                            entry.action === 'restore' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>{entry.action}</span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">by {entry.editor?.username}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })}</p>
                      </div>
                      <button
                        className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        onClick={() => restoreMutation.mutate({ id: historyItemId, historyId: entry._id })}
                        disabled={restoreMutation.isPending}
                      >
                        {restoreMutation.isPending ? 'Restoring...' : 'Restore this version'}
                      </button>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-slate-900">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Changed Fields ({entry.changedFields?.length || 0})</h4>
                      {(entry.changedFields || []).length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No field differences recorded.</p>
                      ) : (
                        <div className="space-y-3">
                          {(entry.changedFields || []).map((c) => (
                            <div key={`${entry._id}-${c.field}`} className="text-sm">
                              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 w-fit rounded">
                                {c.field}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                <div className="rounded-lg border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 overflow-hidden">
                                  <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-xs font-bold px-2 py-1 border-b border-rose-100 dark:border-rose-900/30">Previous Value</div>
                                  <div className="p-2 text-rose-900 dark:text-rose-200 text-xs break-words max-h-32 overflow-y-auto whitespace-pre-wrap">
                                    {c.previousValue === null || c.previousValue === '' ? <span className="italic opacity-50">Empty/Null</span> : String(c.previousValue)}
                                  </div>
                                </div>
                                <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 overflow-hidden">
                                  <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2 py-1 border-b border-emerald-100 dark:border-emerald-900/30">New Value</div>
                                  <div className="p-2 text-emerald-900 dark:text-emerald-200 text-xs break-words max-h-32 overflow-y-auto whitespace-pre-wrap">
                                    {c.newValue === null || c.newValue === '' ? <span className="italic opacity-50">Empty/Null</span> : String(c.newValue)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
};

export default AdminHadiths;
