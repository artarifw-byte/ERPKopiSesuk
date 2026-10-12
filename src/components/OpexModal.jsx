import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { X, TrendingUp, CheckCircle2 } from 'lucide-react';

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

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#475569',
  marginBottom: '0.4rem',
};

export const OpexModal = ({ isOpen, onClose }) => {
  const { addOpex } = useERP();

  const [category, setCategory] = useState('Sewa Tempat & Booth CFD');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

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
    if (!amount || parseFloat(amount) <= 0) return;
    addOpex({
      date, category,
      description: description.trim() || category,
      amount: parseFloat(amount),
      paymentAccountCode: '101'
    });
    onClose();
    setDescription('');
    setAmount('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>

        {/* Header */}
        <div style={{
          padding: '1.125rem 1.5rem',
          borderBottom: '1.5px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#F8FAFC',
          borderRadius: '1.5rem 1.5rem 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              borderRadius: '0.625rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
            }}>
              <TrendingUp style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.9375rem', lineHeight: 1.2 }}>Input Biaya Operasional (OPEX)</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>Posting otomatis ke Jurnal Umum</p>
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

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Kategori & Tanggal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Kategori Biaya *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="Sewa Tempat & Booth CFD">Sewa Tempat & Booth CFD</option>
                <option value="Listrik & Utilitas">Listrik & Utilitas</option>
                <option value="Pemasaran & Stiker Promosi">Pemasaran & Stiker Promosi</option>
                <option value="Packaging & Transportasi">Packaging & Transportasi</option>
                <option value="Gaji & Operasional Karyawan">Gaji & Operasional Karyawan</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tanggal Pengeluaran *</label>
              <input
                type="date" required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus} onBlur={handleBlur}
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={labelStyle}>Jumlah Biaya (Rp) *</label>
            <input
              type="number" required
              placeholder="Jumlah biaya dalam Rupiah..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: '#0284C7' }}
              onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Keterangan / Rincian Biaya</label>
            <textarea
              rows="2"
              placeholder="Rincian pembayaran..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>

          {/* Info Note */}
          <div style={{
            padding: '0.75rem 1rem',
            background: '#EFF6FF',
            border: '1.5px solid #BFDBFE',
            borderRadius: '0.75rem',
            fontSize: '0.8rem',
            color: '#1D4ED8',
            lineHeight: 1.6,
          }}>
            📒 Setiap OPEX otomatis diposting ke Jurnal: <strong>Debet 601 Beban Operasional</strong> → <strong>Kredit 101 Kas/Bank</strong>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1.5px solid #E2E8F0' }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
                fontSize: '0.875rem', fontWeight: 700,
                background: '#F1F5F9', color: '#475569',
                border: '1.5px solid #E2E8F0', cursor: 'pointer',
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
                padding: '0.6rem 1.5rem', borderRadius: '0.75rem',
                fontSize: '0.875rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
              }}
            >
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              Simpan OPEX & Post Jurnal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
