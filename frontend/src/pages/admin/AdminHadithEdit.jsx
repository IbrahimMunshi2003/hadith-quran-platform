import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, RotateCcw, Copy, ExternalLink, Trash2, AlertTriangle, History } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import RichTextEditor from '../../components/admin/RichTextEditor';
import HadithPreviewCard from '../../components/admin/HadithPreviewCard';
import {
  adminCreateHadith,
  adminGetHadith,
  adminUpdateHadith,
  adminDeleteHadith,
  adminUploadImage,
  adminGetHistory,
  adminRestoreHistory
} from '../../api/adminClient';

const initialForm = {
  collectionSlug: '',
  collectionName: '',
  bookNo: '',
  bookName: '',
  chapterNo: '',
  chapterName: '',
  hadithNumber: '',
  referenceNumber: '',
  arabicText: '',
  tamilTranslation: '',
  grade: '',
  gradeArabic: '',
  gradeTamil: '',
  gradeSlug: 'other',
  narrator: '',
  originalUrl: '',
  detailedExplanation: '',
  explanationUrl: '',
  description: '',
  source: '',
  tags: [],
  keywords: [],
  relatedHadithIds: [],
  isFallback: false,
  published: true,
  featured: false,
  verified: false
};

const fieldMeta = {
  collectionSlug: { label: 'Collection Slug', required: true, group: 'identity' },
  collectionName: { label: 'Collection Name', required: true, group: 'identity' },
  hadithNumber: { label: 'Hadith Number', required: true, group: 'identity' },
  bookNo: { label: 'Book No', group: 'identity' },
  bookName: { label: 'Book Name', required: true, group: 'identity' },
  chapterNo: { label: 'Chapter No', group: 'identity' },
  chapterName: { label: 'Chapter Name', group: 'identity' },
  referenceNumber: { label: 'Reference Number', group: 'identity' },
  narrator: { label: 'Narrator (அறிவிப்பாளர்)', group: 'content' },
  grade: { label: 'Grade (English)', group: 'grading' },
  gradeArabic: { label: 'Grade (Arabic)', group: 'grading' },
  gradeTamil: { label: 'Grade (Tamil)', group: 'grading' },
  gradeSlug: { label: 'Grade Slug', group: 'grading' },
  source: { label: 'Source', group: 'meta' },
  originalUrl: { label: 'Original URL', group: 'meta' },
  explanationUrl: { label: 'Explanation URL', group: 'meta' },
};

const textareaFields = ['arabicText', 'tamilTranslation', 'detailedExplanation'];
const boolFields = ['isFallback', 'published', 'featured', 'verified'];

const AUTOSAVE_KEY = 'admin_hadith_draft_';

const AdminHadithEdit = () => {
  const { id } = useParams();
  const isCreate = id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [savedSnapshot, setSavedSnapshot] = useState(initialForm);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const formRef = useRef(null);

  // ── Fetch hadith data ──
  const { data: hadithDetail, isLoading } = useQuery({
    queryKey: ['admin-hadith-edit', id],
    queryFn: () => adminGetHadith(id),
    enabled: !isCreate
  });

  // ── Fetch history ──
  const historyQuery = useQuery({
    queryKey: ['admin-hadith-history', id],
    queryFn: () => adminGetHistory(id),
    enabled: showHistory && !isCreate
  });

  // ── Load data or draft ──
  useEffect(() => {
    if (!isCreate && hadithDetail?.hadith) {
      const loaded = {
        ...initialForm,
        ...hadithDetail.hadith,
        explanationUrl: hadithDetail.hadith.detailedExplanationUrl || ''
      };
      setForm(loaded);
      setSavedSnapshot(loaded);
    } else if (isCreate) {
      // Check for autosaved draft
      try {
        const draft = localStorage.getItem(AUTOSAVE_KEY + 'new');
        if (draft) {
          const parsed = JSON.parse(draft);
          setForm({ ...initialForm, ...parsed });
        }
      } catch { /* ignore */ }
    }
  }, [hadithDetail, isCreate]);

  // ── Detect unsaved changes ──
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(savedSnapshot);
  }, [form, savedSnapshot]);

  // ── Autosave to localStorage ──
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY + (isCreate ? 'new' : id), JSON.stringify(form));
      } catch { /* quota exceeded */ }
    }, 3000);
    return () => clearTimeout(timer);
  }, [form, hasUnsavedChanges, id, isCreate]);

  // ── Unsaved changes warning ──
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        tags: Array.isArray(form.tags) ? form.tags : String(form.tags || '').split(',').map(v => v.trim()).filter(Boolean),
        keywords: Array.isArray(form.keywords) ? form.keywords : String(form.keywords || '').split(',').map(v => v.trim()).filter(Boolean),
        relatedHadithIds: Array.isArray(form.relatedHadithIds) ? form.relatedHadithIds : String(form.relatedHadithIds || '').split(',').map(v => v.trim()).filter(Boolean)
      };
      if (isCreate) return adminCreateHadith(payload);
      return adminUpdateHadith({ id, payload });
    },
    onSuccess: (resp) => {
      const saved = { ...initialForm, ...resp.hadith, explanationUrl: resp.hadith.detailedExplanationUrl || '' };
      setSavedSnapshot(saved);
      setForm(saved);
      setError('');
      setSuccessMsg('Saved successfully!');
      localStorage.removeItem(AUTOSAVE_KEY + (isCreate ? 'new' : id));
      setTimeout(() => setSuccessMsg(''), 3000);
      if (isCreate) {
        navigate(`/admin/hadiths/${resp.hadith._id}/edit`, { replace: true });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-hadiths'] });
      // Invalidate public queries to ensure immediate sync
      queryClient.invalidateQueries({ queryKey: ['hadith'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['related'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['narrator'] });
      queryClient.invalidateQueries({ queryKey: ['narrators'] });
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to save hadith.');
      setSuccessMsg('');
    }
  });

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: () => adminDeleteHadith(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hadiths'] });
      // Invalidate public queries
      queryClient.invalidateQueries({ queryKey: ['hadith'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['related'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      navigate('/admin/hadiths');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to delete.');
    }
  });

  // ── Restore mutation ──
  const restoreMutation = useMutation({
    mutationFn: adminRestoreHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hadith-edit', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-hadith-history', id] });
      // Invalidate public queries
      queryClient.invalidateQueries({ queryKey: ['hadith'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['related'] });
      setSuccessMsg('Version restored!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  });

  // ── Upload mutation ──
  const uploadMutation = useMutation({
    mutationFn: adminUploadImage
  });

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saveMutation.isPending) saveMutation.mutate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveMutation]);

  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const discardChanges = useCallback(() => {
    setForm(savedSnapshot);
    setError('');
    localStorage.removeItem(AUTOSAVE_KEY + (isCreate ? 'new' : id));
  }, [savedSnapshot, isCreate, id]);

  const cloneHadith = useCallback(() => {
    const cloned = { ...form, hadithNumber: '', _id: undefined };
    localStorage.setItem(AUTOSAVE_KEY + 'new', JSON.stringify(cloned));
    navigate('/admin/hadiths/new/edit');
  }, [form, navigate]);

  const previewData = useMemo(() => ({
    ...form,
    detailedExplanationUrl: form.explanationUrl
  }), [form]);

  const renderField = (field) => {
    const meta = fieldMeta[field];
    if (!meta) return null;
    return (
      <div key={field}>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
          {meta.label}
          {meta.required && <span className="text-rose-500">*</span>}
        </label>
        <input
          required={meta.required}
          value={form[field] || ''}
          onChange={(e) => setField(field, e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          placeholder={meta.label}
        />
      </div>
    );
  };

  const renderTextarea = (field, label, opts = {}) => {
    const val = form[field] || '';
    return (
      <div className="md:col-span-2">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1">
            {label}
            {opts.required && <span className="text-rose-500">*</span>}
          </span>
          <span className="text-slate-400 font-normal">{val.length} chars</span>
        </label>
        <textarea
          required={opts.required}
          value={val}
          onChange={(e) => setField(field, e.target.value)}
          rows={opts.rows || 5}
          dir={opts.rtl ? 'rtl' : 'ltr'}
          style={opts.fontFamily ? { fontFamily: opts.fontFamily } : undefined}
          className={`w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm resize-y focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${opts.rtl ? 'text-right' : ''}`}
          placeholder={label}
        />
      </div>
    );
  };

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <AdminLayout title="Edit Hadith" subtitle="Loading...">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 space-y-4 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-4"></div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isCreate ? 'Create Hadith' : 'Edit Hadith'} subtitle="Update every field and review live preview instantly. Ctrl+S to save.">
      {/* Sticky save bar */}
      <div className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-4 flex items-center justify-between gap-3 border-b transition-all ${hasUnsavedChanges ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700'} backdrop-blur-sm`}>
        <div className="flex items-center gap-2 text-sm">
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Unsaved changes
            </span>
          )}
          {successMsg && <span className="text-emerald-600 font-semibold">{successMsg}</span>}
          {error && <span className="text-rose-600 font-semibold">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <button type="button" onClick={discardChanges} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />
              Discard
            </button>
          )}
          {!isCreate && (
            <>
              <button type="button" onClick={cloneHadith} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Clone this hadith as a new record">
                <Copy className="h-3.5 w-3.5" />
                Clone
              </button>
              <a href={`/hadith/${form.collectionSlug}/${form.hadithNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                Preview
              </a>
              <button type="button" onClick={() => setShowHistory(prev => !prev)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <History className="h-3.5 w-3.5" />
                History
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 px-3 py-1.5 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save (Ctrl+S)'}
          </button>
          <Link to="/admin/hadiths" className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Back</Link>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 grid place-items-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">This will soft-delete the hadith. It can be restored from history.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={() => { setShowDeleteConfirm(false); deleteMutation.mutate(); }}
                className="rounded-lg bg-rose-600 text-white px-4 py-2 text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Editor Form ── */}
        <form
          ref={formRef}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 space-y-5"
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
        >
          {/* Identity Fields */}
          <fieldset>
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Identity & Classification</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['collectionSlug', 'collectionName', 'hadithNumber', 'referenceNumber', 'bookNo', 'bookName', 'chapterNo', 'chapterName'].map(f => renderField(f))}
            </div>
          </fieldset>

          {/* Content Fields */}
          <fieldset>
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Content</legend>
            <div className="grid grid-cols-1 gap-3">
              {renderTextarea('arabicText', 'Arabic Text (النص العربي)', { required: true, rows: 5, rtl: true, fontFamily: "'Amiri', serif" })}
              {renderTextarea('tamilTranslation', 'Tamil Translation (தமிழ் மொழிபெயர்ப்பு)', { required: true, rows: 5, fontFamily: "'Noto Sans Tamil', sans-serif" })}
              {renderField('narrator')}
            </div>
          </fieldset>

          {/* Grading Fields */}
          <fieldset>
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Grading</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['grade', 'gradeArabic', 'gradeTamil', 'gradeSlug'].map(f => renderField(f))}
            </div>
          </fieldset>

          {/* Meta Fields */}
          <fieldset>
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Source & Links</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['source', 'originalUrl', 'explanationUrl'].map(f => renderField(f))}
            </div>
          </fieldset>

          {/* Explanation */}
          <fieldset>
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Detailed Explanation</legend>
            {renderTextarea('detailedExplanation', 'Detailed Explanation', { rows: 4 })}
          </fieldset>

          {/* Tags & Keywords */}
          <fieldset>
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Tags & Keywords</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tags (comma separated)</label>
                <input
                  value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags || ''}
                  onChange={(e) => setField('tags', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="prayer, fasting, charity"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Keywords (comma separated)</label>
                <input
                  value={Array.isArray(form.keywords) ? form.keywords.join(', ') : form.keywords || ''}
                  onChange={(e) => setField('keywords', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="salah, sawm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Related Hadith IDs (comma separated)</label>
                <input
                  value={Array.isArray(form.relatedHadithIds) ? form.relatedHadithIds.join(', ') : form.relatedHadithIds || ''}
                  onChange={(e) => setField('relatedHadithIds', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* Boolean Flags */}
          <fieldset>
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Flags</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {boolFields.map((field) => (
                <label key={field} className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer select-none rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input type="checkbox" checked={Boolean(form[field])} onChange={(e) => setField(field, e.target.checked)} className="rounded" />
                  {field}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Rich Text Description */}
          <fieldset>
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Description (Rich Text)</legend>
            <RichTextEditor label="" value={form.description} onChange={(value) => setField('description', value)} rtl={false} onImageUpload={(file) => uploadMutation.mutateAsync(file).then(res => res.url)} />
          </fieldset>
        </form>

        {/* ── Right Column: Preview + History ── */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Live Preview</h3>
            <HadithPreviewCard hadith={previewData} />
          </div>

          {/* History panel */}
          {showHistory && !isCreate && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-bold text-sm mb-3">Version History</h3>
              {historyQuery.isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
                </div>
              ) : (historyQuery.data?.history || []).length === 0 ? (
                <p className="text-sm text-slate-500">No history entries yet.</p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-auto">
                  {(historyQuery.data?.history || []).map((entry) => (
                    <div key={entry._id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            entry.action === 'create' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            entry.action === 'delete' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                            entry.action === 'restore' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>{entry.action}</span>
                          <span className="text-xs text-slate-500 ml-2">by {entry.editor?.username}</span>
                        </div>
                        <button
                          className="rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          onClick={() => restoreMutation.mutate({ id, historyId: entry._id })}
                          disabled={restoreMutation.isPending}
                        >
                          Restore
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{new Date(entry.createdAt).toLocaleString()}</p>
                      {/* Diff view */}
                      <div className="space-y-1">
                        {(entry.changedFields || []).map((c) => (
                          <div key={`${entry._id}-${c.field}`} className="text-xs rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{c.field}</span>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <div className="bg-rose-50 dark:bg-rose-950/20 rounded p-1 text-rose-700 dark:text-rose-400 break-words overflow-hidden max-h-20">
                                <span className="font-semibold">Before: </span>
                                {String(c.previousValue ?? '—').substring(0, 200)}
                              </div>
                              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded p-1 text-emerald-700 dark:text-emerald-400 break-words overflow-hidden max-h-20">
                                <span className="font-semibold">After: </span>
                                {String(c.newValue ?? '—').substring(0, 200)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHadithEdit;
