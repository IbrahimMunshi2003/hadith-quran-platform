import React, { useMemo, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const formats = ['header', 'bold', 'italic', 'blockquote', 'list', 'bullet', 'link', 'image', 'align', 'color', 'background', 'script', 'indent', 'direction'];

const RichTextEditor = ({ label, value, onChange, rtl = false, onImageUpload }) => {
  const quillRef = useRef(null);

  // Custom image handler
  const imageHandler = useCallback(() => {
    if (!onImageUpload) {
      const url = prompt('Enter image URL:');
      if (url) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        quill.insertEmbed(range.index, 'image', url);
      }
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertText(range.index, 'Uploading...', 'user');
        
        try {
          // Temporarily attach the file to the DOM element or pass it out
          // but we need to wait for the URL.
          // Since onImageUpload might just mutate state, let's assume it returns a Promise resolving to the URL, or we handle it differently.
          // In AdminHadithEdit.jsx, we defined uploadMutation. Let's make sure it returns the URL.
          // Actually, the parent can handle it, but it's cleaner to handle the API call here or assume onImageUpload returns the URL.
          
          const url = await new Promise((resolve, reject) => {
             // We can pass a callback or expect a promise
             const res = onImageUpload(file, resolve, reject);
             if (res && res.then) resolve(res);
          });
          
          quill.deleteText(range.index, 'Uploading...'.length);
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1);
        } catch (err) {
          quill.deleteText(range.index, 'Uploading...'.length);
          console.error('Image upload failed', err);
          alert('Failed to upload image.');
        }
      }
    };
  }, [onImageUpload]);

  // Handle image drag and drop / paste
  const handlePaste = useCallback((e) => {
    if (!onImageUpload) return;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let hasImage = false;
    for (let index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        hasImage = true;
        
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertText(range.index, 'Uploading paste...', 'user');

        Promise.resolve(onImageUpload(file)).then((url) => {
          quill.deleteText(range.index, 'Uploading paste...'.length);
          if (url) quill.insertEmbed(range.index, 'image', url);
        }).catch(() => {
          quill.deleteText(range.index, 'Uploading paste...'.length);
        });
      }
    }
    // Let default paste happen if no images
    if (!hasImage) return; 
  }, [onImageUpload]);

  // Memoize modules so the editor doesn't re-render and lose focus
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }, { align: [] }],
        [{ color: [] }, { background: [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), [imageHandler]);

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>}
      <div className={`${rtl ? 'rtl text-right' : ''} bg-white dark:bg-slate-900`} onPaste={handlePaste}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={modules}
          formats={formats}
          className="min-h-[200px]"
        />
      </div>
      <style>{`
        .ql-editor {
          min-height: 200px;
        }
        .dark .ql-toolbar {
          background-color: #1e293b;
          border-color: #334155;
        }
        .dark .ql-container {
          border-color: #334155;
          color: #e2e8f0;
        }
        .dark .ql-picker-options {
          background-color: #1e293b;
          border-color: #334155;
        }
        .dark .ql-stroke { stroke: #cbd5e1; }
        .dark .ql-fill { fill: #cbd5e1; }
        .dark .ql-picker { color: #cbd5e1; }
        .dark .ql-editor.ql-blank::before { color: #64748b; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
