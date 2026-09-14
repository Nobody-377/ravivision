'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { Package, Search, AlertTriangle, Check, Edit2, Save, X, Eye } from 'lucide-react';

interface ProductAdminData {
  id: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  status: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'INACTIVE';
  isDemoData: boolean;
  requiresInstallation: boolean;
  categoryName: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit form state
  const [editPrice, setEditPrice] = useState('');
  const [editMRP, setEditMRP] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch {
      console.error('Error fetching admin products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const startEditing = (p: ProductAdminData) => {
    setEditingId(p.id);
    setEditPrice(p.price.toString());
    setEditMRP(p.mrp.toString());
    setEditStock(p.stock.toString());
    setEditStatus(p.status);
  };

  const saveProduct = async (productId: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          price: Number(editPrice),
          mrp: Number(editMRP),
          stock: Number(editStock),
          status: editStatus,
          isDemoData: false, // Clearing demo data flag once store owner updates SKU!
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchProducts();
      } else {
        alert(data.error?.message || 'Failed to save product.');
      }
    } catch {
      alert('Error updating product.');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            Product & Inventory Manager
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage pricing, stock counts, SKU status, and replace demo data with real store inventory
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'active', 'demo', 'out_of_stock', 'draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: filter === tab ? 'var(--primary-blue)' : '#ffffff',
                color: filter === tab ? '#ffffff' : 'var(--text-body)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <input
            type="text"
            placeholder="Search SKU, name, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', fontSize: '0.8125rem', outline: 'none' }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading products...</div>
        ) : filteredProducts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>SKU</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Product Name & Brand</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Price</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>MRP</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Stock</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                        {p.sku}
                        {p.isDemoData && (
                          <div style={{ fontSize: '0.6875rem', color: '#ea580c', fontWeight: 700 }}>[DEMO DATA]</div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brand: {p.brand}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{p.categoryName}</td>

                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            style={{ width: '80px', padding: '0.25rem', fontSize: '0.8125rem' }}
                          />
                        ) : (
                          formatINR(p.price)
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editMRP}
                            onChange={(e) => setEditMRP(e.target.value)}
                            style={{ width: '80px', padding: '0.25rem', fontSize: '0.8125rem' }}
                          />
                        ) : (
                          formatINR(p.mrp)
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            style={{ width: '60px', padding: '0.25rem', fontSize: '0.8125rem' }}
                          />
                        ) : (
                          <span style={{ color: p.stock > 0 ? '#16a34a' : '#dc2626' }}>{p.stock} units</span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            style={{ padding: '0.25rem', fontSize: '0.8125rem' }}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                        ) : (
                          <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                            {p.status}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button onClick={() => saveProduct(p.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                              <Save size={12} /> Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEditing(p)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            <Edit2 size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No products found matching criteria.</div>
        )}
      </div>

    </div>
  );
}
