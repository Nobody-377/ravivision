'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import {
  FolderTree,
  Tag,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  X,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  _count?: {
    products: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  departmentId: string;
  subcategories: Subcategory[];
  _count?: {
    products: number;
  };
}

interface Department {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
}

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'cat' | 'sub'; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'cat' | 'sub'; id: string; name: string } | null>(null);

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');
  
  const [newSubName, setNewSubName] = useState('');
  const [targetCatId, setTargetCatId] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const json = await res.json();
        setDepartments(json.data || []);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          departmentId: targetDeptId || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showNotification('success', `Category "${newCatName.trim()}" created successfully!`);
        setNewCatName('');
        setShowAddCatModal(false);
        fetchCategories();
      } else {
        showNotification('error', json.error?.message || 'Failed to create category.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error creating category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !targetCatId) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubName.trim(),
          categoryId: targetCatId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showNotification('success', `Subcategory "${newSubName.trim()}" created successfully!`);
        setNewSubName('');
        setShowAddSubModal(false);
        fetchCategories();
      } else {
        showNotification('error', json.error?.message || 'Failed to create subcategory.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error creating subcategory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    setIsSaving(true);
    try {
      const endpoint = editingItem.type === 'cat' 
        ? `/api/admin/categories/${editingItem.id}` 
        : `/api/admin/subcategories/${editingItem.id}`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingItem.name.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showNotification('success', `${editingItem.type === 'cat' ? 'Category' : 'Subcategory'} updated!`);
        setEditingItem(null);
        fetchCategories();
      } else {
        showNotification('error', json.error?.message || 'Update failed.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    setIsSaving(true);
    try {
      const endpoint = deletingItem.type === 'cat' 
        ? `/api/admin/categories/${deletingItem.id}` 
        : `/api/admin/subcategories/${deletingItem.id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        showNotification('success', `${deletingItem.type === 'cat' ? 'Category' : 'Subcategory'} deleted!`);
        setDeletingItem(null);
        fetchCategories();
      } else {
        showNotification('error', json.error?.message || 'Delete failed.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Delete failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter categories by search
  const filteredDepartments = departments.map((dept) => {
    const matchingCats = dept.categories.filter((cat) => {
      const matchCatName = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubName = cat.subcategories.some((sub) =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchCatName || matchSubName;
    });

    return { ...dept, categories: matchingCats };
  }).filter((dept) => dept.categories.length > 0 || !searchTerm);

  const totalCategoriesCount = departments.reduce(
    (acc, d) => acc + d.categories.length,
    0
  );
  const totalSubcategoriesCount = departments.reduce(
    (acc, d) => acc + d.categories.reduce((sAcc, c) => sAcc + c.subcategories.length, 0),
    0
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader title="Category & Subcategory Management" />

        {toast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            animation: 'fadeIn 0.3s ease'
          }}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
          </div>
        )}

        <div className="admin-content" style={{ padding: '2rem' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FolderTree size={28} color="#2563eb" /> Category Taxonomy
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                Manage store product categories, edit subcategories, and organize catalog structure.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setNewCatName('');
                  setTargetDeptId(departments[0]?.id || '');
                  setShowAddCatModal(true);
                }}
                className="admin-btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Plus size={18} /> Add New Category
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <Layers size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Categories</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{totalCategoriesCount}</div>
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <Tag size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Subcategories</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{totalSubcategoriesCount}</div>
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search category or subcategory name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem 0.7rem 2.6rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Category Tree Display */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <div className="spinner" style={{ marginBottom: '1rem' }}>Loading categories taxonomy...</div>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <FolderTree size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>No Categories Found</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Click "Add New Category" above to create your first product category!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {filteredDepartments.map((dept) => (
                <div key={dept.id} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f1f5f9' }}>
                    <Sparkles size={18} color="#2563eb" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {dept.name}
                    </h2>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 700, marginLeft: 'auto' }}>
                      {dept.categories.length} Categories
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                    {dept.categories.map((cat) => (
                      <div
                        key={cat.id}
                        style={{
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Category Card Header */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Layers size={17} color="#2563eb" />
                                {cat.name}
                              </h3>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                                slug: {cat.slug}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                title="Edit Category Name"
                                onClick={() => setEditingItem({ type: 'cat', id: cat.id, name: cat.name })}
                                style={{ border: 'none', background: '#ffffff', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', color: '#475569', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                title="Delete Category"
                                onClick={() => setDeletingItem({ type: 'cat', id: cat.id, name: cat.name })}
                                style={{ border: 'none', background: '#ffffff', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Subcategories List */}
                          <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Subcategories ({cat.subcategories.length})
                              </span>
                              <button
                                onClick={() => {
                                  setNewSubName('');
                                  setTargetCatId(cat.id);
                                  setShowAddSubModal(true);
                                }}
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#2563eb',
                                  fontWeight: 700,
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                              >
                                <Plus size={12} /> Add Subcategory
                              </button>
                            </div>

                            {cat.subcategories.length === 0 ? (
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.5rem 0' }}>
                                No subcategories added yet.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                                {cat.subcategories.map((sub) => (
                                  <div
                                    key={sub.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0.4rem 0.6rem',
                                      background: '#ffffff',
                                      borderRadius: '8px',
                                      border: '1px solid #e2e8f0',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <Tag size={13} color="#16a34a" /> {sub.name}
                                    </span>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      {sub._count?.products !== undefined && (
                                        <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 600 }}>
                                          {sub._count.products} products
                                        </span>
                                      )}
                                      <button
                                        onClick={() => setEditingItem({ type: 'sub', id: sub.id, name: sub.name })}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '0.1rem' }}
                                        title="Edit Subcategory"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        onClick={() => setDeletingItem({ type: 'sub', id: sub.id, name: sub.name })}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: '0.1rem' }}
                                        title="Delete Subcategory"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
      </div>

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="#2563eb" /> Add New Product Category
              </h2>
              <button onClick={() => setShowAddCatModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Refrigerators, Audio Systems"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              {departments.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    Department
                  </label>
                  <select
                    value={targetDeptId}
                    onChange={(e) => setTargetDeptId(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSaving ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showAddSubModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="#16a34a" /> Add New Subcategory
              </h2>
              <button onClick={() => setShowAddSubModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubcategory}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Parent Category
                </label>
                <select
                  value={targetCatId}
                  onChange={(e) => setTargetCatId(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  {departments.flatMap((d) => d.categories).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Double Door, OLED 4K, Inverter AC"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSaving ? 'Saving...' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
              Edit {editingItem.type === 'cat' ? 'Category' : 'Subcategory'} Name
            </h2>

            <form onSubmit={handleUpdateItem}>
              <input
                type="text"
                required
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', marginBottom: '1.25rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.75rem', textAlign: 'center' }}>
            <AlertTriangle size={42} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Delete {deletingItem.type === 'cat' ? 'Category' : 'Subcategory'}?
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong style={{ color: '#0f172a' }}>"{deletingItem.name}"</strong>? Products under this {deletingItem.type === 'cat' ? 'category' : 'subcategory'} will no longer be linked to it.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={isSaving}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
              >
                {isSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
