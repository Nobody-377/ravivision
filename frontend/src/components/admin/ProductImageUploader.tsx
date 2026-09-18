'use client';

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  HardDrive, 
  Link as LinkIcon, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

interface ProductImageUploaderProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
}

export function ProductImageUploader({ imageUrls, onChange }: ProductImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'gdrive' | 'url'>('local');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [gdriveInput, setGdriveInput] = useState('');
  const [directUrlInput, setDirectUrlInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredUrls = imageUrls.filter(url => url.trim().length > 0);

  // Helper to add new URLs to list
  const addUrls = (newUrls: string[]) => {
    const updated = [...filteredUrls, ...newUrls];
    onChange(updated.length > 0 ? updated : ['']);
  };

  // 1. Local Machine File Upload Handler
  const handleFilesUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please select valid image files (JPEG, PNG, WEBP, GIF).' });
      return;
    }

    // Check size limit (10MB)
    const MAX_10MB = 10 * 1024 * 1024;
    const oversized = validFiles.find(f => f.size > MAX_10MB);
    if (oversized) {
      setStatusMsg({ 
        type: 'error', 
        text: `File "${oversized.name}" exceeds the 10MB size limit (${(oversized.size / (1024 * 1024)).toFixed(2)}MB).` 
      });
      return;
    }

    setUploading(true);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      validFiles.forEach(file => formData.append('file', file));

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const uploadedUrls = data.urls || [data.url];
        addUrls(uploadedUrls);
        setStatusMsg({ type: 'success', text: `Successfully uploaded ${uploadedUrls.length} image(s)!` });
      } else {
        setStatusMsg({ type: 'error', text: data.error?.message || 'Failed to upload image(s).' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error connecting to upload server.' });
    } finally {
      setUploading(false);
    }
  };

  // 2. Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // 3. Google Drive Import Handler
  const handleGdriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdriveInput.trim()) return;

    setUploading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gdriveUrl: gdriveInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addUrls([data.url]);
        setGdriveInput('');
        setStatusMsg({ type: 'success', text: 'Google Drive photo imported successfully!' });
      } else {
        setStatusMsg({ type: 'error', text: data.error?.message || 'Failed to import Google Drive photo.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error connecting to upload server.' });
    } finally {
      setUploading(false);
    }
  };

  // 4. Direct URL Input Handler
  const handleDirectUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrlInput.trim()) return;
    addUrls([directUrlInput.trim()]);
    setDirectUrlInput('');
    setStatusMsg({ type: 'success', text: 'Image URL added to product gallery!' });
  };

  // Gallery Manipulation
  const handleRemoveImage = (index: number) => {
    const updated = filteredUrls.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : ['']);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredUrls.length) return;

    const copy = [...filteredUrls];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Upload Source Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.35rem', borderRadius: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('local')}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            backgroundColor: activeTab === 'local' ? '#ffffff' : 'transparent',
            color: activeTab === 'local' ? '#2563eb' : '#64748b',
            boxShadow: activeTab === 'local' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <HardDrive size={16} /> 🖥️ Local Machine
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gdrive')}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            backgroundColor: activeTab === 'gdrive' ? '#ffffff' : 'transparent',
            color: activeTab === 'gdrive' ? '#2563eb' : '#64748b',
            boxShadow: activeTab === 'gdrive' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <UploadCloud size={16} /> ☁️ Google Drive
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            backgroundColor: activeTab === 'url' ? '#ffffff' : 'transparent',
            color: activeTab === 'url' ? '#2563eb' : '#64748b',
            boxShadow: activeTab === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <LinkIcon size={16} /> 🔗 Web Image URL
        </button>
      </div>

      {/* Tab 1: Local Machine Upload & Drag and Drop Zone */}
      {activeTab === 'local' && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragActive ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '1.75rem 1rem',
            textAlign: 'center',
            backgroundColor: dragActive ? '#eff6ff' : '#f8fafc',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            {uploading ? (
              <Loader2 size={36} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <UploadCloud size={40} color="#2563eb" />
            )}
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              {uploading ? 'Uploading Product Photos...' : 'Drag & Drop photos here, or Click to Browse'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Supports JPG, PNG, WEBP, GIF (Max 10MB per image)
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Google Drive Share Link Import */}
      {activeTab === 'gdrive' && (
        <form onSubmit={handleGdriveSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="url"
            placeholder="Paste Google Drive share link (e.g. https://drive.google.com/file/d/...)"
            value={gdriveInput}
            onChange={(e) => setGdriveInput(e.target.value)}
            disabled={uploading}
            style={{
              flex: 1,
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={uploading || !gdriveInput.trim()}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Import Drive Photo'}
          </button>
        </form>
      )}

      {/* Tab 3: Direct URL Input */}
      {activeTab === 'url' && (
        <form onSubmit={handleDirectUrlSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="url"
            placeholder="Paste direct image URL (https://...)"
            value={directUrlInput}
            onChange={(e) => setDirectUrlInput(e.target.value)}
            style={{
              flex: 1,
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!directUrlInput.trim()}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            Add Image URL
          </button>
        </form>
      )}

      {/* Feedback Alert Notice */}
      {statusMsg && (
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: statusMsg.type === 'success' ? '#ecfdf5' : '#fff1f2',
            border: `1px solid ${statusMsg.type === 'success' ? '#a7f3d0' : '#fecdd3'}`,
            color: statusMsg.type === 'success' ? '#047857' : '#be123c',
          }}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Product Image Gallery Grid */}
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Product Gallery ({filteredUrls.length} Photo{filteredUrls.length === 1 ? '' : 's'})</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>First photo is main cover image</span>
        </div>

        {filteredUrls.length === 0 ? (
          <div style={{ padding: '1.25rem', border: '1px dashed #e2e8f0', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            No product photos added yet. Upload from local machine or import from Google Drive above.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {filteredUrls.map((url, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  border: idx === 0 ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Cover Image Badge */}
                {idx === 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      zIndex: 10,
                    }}
                  >
                    Main Cover
                  </span>
                )}

                {/* Thumbnail Preview */}
                <div style={{ height: '110px', width: '100%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img
                    src={url}
                    alt={`Product photo ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Controls Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', backgroundColor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveImage(idx, 'up')}
                      title="Move Left / Make Cover"
                      style={{ background: 'none', border: 'none', color: idx === 0 ? '#cbd5e1' : '#475569', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '0.1rem' }}
                    >
                      <ArrowUp size={14} style={{ transform: 'rotate(-90deg)' }} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredUrls.length - 1}
                      onClick={() => handleMoveImage(idx, 'down')}
                      title="Move Right"
                      style={{ background: 'none', border: 'none', color: idx === filteredUrls.length - 1 ? '#cbd5e1' : '#475569', cursor: idx === filteredUrls.length - 1 ? 'not-allowed' : 'pointer', padding: '0.1rem' }}
                    >
                      <ArrowDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    title="Remove Photo"
                    style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', padding: '0.1rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
