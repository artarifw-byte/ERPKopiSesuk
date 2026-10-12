import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { X, PackageCheck, CheckCircle2 } from 'lucide-react';

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#475569',
  marginBottom: '0.4rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.875rem',
  background: '#F8FAFC',
  border: '1.5px solid #E2E8F0',
  borderRadius: '0.625rem',
  color: '#0F172A',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.18s, box-shadow 0.18s',
};

export const StockInModal = ({ isOpen, onClose }) => {
  const { materials, addMaterialStock } = useERP();

  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || '');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [supplierName, setSupplierName] = useState('Vendor Kopi General');

  if (!isOpen) return null;

  const currentMaterial = materials.find(m => m.id === selectedMaterialId) || materials[0];

  const handleFocus = (e) => {
    e.target.style.borderColor = '#0284C7';
    e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.12)';
    e.target.style.background = '#fff';
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = '#E2E8F0';
    e.target.style.boxShadow = 'none';
    e.target.style.background = '#F8FAFC';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!qty || parseFloat(qty) <= 0) return;

    addMaterialStock({
      materialId: selectedMaterialId,
      qty: parseFloat(qty),
      unitPrice: unitPrice ? parseFloat(unitPrice) : currentMaterial.unitPrice,
      isCredit,
      supplierName: isCredit ? supplierName : 'Tunai Kas Toko'
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div style={{
          padding: '1.125rem 1.5rem',
          borderBottom: '1.5px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
          borderRadius: '1.5rem 1.5rem 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #16A34A, #15803D)',
              borderRadius: '0.625rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
            }}>
              <PackageCheck style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.9375rem', lineHeight: 1.2 }}>
                Penerimaan Bahan Baku
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
                Tambah stok & posting jurnal otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '0.5rem',
              background: '#F1F5F9', border: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748B', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {/* Pilih Bahan */}
          <div>
            <label style={labelStyle}>Pilih Bahan Baku *</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => {
                setSelectedMaterialId(e.target.value);
                const m = materials.find(mat => mat.id === e.target.value);
                if (m) setUnitPrice(m.unitPrice);
              }}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={handleFocus} onBlur={handleBlur}
            >
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} (Stok: {m.currentStock} {m.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Qty & Harga */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Jumlah Diterima ({currentMaterial?.unit}) *</label>
              <input
                type="number" step="0.01" required
                placeholder="Jumlah ml/gram/pcs..."
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus} onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={labelStyle}>Harga Satuan (Rp/{currentMaterial?.unit})</label>
              <input
                type="number"
                placeholder={`Default: Rp ${currentMaterial?.unitPrice}`}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus} onBlur={handleBlur}
              />
            </div>
          </div>

          {/* Metode Pembelian */}
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
              Metode Pembelian
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <button
                type="button"
                onClick={() => setIsCredit(false)}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1.5px solid',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: !isCredit ? '#F0FDF4' : '#F8FAFC',
                  color: !isCredit ? '#16A34A' : '#64748B',
                  borderColor: !isCredit ? '#86EFAC' : '#E2E8F0',
                  textAlign: 'center',
                }}
              >
                💵 Tunai<br />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8 }}>Debet Persediaan / Kredit Kas</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCredit(true)}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: '1.5px solid',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: isCredit ? '#FFF7ED' : '#F8FAFC',
                  color: isCredit ? '#C2410C' : '#64748B',
                  borderColor: isCredit ? '#FDBA74' : '#E2E8F0',
                  textAlign: 'center',
                }}
              >
                🏦 Kredit Vendor<br />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8 }}>Debet Persediaan / Kredit Hutang</span>
              </button>
            </div>
          </div>

          {/* Supplier name if credit */}
          {isCredit && (
            <div>
              <label style={labelStyle}>Nama Supplier / Vendor</label>
              <input
                type="text"
                placeholder="Contoh: PT Diamond Cold Storage / CV Aren Jaya..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus} onBlur={handleBlur}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1.5px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                background: '#F1F5F9',
                color: '#475569',
                border: '1.5px solid #E2E8F0',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
              onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
            >
              Batal
            </button>
            <button
              type="submit"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #16A34A, #15803D)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
              }}
            >
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              Simpan Penerimaan Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
