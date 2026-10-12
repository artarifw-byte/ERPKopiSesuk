import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { Package, X, Check, AlertCircle, Save } from 'lucide-react';

export const MaterialModal = ({ isOpen, onClose, materialToEdit = null }) => {
  const { addMaterial, updateMaterial } = useERP();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('gram');
  const [currentStock, setCurrentStock] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [avgDailyUsage, setAvgDailyUsage] = useState(100);
  const [maxDailyUsage, setMaxDailyUsage] = useState(250);
  const [avgLeadTimeDays, setAvgLeadTimeDays] = useState(2);
  const [maxLeadTimeDays, setMaxLeadTimeDays] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (materialToEdit) {
      setName(materialToEdit.name || '');
      setUnit(materialToEdit.unit || materialToEdit.base_unit || 'gram');
      setCurrentStock(materialToEdit.currentStock ?? materialToEdit.current_stock ?? 0);
      setUnitPrice(materialToEdit.unitPrice ?? materialToEdit.unit_price ?? 0);
      setAvgDailyUsage(materialToEdit.avgDailyUsage ?? materialToEdit.avg_daily_usage ?? 100);
      setMaxDailyUsage(materialToEdit.maxDailyUsage ?? materialToEdit.max_daily_usage ?? 250);
      setAvgLeadTimeDays(materialToEdit.avgLeadTimeDays ?? materialToEdit.avg_lead_time_days ?? 2);
      setMaxLeadTimeDays(materialToEdit.maxLeadTimeDays ?? materialToEdit.max_lead_time_days ?? 4);
    } else {
      setName('');
      setUnit('gram');
      setCurrentStock(0);
      setUnitPrice(0);
      setAvgDailyUsage(100);
      setMaxDailyUsage(250);
      setAvgLeadTimeDays(2);
      setMaxLeadTimeDays(4);
    }
    setError('');
  }, [materialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama bahan baku wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        unit: unit.trim(),
        currentStock: Number(currentStock) || 0,
        unitPrice: Number(unitPrice) || 0,
        avgDailyUsage: Number(avgDailyUsage) || 0,
        maxDailyUsage: Number(maxDailyUsage) || 0,
        avgLeadTimeDays: Number(avgLeadTimeDays) || 1,
        maxLeadTimeDays: Number(maxLeadTimeDays) || 2
      };

      if (materialToEdit) {
        await updateMaterial(materialToEdit.id, payload);
      } else {
        await addMaterial(payload);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan bahan baku.');
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
        maxWidth: '540px',
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
              background: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                {materialToEdit ? 'Edit Data Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                Data akan tersimpan langsung ke database Supabase
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

        {/* Form Body */}
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

          {/* Nama Bahan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
              Nama Bahan Baku *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Susu Oat, Sirup Hazelnut, Matcha Powder"
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

          {/* Satuan & Harga Baseline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                Satuan Ukuran *
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
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
                <option value="ml">ml (Mililiter)</option>
                <option value="gram">gram (Gram)</option>
                <option value="pcs">pcs (Pieces / Buah)</option>
                <option value="botol">botol (Botol)</option>
                <option value="kg">kg (Kilogram)</option>
                <option value="liter">liter (Liter)</option>
                <option value="pack">pack (Kemasan)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                Harga Satuan (Rp) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                placeholder="0"
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
          </div>

          {/* Stok Awal (jika tambah baru) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
              {materialToEdit ? 'Stok Saat Ini' : 'Stok Awal'} ({unit})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={currentStock}
              onChange={e => setCurrentStock(e.target.value)}
              placeholder="0"
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

          {/* Parameter Perhitungan SS & ROP */}
          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '0.875rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Parameter Safety Stock (SS) & Reorder Point (ROP)
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#64748B', marginBottom: '0.25rem' }}>
                  Rata-rata Pemakaian / Hari ({unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={avgDailyUsage}
                  onChange={e => setAvgDailyUsage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.8rem',
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#64748B', marginBottom: '0.25rem' }}>
                  Maksimum Pemakaian / Hari ({unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxDailyUsage}
                  onChange={e => setMaxDailyUsage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.8rem',
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#64748B', marginBottom: '0.25rem' }}>
                  Avg Lead Time (Hari)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={avgLeadTimeDays}
                  onChange={e => setAvgLeadTimeDays(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.8rem',
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#64748B', marginBottom: '0.25rem' }}>
                  Max Lead Time (Hari)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={maxLeadTimeDays}
                  onChange={e => setMaxLeadTimeDays(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.8rem',
                    color: '#0F172A',
                    fontWeight: 600
                  }}
                />
              </div>
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
                  <span>{materialToEdit ? 'Simpan Perubahan' : 'Tambah ke Database'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
