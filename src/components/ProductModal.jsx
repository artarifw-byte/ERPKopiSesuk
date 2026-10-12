import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Coffee, X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

export const ProductModal = ({ isOpen, onClose }) => {
  const { addProduct } = useERP();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Kopi');
  const [variants, setVariants] = useState([
    { sizeLabel: '250 ml (Cup)', sizeMl: 250, sellingPrice: 15000 },
    { sizeLabel: '1 Liter (Botol)', sizeMl: 1000, sellingPrice: 55000 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddVariant = () => {
    setVariants(prev => [
      ...prev,
      { sizeLabel: '500 ml (Cup)', sizeMl: 500, sellingPrice: 28000 }
    ]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length <= 1) return;
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama produk minuman wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addProduct({
        name: name.trim(),
        code: code.trim() || `PROD-${name.trim().substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        category: category.trim(),
        variants: variants.map(v => ({
          sizeLabel: v.sizeLabel,
          sizeMl: Number(v.sizeMl) || 250,
          sellingPrice: Number(v.sellingPrice) || 0
        }))
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        maxWidth: '620px',
        border: '1.5px solid #CBD5E1',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1.5px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '0.75rem',
              background: '#FEF3C7',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Coffee style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Tambah Produk Minuman Baru
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                Barang jadi / menu jualan beserta ukuran & harga jualnya
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.5rem',
              border: '1.5px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              background: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              color: '#B91C1C',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                Nama Menu Minuman *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: Caramel Macchiato"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.625rem',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.85rem',
                  color: '#0F172A',
                  outline: 'none',
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                Kategori
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.625rem',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.85rem',
                  color: '#0F172A',
                  outline: 'none',
                  fontWeight: 600,
                  background: '#FFFFFF'
                }}
              >
                <option value="Kopi">Kopi (Coffee)</option>
                <option value="Non-Kopi">Non-Kopi</option>
                <option value="Signature">Signature</option>
                <option value="Snack">Snack & Makanan</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
              Kode Produk (SKU)
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Auto-generate jika dikosongkan (cth: PROD-CRM)"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.625rem',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#0F172A',
                outline: 'none',
                fontWeight: 600
              }}
            />
          </div>

          {/* Varian Ukuran & Harga */}
          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '0.875rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Varian Ukuran Porsi & Harga Jual
              </span>
              <button
                type="button"
                onClick={handleAddVariant}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  color: '#0284C7',
                  background: '#E0F2FE',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Plus style={{ width: '12px', height: '12px' }} />
                Tambah Ukuran
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr) minmax(0, 1.3fr) 34px', gap: '0.5rem', paddingBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Label Ukuran</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Volume (ml)</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>Harga Jual (Rp)</span>
              <span />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {variants.map((v, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr) minmax(0, 1.3fr) 34px', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={v.sizeLabel}
                    onChange={e => handleVariantChange(i, 'sizeLabel', e.target.value)}
                    placeholder="Contoh: 250 ml (Cup)"
                    style={{
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.5rem',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.785rem',
                      fontWeight: 600
                    }}
                  />
                  <input
                    type="number"
                    value={v.sizeMl}
                    onChange={e => handleVariantChange(i, 'sizeMl', e.target.value)}
                    placeholder="250"
                    style={{
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.5rem',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.785rem',
                      fontWeight: 600
                    }}
                  />
                  <input
                    type="number"
                    value={v.sellingPrice}
                    onChange={e => handleVariantChange(i, 'sellingPrice', e.target.value)}
                    placeholder="15000"
                    style={{
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.5rem',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.785rem',
                      fontWeight: 700,
                      color: '#0284C7'
                    }}
                  />
                  {variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '0.5rem',
                        border: '1px solid #FCA5A5',
                        background: '#FEF2F2',
                        color: '#EF4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      title="Hapus varian"
                    >
                      <Trash2 style={{ width: '13px', height: '13px' }} />
                    </button>
                  ) : (
                    <div style={{ width: '34px' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.55rem 1.125rem',
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
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 1.25rem',
                borderRadius: '0.625rem',
                fontSize: '0.825rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                border: 'none',
                color: '#FFFFFF',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              {loading ? (
                <span>Menyimpan ke Supabase...</span>
              ) : (
                <>
                  <Save style={{ width: '15px', height: '15px' }} />
                  <span>Simpan Produk ke Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
