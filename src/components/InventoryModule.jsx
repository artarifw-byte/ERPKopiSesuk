import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  PackageCheck,
  PlusCircle,
  Package,
  Layers,
  Edit2,
  Trash2,
  Coffee,
  Plus,
  RefreshCw,
  Database
} from 'lucide-react';
import { MaterialModal } from './MaterialModal';
import { ProductModal } from './ProductModal';

export const InventoryModule = ({ onOpenStockIn }) => {
  const {
    materials,
    products,
    calculateSSAndROP,
    deleteMaterial,
    deleteProduct,
    isSyncing,
    fetchAllFromSupabase
  } = useERP();

  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'products'
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'material'|'product', id, name }

  const handleEditMaterial = (mat) => {
    setMaterialToEdit(mat);
    setIsMaterialModalOpen(true);
  };

  const handleCreateMaterial = () => {
    setMaterialToEdit(null);
    setIsMaterialModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'material') {
      await deleteMaterial(itemToDelete.id);
    } else if (itemToDelete.type === 'product') {
      await deleteProduct(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <PackageCheck style={{ width: '22px', height: '22px', color: '#0284C7' }} />
              Manajemen Inventaris, Bahan & Produk (Supabase DB)
            </h2>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.725rem',
              fontWeight: 800,
              background: '#F0FDF4',
              color: '#15803D',
              border: '1.5px solid #86EFAC'
            }}>
              <Database style={{ width: '12px', height: '12px' }} />
              Live DB
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
            Kalkulasi Otomatis Safety Stock (SS) & ROP Terpadu, CRUD Bahan Baku & Menu Jualan
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchAllFromSupabase()}
            disabled={isSyncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.85rem',
              borderRadius: '0.75rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              color: '#475569',
              cursor: 'pointer'
            }}
            title="Sinkronisasi ulang dengan Supabase"
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync DB</span>
          </button>

          <button
            onClick={handleCreateMaterial}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.55rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.825rem',
              fontWeight: 800,
              background: '#FFFFFF',
              border: '1.5px solid #0284C7',
              color: '#0284C7',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(2,132,199,0.08)'
            }}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            + Tambah Bahan Baru
          </button>

          <button
            onClick={() => setIsProductModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.55rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.825rem',
              fontWeight: 800,
              background: '#FFFFFF',
              border: '1.5px solid #B45309',
              color: '#B45309',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(180,83,9,0.08)'
            }}
          >
            <Coffee style={{ width: '15px', height: '15px' }} />
            + Tambah Menu Produk
          </button>

          <button
            onClick={onOpenStockIn}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.55rem 1.125rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #16A34A, #15803D)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,0.3)'
            }}
          >
            <PlusCircle style={{ width: '15px', height: '15px' }} />
            Input Penerimaan Stok
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('materials')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.625rem',
            fontSize: '0.825rem',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'materials' ? '#0284C7' : 'transparent',
            color: activeTab === 'materials' ? '#FFFFFF' : '#64748B',
            transition: 'all 0.15s ease'
          }}
        >
          <Package style={{ width: '15px', height: '15px' }} />
          Bahan Baku Terpusat ({materials.length} Bahan)
        </button>

        <button
          onClick={() => setActiveTab('products')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.625rem',
            fontSize: '0.825rem',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'products' ? '#0284C7' : 'transparent',
            color: activeTab === 'products' ? '#FFFFFF' : '#64748B',
            transition: 'all 0.15s ease'
          }}
        >
          <Coffee style={{ width: '15px', height: '15px' }} />
          Katalog Produk & Varian ({products.length} Menu)
        </button>
      </div>

      {activeTab === 'materials' ? (
        <>
          {/* Status Legend Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {[
              { status: 'SAFE', label: 'SAFE (Aman)', color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC', dot: '#22C55E', desc: 'Stok > Reorder Point (ROP)', note: 'Kondisi persediaan aman untuk mendukung operasional rutin & lonjakan PO.' },
              { status: 'REORDER', label: 'REORDER (Peringatan)', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', desc: 'Safety Stock < Stok ≤ ROP', note: 'Sistem menyarankan pembuatan PO pengadaan bahan baku ke supplier.' },
              { status: 'CRITICAL', label: 'CRITICAL (Kritis)', color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444', desc: 'Stok ≤ Safety Stock (SS)', note: 'Risiko kehabisan bahan baku sangat tinggi! Segera lakukan stock-in.' },
            ].map(s => (
              <div key={s.status} className="glass-card" style={{ padding: '1rem', borderColor: s.border, background: s.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '9999px', background: s.dot, flexShrink: 0 }} />
                  <h4 style={{ fontWeight: 800, color: s.color, fontSize: '0.875rem' }}>{s.label}</h4>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: s.color, fontWeight: 600 }}>{s.desc}</p>
                <p style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '0.5rem', lineHeight: 1.5 }}>{s.note}</p>
              </div>
            ))}
          </div>

          {/* Materials Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Bahan Baku</th>
                    <th>Stok Saat Ini</th>
                    <th>Satuan</th>
                    <th>Harga Satuan</th>
                    <th>Pemakaian Harian (Avg/Max)</th>
                    <th>Lead Time</th>
                    <th>Safety Stock</th>
                    <th>Reorder Point</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi (CRUD)</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((mat) => {
                    const { ss, rop, status } = calculateSSAndROP(mat);
                    const isCritical = status === 'CRITICAL';
                    const isReorder = status === 'REORDER';

                    return (
                      <tr key={mat.id} style={{ background: isCritical ? '#FEF2F2' : isReorder ? '#FFFBEB' : 'transparent' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>
                            <Package style={{ width: '15px', height: '15px', color: '#0284C7', flexShrink: 0 }} />
                            {mat.name}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.0625rem', color: '#0F172A' }}>
                            {Number(mat.currentStock || 0).toLocaleString('id-ID')}
                          </div>
                          {/* Stock gauge */}
                          <div style={{ width: '90px', height: '5px', background: '#E2E8F0', borderRadius: '9999px', marginTop: '0.375rem', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '9999px',
                              background: isCritical ? '#EF4444' : isReorder ? '#F59E0B' : '#22C55E',
                              width: `${Math.min(100, Math.max(8, (Number(mat.currentStock || 0) / (rop * 2.5 || 1)) * 100))}%`,
                            }} />
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                          {mat.unit}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: '#0369A1' }}>
                          Rp {Number(mat.unitPrice || 0).toLocaleString('id-ID')} / {mat.unit}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569' }}>
                          {mat.avgDailyUsage} / <span style={{ fontWeight: 800, color: '#B45309' }}>{mat.maxDailyUsage}</span> {mat.unit}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569' }}>
                          {mat.avgLeadTimeDays} - {mat.maxLeadTimeDays} Hari
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800, color: '#7C3AED' }}>
                          {ss.toLocaleString('id-ID')} {mat.unit}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800, color: '#B45309' }}>
                          {rop.toLocaleString('id-ID')} {mat.unit}
                        </td>
                        <td>
                          <span className={`badge ${status === 'SAFE' ? 'badge-safe' : status === 'REORDER' ? 'badge-reorder' : 'badge-critical'}`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                            {/* Restok Button */}
                            <button
                              onClick={onOpenStockIn}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.725rem', fontWeight: 700,
                                background: '#F0FDF4', color: '#16A34A',
                                border: '1.5px solid #86EFAC', cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                              title="Terima stok baru"
                            >
                              <PlusCircle style={{ width: '12px', height: '12px' }} />
                              Restok
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditMaterial(mat)}
                              style={{
                                padding: '0.35rem',
                                borderRadius: '0.5rem',
                                border: '1.5px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#0284C7',
                                cursor: 'pointer'
                              }}
                              title="Edit data bahan"
                            >
                              <Edit2 style={{ width: '13px', height: '13px' }} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setItemToDelete({ type: 'material', id: mat.id, name: mat.name })}
                              style={{
                                padding: '0.35rem',
                                borderRadius: '0.5rem',
                                border: '1.5px solid #FCA5A5',
                                background: '#FEF2F2',
                                color: '#EF4444',
                                cursor: 'pointer'
                              }}
                              title="Hapus bahan dari database"
                            >
                              <Trash2 style={{ width: '13px', height: '13px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Products & Variants Table */
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nama Produk</th>
                  <th>Kode SKU</th>
                  <th>Kategori</th>
                  <th>Varian Ukuran & Harga Jual</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                      Belum ada produk di database. Klik "+ Tambah Menu Produk" untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0F172A', fontSize: '0.875rem' }}>
                          <Coffee style={{ width: '16px', height: '16px', color: '#B45309' }} />
                          {p.name}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                        {p.code}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          background: '#E0F2FE',
                          color: '#0284C7',
                          border: '1px solid #BAE6FD'
                        }}>
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {(p.variants || []).map(v => (
                            <div
                              key={v.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.5rem',
                                background: '#F8FAFC',
                                border: '1.5px solid #E2E8F0',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              <span style={{ color: '#334155' }}>{v.sizeLabel || `${v.sizeMl}ml`}</span>
                              <span style={{ color: '#16A34A', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                Rp {Number(v.sellingPrice || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => setItemToDelete({ type: 'product', id: p.id, name: p.name })}
                          style={{
                            padding: '0.35rem',
                            borderRadius: '0.5rem',
                            border: '1.5px solid #FCA5A5',
                            background: '#FEF2F2',
                            color: '#EF4444',
                            cursor: 'pointer'
                          }}
                          title="Hapus produk"
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Material Modal (Create & Edit) */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        materialToEdit={materialToEdit}
      />

      {/* Product Modal (Create) */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '420px',
            border: '1.5px solid #CBD5E1',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '9999px',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Trash2 style={{ width: '24px', height: '24px' }} />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.5rem' }}>
              Hapus {itemToDelete.type === 'material' ? 'Bahan Baku' : 'Produk'}?
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              Apakah Anda yakin ingin menghapus <strong style={{ color: '#0F172A' }}>"{itemToDelete.name}"</strong> dari database Supabase? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setItemToDelete(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  background: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.825rem',
                  fontWeight: 800,
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                }}
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
