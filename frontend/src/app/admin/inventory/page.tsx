'use client';

import { useState, useEffect } from 'react';
import * as xlsx from 'xlsx';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { ProductImageUploader } from '@/components/admin/ProductImageUploader';
import { exportToExcel } from '@/lib/admin/excel-export';
import { downloadProductImportTemplate } from '@/lib/admin/excel-template';
import { 
  Search, 
  FileSpreadsheet, 
  Edit3, 
  X, 
  FileText,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Download,
  FileUp,
  Star,
  Flame,
  Wrench,
  Zap
} from 'lucide-react';

interface SpecPair {
  key: string;
  value: string;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Excel Bulk Import state
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [excelParsedRows, setExcelParsedRows] = useState<any[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelReport, setExcelReport] = useState<any | null>(null);

  // Common Form States (used for Add and Edit)
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formMrp, setFormMrp] = useState('');
  const [formStock, setFormStock] = useState<number>(10);
  const [formStatus, setFormStatus] = useState<string>('ACTIVE');
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState<boolean>(false);
  const [formDescription, setFormDescription] = useState('');
  const [formWarrantyInfo, setFormWarrantyInfo] = useState('');
  const [formRequiresInstallation, setFormRequiresInstallation] = useState<boolean>(false);
  const [formInstallationDetails, setFormInstallationDetails] = useState('');
  
  // Gallery Image URLs List
  const [formImageUrls, setFormImageUrls] = useState<string[]>(['']);
  
  // Key Specifications Builder
  const [formSpecsPairs, setFormSpecsPairs] = useState<SpecPair[]>([
    { key: '', value: '' },
  ]);

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

  const resetForm = () => {
    setFormName('');
    setFormBrand('');
    setFormSku('');
    setFormPrice('');
    setFormMrp('');
    setFormStock(10);
    setFormStatus('ACTIVE');
    setFormIsFeatured(false);
    setFormIsBestSeller(false);
    setFormDescription('');
    setFormWarrantyInfo('1 Year Brand Warranty');
    setFormRequiresInstallation(false);
    setFormInstallationDetails('');
    setFormImageUrls(['']);
    setFormSpecsPairs([
      { key: 'Color', value: '' },
      { key: 'Warranty', value: '1 Year Manufacturer Warranty' },
    ]);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenExcelModal = () => {
    setExcelFileName('');
    setExcelParsedRows([]);
    setExcelReport(null);
    setShowExcelModal(true);
  };

  // Client-side Excel Spreadsheet Parser
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setExcelReport(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = xlsx.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = xlsx.utils.sheet_to_json(sheet);
        setExcelParsedRows(jsonRows);
      } catch (err: any) {
        alert('Error parsing Excel spreadsheet file: ' + (err.message || 'Invalid format'));
      }
    };
    reader.readAsBinaryString(file);
  };

  // Submit Excel Batch Import
  const handleImportExcelSubmit = async () => {
    if (excelParsedRows.length === 0) {
      alert('Please upload an Excel spreadsheet containing product rows first.');
      return;
    }

    setExcelImporting(true);
    setExcelReport(null);

    try {
      const res = await fetch('/api/admin/products/import-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: excelParsedRows }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExcelReport(data.data);
        fetchProducts();
      } else {
        alert(data.error?.message || 'Failed to import products from Excel.');
      }
    } catch (err: any) {
      alert('Error sending import request: ' + (err.message || 'Network error'));
    } finally {
      setExcelImporting(false);
    }
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormName(product.name || '');
    setFormBrand(product.brand || '');
    setFormSku(product.sku || '');
    setFormPrice(String(product.price || ''));
    setFormMrp(String(product.mrp || ''));
    setFormStock(product.stock ?? 0);
    setFormStatus(product.status || 'ACTIVE');
    setFormIsFeatured(Boolean(product.isFeatured));
    setFormIsBestSeller(Boolean(product.isBestSeller));
    setFormDescription(product.description || '');
    setFormWarrantyInfo(product.warrantyInfo || '');
    setFormRequiresInstallation(Boolean(product.requiresInstallation));
    setFormInstallationDetails(product.installationDetails || '');

    // Existing Images
    if (product.images && product.images.length > 0) {
      setFormImageUrls(product.images.map((img: any) => img.url));
    } else {
      setFormImageUrls(['']);
    }

    // Existing Specifications
    if (product.specifications) {
      try {
        const parsed = JSON.parse(product.specifications);
        const pairs = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setFormSpecsPairs(pairs.length > 0 ? pairs : [{ key: '', value: '' }]);
      } catch {
        setFormSpecsPairs([{ key: 'Features', value: product.specifications }]);
      }
    } else {
      setFormSpecsPairs([{ key: '', value: '' }]);
    }
  };

  const handleGenerateSku = () => {
    const brandPrefix = (formBrand || 'RV').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    setFormSku(`${brandPrefix}-${randomHex}`);
  };

  // Gallery Image List Helpers
  const handleAddImageUrlInput = () => {
    setFormImageUrls(prev => [...prev, '']);
  };

  const handleRemoveImageUrlInput = (index: number) => {
    setFormImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUrlChange = (index: number, val: string) => {
    setFormImageUrls(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  // Specifications Pair Helpers
  const handleAddSpecPair = () => {
    setFormSpecsPairs(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecPair = (index: number) => {
    setFormSpecsPairs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpecPairChange = (index: number, field: 'key' | 'value', val: string) => {
    setFormSpecsPairs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const buildSpecsJsonObject = () => {
    const obj: Record<string, string> = {};
    formSpecsPairs.forEach(pair => {
      if (pair.key.trim()) {
        obj[pair.key.trim()] = pair.value.trim();
      }
    });
    return Object.keys(obj).length > 0 ? obj : null;
  };

  // Create Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBrand || !formSku || !formPrice) {
      alert('Please fill out product title, brand, SKU, and sale price.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanImageUrls = formImageUrls.map(u => u.trim()).filter(Boolean);
      const specsObj = buildSpecsJsonObject();

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          brand: formBrand,
          sku: formSku,
          price: Number(formPrice),
          mrp: Number(formMrp || formPrice),
          stock: Number(formStock),
          status: formStatus,
          isFeatured: formIsFeatured,
          isBestSeller: formIsBestSeller,
          description: formDescription,
          warrantyInfo: formWarrantyInfo,
          requiresInstallation: formRequiresInstallation,
          installationDetails: formInstallationDetails,
          imageUrls: cleanImageUrls,
          specifications: specsObj,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        fetchProducts();
      } else {
        alert(data.error?.message || 'Failed to create product.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating product.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update Product Submit
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    try {
      const cleanImageUrls = formImageUrls.map(u => u.trim()).filter(Boolean);
      const specsObj = buildSpecsJsonObject();

      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          brand: formBrand,
          sku: formSku,
          price: Number(formPrice),
          mrp: Number(formMrp),
          stock: Number(formStock),
          status: formStatus,
          isFeatured: formIsFeatured,
          isBestSeller: formIsBestSeller,
          description: formDescription,
          warrantyInfo: formWarrantyInfo,
          requiresInstallation: formRequiresInstallation,
          installationDetails: formInstallationDetails,
          imageUrls: cleanImageUrls,
          specifications: specsObj,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingProduct(null);
        fetchProducts();
      } else {
        alert(data.error?.message || 'Failed to update product.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating product.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from store inventory? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Failed to delete product.');
      }
    } catch {
      alert('Error deleting product.');
    } finally {
      setDeletingId(null);
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
      'Gallery Images Count': p.images?.length || 0,
      'Warranty Details': p.warrantyInfo || 'N/A',
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
          title="Inventory & Catalog Management" 
          subtitle="Add products, upload picture gallery URLs, bulk import via Excel, manage key specifications & live frontend sync"
          onRefresh={fetchProducts}
          isRefreshing={loading}
        />

        <main className="admin-content animate-fade-in">
          <div className="table-container">
            <div className="table-header-toolbar">
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flex: 1, maxWidth: '380px' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none', zIndex: 10 }} />
                <input
                  type="text"
                  placeholder="Search product title, SKU, brand..."
                  className="input-search"
                  style={{
                    paddingLeft: '2.6rem',
                    paddingRight: '1rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    height: '42px',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    width: '100%',
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  <Plus size={16} /> Insert New Product
                </button>
                <button onClick={handleOpenExcelModal} className="btn btn-purple" style={{ fontSize: '0.85rem', backgroundColor: '#8b5cf6', color: '#fff' }}>
                  <FileUp size={16} /> Bulk Import via Excel
                </button>
                <button onClick={handleExportExcel} className="btn btn-emerald" style={{ fontSize: '0.85rem' }}>
                  <FileSpreadsheet size={16} /> Export to Excel
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading product catalog...</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No products found matching query.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Image</th>
                    <th>SKU & Brand</th>
                    <th>Product Title & Badges</th>
                    <th>MRP & Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stock <= (p.lowStockThreshold || 2);
                    const primaryImage = p.images && p.images.length > 0 ? p.images[0].url : null;
                    return (
                      <tr key={p.id}>
                        <td>
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={p.name}
                              style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', background: '#ffffff', padding: '2px', border: '1px solid var(--border-color)' }}
                            />
                          ) : (
                            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(51, 65, 85, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>{p.sku}</div>
                          <div style={{ fontSize: '0.75rem', color: '#475569' }}>Brand: {p.brand}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{p.name}</div>
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                            {p.isFeatured && <span className="badge badge-purple" style={{ fontSize: '0.675rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Star size={11} fill="#9333ea" /> Featured</span>}
                            {p.isBestSeller && <span className="badge badge-emerald" style={{ fontSize: '0.675rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Flame size={11} fill="#10b981" /> Best Seller</span>}
                            {p.requiresInstallation && <span className="badge badge-blue" style={{ fontSize: '0.675rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Wrench size={11} /> Installation</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#059669' }}>₹{Number(p.price).toLocaleString('en-IN')}</div>
                          {Number(p.mrp) > Number(p.price) && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'line-through' }}>
                              MRP: ₹{Number(p.mrp).toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '0.9rem', color: isLowStock ? '#d97706' : '#0f172a' }}>
                          {p.stock} units
                        </td>
                        <td>
                          <span className={`badge ${
                            p.status === 'ACTIVE' ? 'badge-emerald' :
                            p.status === 'OUT_OF_STOCK' ? 'badge-rose' : 'badge-amber'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button
                              disabled={deletingId === p.id}
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                borderRadius: '8px',
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
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

      {/* Bulk Excel Import Modal */}
      {showExcelModal && (
        <div className="modal-overlay" onClick={() => setShowExcelModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileUp size={22} color="#7c3aed" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Bulk Import Products via Excel Spreadsheet
                </h2>
              </div>
              <button onClick={() => setShowExcelModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Template Download Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '0.85rem 1.15rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#6d28d9', fontSize: '0.9rem' }}>Need a formatted Excel spreadsheet template?</div>
                <div style={{ fontSize: '0.775rem', color: '#475569', marginTop: '0.15rem' }}>Download our pre-formatted template with sample rows for ACs, Refrigerators, Washing Machines, TVs & Fans.</div>
              </div>
              <button
                onClick={downloadProductImportTemplate}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: '#7c3aed', color: '#7c3aed', background: '#ffffff' }}
              >
                <Download size={15} /> Download Sample Template (.xlsx)
              </button>
            </div>

            {/* File Upload Zone */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Select Excel File (.xlsx, .xls, .csv)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileSelect}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#f8fafc',
                  border: '2px dashed #a855f7',
                  borderRadius: '12px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Live Spreadsheet Preview Table */}
            {excelParsedRows.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                    Live Preview: {excelParsedRows.length} Product Rows Detected ({excelFileName})
                  </h3>
                </div>

                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Title / Product Name</th>
                        <th>Brand</th>
                        <th>SKU</th>
                        <th>Selling Price</th>
                        <th>MRP</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelParsedRows.slice(0, 15).map((row, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>
                            {row['Product Name'] || row.name || row['Product / Product Type'] || 'N/A'}
                          </td>
                          <td style={{ color: '#475569' }}>{row['Brand'] || row.brand || 'Store Brand'}</td>
                          <td style={{ fontFamily: 'monospace', color: '#0284c7' }}>{row['SKU'] || row.sku || 'Auto-Generate'}</td>
                          <td style={{ color: '#059669', fontWeight: 700 }}>₹{row['Selling Price (INR)'] || row.price || 0}</td>
                          <td style={{ color: '#64748b' }}>₹{row['MRP (INR)'] || row.mrp || 0}</td>
                          <td style={{ color: '#0f172a' }}>{row['Stock'] || row.stock || 10}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {excelParsedRows.length > 15 && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', textAlign: 'right' }}>
                    + Showing first 15 of {excelParsedRows.length} rows
                  </div>
                )}
              </div>
            )}

            {/* Import Results Summary Card */}
            {excelReport && (
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #34d399', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 800, fontSize: '0.95rem' }}>
                  <CheckCircle2 size={20} /> Excel Batch Import Completed Successfully!
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'rgba(52, 211, 153, 0.15)', padding: '0.65rem', borderRadius: '8px', color: '#34d399' }}>
                    <strong>{excelReport.createdCount}</strong> New Products Created
                  </div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.65rem', borderRadius: '8px', color: '#38bdf8' }}>
                    <strong>{excelReport.updatedCount}</strong> Products Updated
                  </div>
                  <div style={{ background: 'rgba(148, 163, 184, 0.15)', padding: '0.65rem', borderRadius: '8px', color: '#94a3b8' }}>
                    <strong>{excelReport.totalProcessed}</strong> Total Rows Processed
                  </div>
                </div>

                {excelReport.errors && excelReport.errors.length > 0 && (
                  <div style={{ marginTop: '0.75rem', color: '#f87171', fontSize: '0.8rem' }}>
                    <strong>Warnings ({excelReport.errors.length}):</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      {excelReport.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                disabled={excelImporting || excelParsedRows.length === 0}
                onClick={handleImportExcelSubmit}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
              >
                {excelImporting ? 'Importing Products to Store...' : `Confirm & Import ${excelParsedRows.length} Products`}
              </button>
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insert New Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#2563eb" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Insert New Product into Store Catalog
                </h2>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Section 1: Basic Information */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  1. Basic Information & Product Identifiers
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Product Title / Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Voltas 1.5 Ton 5 Star Inverter Split AC"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Voltas / LG / Samsung"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        SKU / Code *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateSku}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Zap size={13} fill="#0284c7" /> Auto-Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VOL-992018"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    >
                      <option value="ACTIVE">ACTIVE (Visible on Frontend)</option>
                      <option value="DRAFT">DRAFT (Hidden)</option>
                      <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Featured Product Badge
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={formIsBestSeller}
                      onChange={(e) => setFormIsBestSeller(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Best Seller Tag
                  </label>
                </div>
              </div>

              {/* Section 2: Pricing & Inventory */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  2. Pricing & Stock Inventory
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 34990"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#059669', fontWeight: 700, fontSize: '0.95rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      MRP Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 45990"
                      value={formMrp}
                      onChange={(e) => setFormMrp(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Product Picture Gallery & Multi-Source Uploader */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  <ImageIcon size={16} /> 3. Product Photos & Multi-Source Image Uploader
                </h3>
                <ProductImageUploader
                  imageUrls={formImageUrls}
                  onChange={(newUrls) => setFormImageUrls(newUrls)}
                />
              </div>

              {/* Section 4: Features & Specifications Key-Value Builder */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} /> 4. Key Specifications & Features
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSpecPair}
                    style={{ background: '#ffffff', border: '1px solid #d97706', color: '#d97706', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Add Feature Spec
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {formSpecsPairs.map((pair, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Attribute (e.g. Capacity / Screen Size)"
                        value={pair.key}
                        onChange={(e) => handleSpecPairChange(idx, 'key', e.target.value)}
                        style={{ width: '40%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#0f172a', fontSize: '0.825rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 1.5 Ton / 55 Inch / 4K Ultra HD)"
                        value={pair.value}
                        onChange={(e) => handleSpecPairChange(idx, 'value', e.target.value)}
                        style={{ flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#0f172a', fontSize: '0.825rem' }}
                      />
                      {formSpecsPairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecPair(idx)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Description, Warranty & Installation */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  5. Product Description, Warranty & Technician Service
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Full Product Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter detailed product description and key selling points..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Warranty Information
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Year Comprehensive + 10 Years Compressor Warranty"
                    value={formWarrantyInfo}
                    onChange={(e) => setFormWarrantyInfo(e.target.value)}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formRequiresInstallation}
                      onChange={(e) => setFormRequiresInstallation(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Requires Technician Installation Service Flag
                  </label>

                  {formRequiresInstallation && (
                    <input
                      type="text"
                      placeholder="Installation details (e.g. Technician demo & installation within 24h of delivery)"
                      value={formInstallationDetails}
                      onChange={(e) => setFormInstallationDetails(e.target.value)}
                      style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#0f172a', fontSize: '0.825rem' }}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {isSaving ? 'Inserting Product...' : 'Insert & Publish Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="#2563eb" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Edit Product: {editingProduct.sku}
                </h2>
              </div>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Section 1: Basic Info */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  1. Product Identifiers
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Product Title / Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Brand Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      SKU Code
                    </label>
                    <input
                      type="text"
                      required
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Featured Product Badge
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={formIsBestSeller}
                      onChange={(e) => setFormIsBestSeller(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Best Seller Tag
                  </label>
                </div>
              </div>

              {/* Section 2: Pricing & Stock */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  2. Pricing & Inventory
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#059669', fontWeight: 700, fontSize: '0.95rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      MRP Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formMrp}
                      onChange={(e) => setFormMrp(e.target.value)}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      required
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Product Picture Gallery & Multi-Source Uploader */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  <ImageIcon size={16} /> 3. Product Photos & Multi-Source Image Uploader
                </h3>
                <ProductImageUploader
                  imageUrls={formImageUrls}
                  onChange={(newUrls) => setFormImageUrls(newUrls)}
                />
              </div>

              {/* Section 4: Key Specifications */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} /> 4. Key Specifications & Features
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSpecPair}
                    style={{ background: '#ffffff', border: '1px solid #d97706', color: '#d97706', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Add Feature Spec
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {formSpecsPairs.map((pair, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Attribute"
                        value={pair.key}
                        onChange={(e) => handleSpecPairChange(idx, 'key', e.target.value)}
                        style={{ width: '40%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#0f172a', fontSize: '0.825rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={pair.value}
                        onChange={(e) => handleSpecPairChange(idx, 'value', e.target.value)}
                        style={{ flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#0f172a', fontSize: '0.825rem' }}
                      />
                      {formSpecsPairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecPair(idx)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Description & Service */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  5. Description, Warranty & Installation
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Full Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Warranty Details
                  </label>
                  <input
                    type="text"
                    value={formWarrantyInfo}
                    onChange={(e) => setFormWarrantyInfo(e.target.value)}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formRequiresInstallation}
                      onChange={(e) => setFormRequiresInstallation(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Requires Technician Installation Service Flag
                  </label>

                  {formRequiresInstallation && (
                    <input
                      type="text"
                      placeholder="Installation details"
                      value={formInstallationDetails}
                      onChange={(e) => setFormInstallationDetails(e.target.value)}
                      style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.75rem', color: '#0f172a', fontSize: '0.825rem' }}
                    />
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {isSaving ? 'Saving Updates...' : 'Save Product Updates'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
