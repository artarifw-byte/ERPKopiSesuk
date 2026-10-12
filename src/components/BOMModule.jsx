import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  UtensilsCrossed,
  DollarSign,
  Coffee,
  Package,
  Edit2,
  Save,
  CheckCircle2,
  Info,
  Trash2,
  Plus,
  Minus,
  X,
  AlertCircle
} from 'lucide-react';

export const BOMModule = () => {
  const { products, materials, bom, saveVariantRecipe, calculateVariantHPP, showToast } = useERP();

  const [editingVariant, setEditingVariant] = useState(null);
  // editingItems: [{ materialId: '...', qty: 15 }, ...]
  const [editingItems, setEditingItems] = useState([]);
  const [selectedNewMaterial, setSelectedNewMaterial] = useState('');
  const [selectedNewQty, setSelectedNewQty] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // cupCount: { [variantId]: number } — jumlah cup untuk preview/simulasi takaran
  const [cupCount, setCupCount] = useState({});

  const getCupCount = (variantId) => cupCount[variantId] || 1;
  const setCupCountFor = (variantId, val) => {
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed >= 1) {
      setCupCount(prev => ({ ...prev, [variantId]: parsed }));
    }
  };

  const handleStartEdit = (variant) => {
    setEditingVariant(variant.id);
    const currentRecipe = bom.filter(
      b => (b.variantId === variant.id || b.variant_id === variant.id) &&
           Number(b.qty ?? b.qty_required ?? 0) > 0
    );

    setEditingItems(
      currentRecipe.map(b => ({
        materialId: b.materialId || b.raw_material_id,
        qty: Number(b.qty ?? b.qty_required ?? 0)
      }))
    );
    setSelectedNewMaterial('');
    setSelectedNewQty('');
  };

  const handleCancelEdit = () => {
    setEditingVariant(null);
    setEditingItems([]);
    setSelectedNewMaterial('');
    setSelectedNewQty('');
  };

  const handleUpdateQty = (materialId, val) => {
    const parsed = parseFloat(val);
    setEditingItems(prev =>
      prev.map(item =>
        item.materialId === materialId
          ? { ...item, qty: isNaN(parsed) ? '' : Math.max(0, parsed) }
          : item
      )
    );
  };

  const handleRemoveItem = (materialId) => {
    setEditingItems(prev => prev.filter(item => item.materialId !== materialId));
  };

  const handleAddMaterialToRecipe = () => {
    if (!selectedNewMaterial) return;
    const qty = parseFloat(selectedNewQty);
    if (isNaN(qty) || qty <= 0) {
      if (showToast) showToast('Masukkan takaran bahan yang valid (> 0)', 'error');
      return;
    }

    setEditingItems(prev => {
      const exists = prev.find(item => item.materialId === selectedNewMaterial);
      if (exists) {
        return prev.map(item =>
          item.materialId === selectedNewMaterial ? { ...item, qty } : item
        );
      }
      return [...prev, { materialId: selectedNewMaterial, qty }];
    });

    setSelectedNewMaterial('');
    setSelectedNewQty('');
  };

  const handleSaveEdit = async (variantId, variantLabel) => {
    setIsSaving(true);
    try {
      // Filter items yang memiliki qty > 0
      const sanitizedItems = editingItems
        .filter(item => Number(item.qty) > 0)
        .map(item => ({ materialId: item.materialId, qty: Number(item.qty) }));

      await saveVariantRecipe(variantId, sanitizedItems, variantLabel);
      setEditingVariant(null);
      setEditingItems([]);
      setSelectedNewMaterial('');
      setSelectedNewQty('');
    } catch (err) {
      console.error('Error saving recipe:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UtensilsCrossed style={{ width: '22px', height: '22px', color: '#0284C7' }} />
            Matriks Takaran Bill of Materials (BOM) & HPP
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
            Atur komposisi dan takaran bahan baku spesifik untuk setiap menu. Tambah, kurangi, atau ubah bahan sesuai resep masing-masing.
          </p>
        </div>
      </div>

      {/* Baseline Material Unit Prices Banner */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
          Daftar Harga Baseline Bahan Baku Inventori (Dasar Perhitungan HPP)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {materials.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '0.75rem',
                background: '#F8FAFC',
                borderRadius: '0.75rem',
                border: '1.5px solid #E2E8F0',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.name}>
                {m.name}
              </span>
              <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7', marginTop: '0.25rem' }}>
                Rp {m.unitPrice.toLocaleString('id-ID')} <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>/{m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Recipes Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {products.map((prod) => (
          <div key={prod.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
            {/* Product Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.875rem', borderBottom: '1.5px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: '0.625rem',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0284C7'
                }}>
                  <Coffee style={{ width: '18px', height: '18px' }} />
                </div>
                <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '1.0625rem' }}>{prod.name}</h3>
              </div>
              <span style={{
                fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800,
                background: '#EFF6FF', color: '#1D4ED8',
                padding: '0.2rem 0.625rem', borderRadius: '0.5rem',
                border: '1px solid #BFDBFE'
              }}>
                {prod.code}
              </span>
            </div>

            {/* Variants & Recipes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {prod.variants.map((v) => {
                const price = v.sellingPrice || v.price || 0;
                const isEditing = editingVariant === v.id;

                // Hitung HPP dan Margin:
                // Jika sedang diedit, hitung secara live dari editingItems
                // Jika tidak sedang diedit, hitung dari BOM context
                let currentHPP = 0;
                if (isEditing) {
                  currentHPP = editingItems.reduce((acc, it) => {
                    const mat = materials.find(m => m.id === it.materialId);
                    const qtyVal = Number(it.qty) || 0;
                    return acc + (qtyVal * Number(mat?.unitPrice || 0));
                  }, 0);
                  currentHPP = Math.round(currentHPP);
                } else {
                  currentHPP = calculateVariantHPP(v.id);
                }

                const currentMargin = price - currentHPP;
                const marginPercent = price > 0 ? ((currentMargin / price) * 100).toFixed(1) : '0';

                // Jumlah cup untuk simulasi takaran (default 1)
                const cups = getCupCount(v.id);
                const totalHPPCups = currentHPP * cups;
                const totalSalesCups = price * cups;

                // Bahan yang aktif di resep varian ini (untuk view mode)
                const activeRecipeItems = bom.filter(
                  b => (b.variantId === v.id || b.variant_id === v.id) &&
                       Number(b.qty ?? b.qty_required ?? 0) > 0
                );

                // Bahan yang belum dimasukkan ke resep (untuk dropdown tambah bahan saat edit)
                const availableToAdd = materials.filter(
                  m => !editingItems.some(it => it.materialId === m.id)
                );

                return (
                  <div
                    key={v.id}
                    style={{
                      padding: '1.125rem',
                      background: isEditing ? '#FFFFFF' : '#F8FAFC',
                      borderRadius: '0.875rem',
                      border: isEditing ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                      boxShadow: isEditing ? '0 6px 20px rgba(2, 132, 199, 0.12)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Header Varian */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>
                            {v.sizeLabel}
                          </span>
                          {isEditing && (
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              background: '#E0F2FE',
                              color: '#0369A1',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #BAE6FD'
                            }}>
                              Mode Edit Resep
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Harga Jual: <strong style={{ color: '#0F172A', fontFamily: 'var(--font-mono)' }}>Rp {price.toLocaleString('id-ID')}</strong>
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            HPP BOM: <strong style={{ color: '#0369A1', fontFamily: 'var(--font-mono)' }}>Rp {currentHPP.toLocaleString('id-ID')}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Input jumlah cup — hanya muncul di view mode */}
                      {!isEditing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: '0.625rem', padding: '0.3rem 0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369A1', whiteSpace: 'nowrap' }}>Simulasi:</span>
                          <button
                            onClick={() => setCupCountFor(v.id, getCupCount(v.id) - 1)}
                            disabled={getCupCount(v.id) <= 1}
                            style={{
                              width: '22px', height: '22px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '0.375rem',
                              background: getCupCount(v.id) <= 1 ? '#E2E8F0' : '#0284C7',
                              border: 'none', cursor: getCupCount(v.id) <= 1 ? 'not-allowed' : 'pointer',
                              color: getCupCount(v.id) <= 1 ? '#94A3B8' : '#fff',
                              flexShrink: 0
                            }}
                          >
                            <Minus style={{ width: '11px', height: '11px' }} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={getCupCount(v.id)}
                            onChange={e => setCupCountFor(v.id, e.target.value)}
                            style={{
                              width: '38px',
                              textAlign: 'center',
                              border: 'none',
                              background: 'transparent',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.875rem',
                              color: '#0F172A',
                              outline: 'none'
                            }}
                          />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0369A1' }}>cup</span>
                          <button
                            onClick={() => setCupCountFor(v.id, getCupCount(v.id) + 1)}
                            style={{
                              width: '22px', height: '22px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '0.375rem',
                              background: '#0284C7', border: 'none',
                              cursor: 'pointer', color: '#fff', flexShrink: 0
                            }}
                          >
                            <Plus style={{ width: '11px', height: '11px' }} />
                          </button>
                        </div>
                      )}

                      {/* Tombol Aksi */}
                      {!isEditing ? (
                        <button
                          onClick={() => handleStartEdit(v)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem', fontWeight: 700,
                            background: '#FFFFFF',
                            color: '#334155',
                            border: '1.5px solid #CBD5E1',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.borderColor = '#7DD3FC'; e.currentTarget.style.color = '#0284C7'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#334155'; }}
                        >
                          <Edit2 style={{ width: '13px', height: '13px' }} />
                          <span>Edit Takaran</span>
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem', fontWeight: 700,
                              background: '#F1F5F9',
                              color: '#475569',
                              border: '1.5px solid #CBD5E1',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                          >
                            <X style={{ width: '13px', height: '13px' }} />
                            <span>Batal</span>
                          </button>

                          <button
                            onClick={() => handleSaveEdit(v.id, `${prod.name} ${v.sizeLabel}`)}
                            disabled={isSaving}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                              padding: '0.4rem 0.85rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem', fontWeight: 800,
                              background: 'linear-gradient(135deg, #16A34A, #15803D)',
                              color: '#FFFFFF',
                              border: 'none',
                              cursor: isSaving ? 'not-allowed' : 'pointer',
                              boxShadow: '0 3px 8px rgba(22,163,74,0.3)',
                              transition: 'all 0.15s ease',
                              opacity: isSaving ? 0.7 : 1
                            }}
                          >
                            <Save style={{ width: '13px', height: '13px' }} />
                            <span>{isSaving ? 'Menyimpan...' : 'Simpan Resep'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Recipe Ingredients Container */}
                    <div style={{ paddingTop: '0.625rem', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Takaran Bahan Baku {!isEditing && cups > 1 ? `(${cups} Cup):` : '(Per Porsi/Botol):'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {!isEditing && cups > 1 && (
                            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #86EFAC' }}>
                              Total HPP: Rp {totalHPPCups.toLocaleString('id-ID')} · Sales: Rp {totalSalesCups.toLocaleString('id-ID')}
                            </span>
                          )}
                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 600 }}>
                            {isEditing ? `${editingItems.length} bahan dimasukkan` : `${activeRecipeItems.length} bahan baku`}
                          </span>
                        </div>
                      </div>

                      {/* VIEW MODE: Hanya tampilkan bahan yang benar-benar dipakai di menu ini */}
                      {!isEditing && (
                        <>
                          {activeRecipeItems.length === 0 ? (
                            <div style={{
                              padding: '0.75rem 1rem',
                              background: '#F1F5F9',
                              borderRadius: '0.5rem',
                              border: '1px dashed #CBD5E1',
                              textAlign: 'center',
                              fontSize: '0.75rem',
                              color: '#64748B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}>
                              <AlertCircle style={{ width: '15px', height: '15px', color: '#94A3B8' }} />
                              <span>Belum ada bahan baku pada resep ini. Klik <strong>"Edit Takaran"</strong> untuk menambahkan formula.</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                              {activeRecipeItems.map((b) => {
                                const matId = b.materialId || b.raw_material_id;
                                const mat = materials.find(m => m.id === matId);
                                const qtyPerCup = Number(b.qty ?? b.qty_required ?? 0);
                                const qtyTotal = qtyPerCup * cups;
                                const cost = Math.round(qtyTotal * (mat?.unitPrice || 0));
                                const isMulti = cups > 1;

                                return (
                                  <div
                                    key={matId}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      fontSize: '0.8rem',
                                      padding: '0.35rem 0.5rem',
                                      borderRadius: '0.375rem',
                                      background: isMulti ? '#F0F9FF' : 'transparent',
                                      border: isMulti ? '1px solid #E0F2FE' : '1px solid transparent',
                                      borderBottom: isMulti ? '1px solid #E0F2FE' : '1px solid #F1F5F9',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284C7', flexShrink: 0 }} />
                                      <span style={{ color: '#334155', fontWeight: 600 }}>
                                        {mat?.name || 'Bahan Baku'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {isMulti && (
                                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                                          {qtyPerCup}×{cups} =
                                        </span>
                                      )}
                                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isMulti ? '#0284C7' : '#0F172A' }}>
                                        {isMulti ? qtyTotal.toLocaleString('id-ID') : qtyPerCup} {mat?.unit || ''}
                                      </span>
                                      <span style={{ fontSize: '0.71875rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                                        (Rp {cost.toLocaleString('id-ID')})
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}

                      {/* EDIT MODE: Dinamis bisa tambah bahan baru, ubah takaran, atau hapus bahan */}
                      {isEditing && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                          {editingItems.length === 0 ? (
                            <div style={{
                              padding: '0.75rem 1rem',
                              background: '#FFFBEB',
                              borderRadius: '0.5rem',
                              border: '1px dashed #FCD34D',
                              textAlign: 'center',
                              fontSize: '0.75rem',
                              color: '#92400E',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}>
                              <AlertCircle style={{ width: '15px', height: '15px', color: '#F59E0B' }} />
                              <span>Resep ini belum memiliki bahan baku. Pilih bahan baku dari opsi di bawah dan klik "Tambah".</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                              {editingItems.map((item) => {
                                const mat = materials.find(m => m.id === item.materialId);
                                const cost = Math.round((Number(item.qty) || 0) * (mat?.unitPrice || 0));

                                return (
                                  <div
                                    key={item.materialId}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0.45rem 0.625rem',
                                      background: '#F8FAFC',
                                      borderRadius: '0.5rem',
                                      border: '1.5px solid #E2E8F0',
                                      gap: '0.75rem',
                                      flexWrap: 'wrap'
                                    }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '140px' }}>
                                      <span style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.8125rem' }}>
                                        {mat?.name || 'Bahan Baku'}
                                      </span>
                                      <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                                        @ Rp {(mat?.unitPrice || 0).toLocaleString('id-ID')}/{mat?.unit || ''} &bull; Stok: {mat?.currentStock ?? 0} {mat?.unit || ''}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        background: '#FFFFFF',
                                        border: '1.5px solid #CBD5E1',
                                        borderRadius: '0.375rem',
                                        padding: '0.15rem 0.4rem'
                                      }}>
                                        <input
                                          type="number"
                                          step="any"
                                          min="0"
                                          value={item.qty}
                                          onChange={(e) => handleUpdateQty(item.materialId, e.target.value)}
                                          style={{
                                            width: '65px',
                                            border: 'none',
                                            outline: 'none',
                                            textAlign: 'right',
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 700,
                                            color: '#0F172A',
                                            fontSize: '0.8125rem'
                                          }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, fontFamily: 'var(--font-mono)', minWidth: '24px' }}>
                                          {mat?.unit || ''}
                                        </span>
                                      </div>

                                      <span style={{
                                        fontSize: '0.75rem',
                                        fontFamily: 'var(--font-mono)',
                                        fontWeight: 700,
                                        color: '#0369A1',
                                        minWidth: '70px',
                                        textAlign: 'right'
                                      }}>
                                        Rp {cost.toLocaleString('id-ID')}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.materialId)}
                                        title="Hapus bahan dari resep menu ini"
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '0.375rem',
                                          border: '1px solid #FECACA',
                                          background: '#FEF2F2',
                                          color: '#DC2626',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#F87171'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; }}
                                      >
                                        <Trash2 style={{ width: '13px', height: '13px' }} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Toolbar Tambah Bahan Baku Baru */}
                          {availableToAdd.length > 0 ? (
                            <div style={{
                              marginTop: '0.25rem',
                              padding: '0.625rem 0.75rem',
                              background: '#F0F9FF',
                              borderRadius: '0.5rem',
                              border: '1.5px dashed #BAE6FD',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.4rem'
                            }}>
                              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                + Tambah Bahan Baku ke Resep Menu Ini:
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                  value={selectedNewMaterial}
                                  onChange={(e) => setSelectedNewMaterial(e.target.value)}
                                  style={{
                                    flex: 2,
                                    minWidth: '150px',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1.5px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    fontSize: '0.78125rem',
                                    color: '#0F172A',
                                    outline: 'none',
                                    fontWeight: 600
                                  }}
                                >
                                  <option value="">-- Pilih Bahan Baku --</option>
                                  {availableToAdd.map(m => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.unit}) - Rp {m.unitPrice.toLocaleString('id-ID')}
                                    </option>
                                  ))}
                                </select>

                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  background: '#FFFFFF',
                                  border: '1.5px solid #CBD5E1',
                                  borderRadius: '0.375rem',
                                  padding: '0.2rem 0.4rem',
                                  flex: 1,
                                  minWidth: '95px'
                                }}>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="Takaran"
                                    value={selectedNewQty}
                                    onChange={(e) => setSelectedNewQty(e.target.value)}
                                    style={{
                                      width: '100%',
                                      border: 'none',
                                      outline: 'none',
                                      fontSize: '0.78125rem',
                                      textAlign: 'right',
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: 700
                                    }}
                                  />
                                  <span style={{ fontSize: '0.71875rem', color: '#64748B', fontWeight: 600 }}>
                                    {selectedNewMaterial ? materials.find(m => m.id === selectedNewMaterial)?.unit : ''}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleAddMaterialToRecipe}
                                  disabled={!selectedNewMaterial}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    background: selectedNewMaterial ? 'linear-gradient(135deg, #0284C7, #0369A1)' : '#94A3B8',
                                    color: '#FFFFFF',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: selectedNewMaterial ? 'pointer' : 'not-allowed',
                                    boxShadow: selectedNewMaterial ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  <Plus style={{ width: '13px', height: '13px' }} />
                                  <span>Tambah</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.71875rem', color: '#64748B', fontStyle: 'italic', padding: '0.25rem 0' }}>
                              Semua bahan baku inventori sudah dimasukkan ke dalam resep ini.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Margin summary */}
                    <div style={{ paddingTop: '0.625rem', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748B' }}>Margin Kotor Per Porsi:</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: currentMargin >= 0 ? '#15803D' : '#DC2626'
                      }}>
                        Rp {currentMargin.toLocaleString('id-ID')} ({marginPercent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
