'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { exportToExcel } from '@/lib/excel-export';
import { 
  Search, 
  Package, 
  AlertTriangle, 
  FileSpreadsheet, 
  Edit3, 
  X, 
  Wrench,
  Tag,
  FileText
} from 'lucide-react';

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // Edit form state
  const [newStock, setNewStock] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<string>('');
  const [newMrp, setNewMrp] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('ACTIVE');
  const [newSpecs, setNewSpecs] = useState<string>('');
  const [newRequiresInstallation, setNewRequiresInstallation] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setNewStock(product.stock || 0);
    setNewPrice(String(product.price || 0));
    setNewMrp(String(product.mrp || 0));
    setNewStatus(product.status || 'ACTIVE');
    setNewSpecs(product.specifications || '');
    setNewRequiresInstallation(Boolean(product.requiresInstallation));
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: Number(newStock),
          price: Number(newPrice),
          mrp: Number(newMrp),
          status: newStatus,
          specifications: newSpecs || null,
          requiresInstallation: newRequiresInstallation,
        }),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
          ...p,
          stock: Number(newStock),
          price: Number(newPrice),
          mrp: Number(newMrp),
          status: newStatus,
          specifications: newSpecs || null,
          requiresInstallation: newRequiresInstallation,
        } : p));
        setEditingProduct(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  });

  const handleExportExcel = () => {
    const reportData = filteredProducts.map(p => ({
      'SKU / Product Code': p.sku,
      'Product Name': p.name,
      'Brand': p.brand,
      'Stock Level': p.stock,
      'Low Stock Limit': p.lowStockThreshold || 2,
      'Stock Status': p.status,
      'MRP (₹)': Number(p.mrp),
      'Sale Price (₹)': Number(p.price),
      'Product Attributes / Specs': p.specifications || 'N/A',
      'Installation Required': p.requiresInstallation ? 'Yes (Technician Flag)' : 'No',
    }));
    exportToExcel('Inventory_Stock_Audit', 'Inventory', reportData);
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader 
          title="Inventory & Stock Management" 
          subtitle="SKU codes, MRP vs Price, attributes JSON, stock alerts & technician installation flags"
          onRefresh={fetchProducts}
          isRefreshing={loading}
        />

        <main className="admin-content animate-fade-in">
          <div className="table-container">
            <div className="table-header-toolbar">
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search product, SKU, brand..."
                  className="input-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button onClick={handleExportExcel} className="btn btn-emerald" style={{ fontSize: '0.85rem' }}>
                <FileSpreadsheet size={16} /> Export Inventory to Excel
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading inventory items...</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No products found in inventory.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>SKU / Product Code</th>
                    <th>Product Title & Brand</th>
                    <th>MRP & Sale Price</th>
                    <th>Stock Level</th>
                    <th>Installation Required</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stock <= (p.lowStockThreshold || 2);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{p.sku}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Tag size={12} /> Brand: {p.brand}
                          </div>
                          {p.specifications && (
                            <div style={{ fontSize: '0.725rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                              <FileText size={12} /> Specs: {p.specifications.substring(0, 45)}...
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#34d399' }}>₹{Number(p.price).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'line-through' }}>
                            MRP: ₹{Number(p.mrp).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '1rem', color: isLowStock ? '#fbbf24' : '#f8fafc' }}>
                          {p.stock} units
                        </td>
                        <td>
                          {p.requiresInstallation ? (
                            <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Wrench size={12} /> Yes (Technician)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            p.status === 'ACTIVE' ? 'badge-emerald' :
                            p.status === 'OUT_OF_STOCK' ? 'badge-rose' : 'badge-blue'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <Edit3 size={14} /> Edit Item
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Edit Item Modal */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                Edit Product: {editingProduct.sku}
              </h2>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Sale Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    MRP (INR ₹)
                  </label>
                  <input
                    type="number"
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Stock Level (Quantity)
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Stock Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Product Attributes / Specifications (JSON string)
                </label>
                <textarea
                  rows={3}
                  value={newSpecs}
                  onChange={(e) => setNewSpecs(e.target.value)}
                  placeholder='e.g. {"Screen Size": "55 Inch", "Resolution": "4K Ultra HD"}'
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <input
                  type="checkbox"
                  id="requiresInst"
                  checked={newRequiresInstallation}
                  onChange={(e) => setNewRequiresInstallation(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="requiresInst" style={{ fontSize: '0.85rem', color: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}>
                  Requires Installation / Technician Assignment Flag
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isSaving ? 'Saving...' : 'Save Product Updates'}
                </button>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
