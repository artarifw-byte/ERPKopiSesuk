import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { X, Plus, Trash2, Calendar, CheckCircle2, Package } from 'lucide-react';

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#475569',
  marginBottom: '0.4rem',
  letterSpacing: '0.01em',
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

const sectionTitle = {
  fontSize: '0.7rem',
  fontWeight: 800,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '0.875rem',
};

export const NewOrderModal = ({ isOpen, onClose }) => {
  const { products, getVariantsWithHPP, createOrder } = useERP();

  const [customerName, setCustomerName] = useState('');
  const [segment, setSegment] = useState('OTHER');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('PENDING');
  const [paymentStatus, setPaymentStatus] = useState('DP');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  if (!isOpen) return null;

  const variants = getVariantsWithHPP();

  const isOneLiterVariant = (sizeLabel) => {
    return sizeLabel && (sizeLabel.toLowerCase().includes('1 liter') || sizeLabel.toLowerCase().includes('1l'));
  };

  const handleAddItem = (variantId) => {
    const v = variants.find(item => item.id === variantId);
    if (!v) return;
    const is1L = isOneLiterVariant(v.sizeLabel);
    const initialQty = 1;
    const initialPrice = is1L ? 60000 : (v.sellingPrice || 0);

    setItems(prev => [
      ...prev,
      {
        variantId: v.id,
        productName: v.productName,
        sizeLabel: v.sizeLabel,
        sugarLevel: 'Normal',
        qty: initialQty,
        unitPrice: initialPrice
      }
    ]);
  };

  const handleUpdateItem = (index, field, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updatedItem = { ...item, [field]: value };
      if (field === 'qty' && isOneLiterVariant(item.sizeLabel)) {
        const numQty = Number(value) || 0;
        updatedItem.unitPrice = numQty >= 2 ? 55000 : 60000;
      }
      return updatedItem;
    }));
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;
    createOrder({
      orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName.trim(),
      segment, deliveryDate, status, paymentStatus, paymentMethod, notes, items
    });
    onClose();
    setCustomerName('');
    setItems([]);
  };

  const totalValue = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '720px' }}>

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
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
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              borderRadius: '0.625rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
            }}>
              <Calendar style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '0.9375rem', lineHeight: 1.2 }}>
                Order Baru / Pre-Order (PO)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.125rem' }}>
                Isi detail pesanan & produk di bawah ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px',
              borderRadius: '0.5rem',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748B',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Section 1: Customer & Segment */}
          <div>
            <p style={sectionTitle}>📋 Informasi Pelanggan</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.875rem', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Nama Pelanggan / Instansi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BNPP Kantor Pusat / BAF Event / Nama Customer..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#0284C7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.12)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Segmen</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', width: 'auto', minWidth: '130px' }}
                  onFocus={e => { e.target.style.borderColor = '#0284C7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="BNPP">BNPP</option>
                  <option value="BAF">BAF</option>
                  <option value="CFD">CFD</option>
                  <option value="POS">POS Langsung</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Schedule & Payment */}
          <div>
            <p style={sectionTitle}>💳 Jadwal & Pembayaran</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
              <div>
                <label style={labelStyle}>Tgl Pengiriman (Jadwal PO) *</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#0284C7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Status Verifikasi *</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#0284C7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="DP">DP (Uang Muka)</option>
                  <option value="LUNAS">LUNAS</option>
                  <option value="BELUM_BAYAR">Belum Bayar</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Metode Pembayaran *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#0284C7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                  <option value="CASH">Tunai / Cash</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Products */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <p style={{ ...sectionTitle, marginBottom: 0 }}>📦 Daftar Produk Pesanan</p>
              <select
                onChange={(e) => {
                  if (e.target.value) { handleAddItem(e.target.value); e.target.value = ''; }
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  borderRadius: '0.5rem',
                  color: '#1D4ED8',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">+ Tambah Produk Varian...</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.productName} - {v.sizeLabel} (Rp {v.sellingPrice.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            {items.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '2rem',
                background: '#F8FAFC', borderRadius: '0.875rem',
                border: '1.5px dashed #CBD5E1',
              }}>
                <Package style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', color: '#CBD5E1' }} />
                <p style={{ fontSize: '0.8125rem', color: '#94A3B8', fontWeight: 600 }}>Belum ada produk ditambahkan.</p>
                <p style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>Pilih varian dari dropdown di atas.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '0.75rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '130px' }}>
                      <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8125rem', display: 'block' }}>{item.productName}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>{item.sizeLabel}</span>
                    </div>

                    <select
                      value={item.sugarLevel}
                      onChange={(e) => handleUpdateItem(idx, 'sugarLevel', e.target.value)}
                      style={{
                        padding: '0.35rem 0.6rem',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '0.5rem',
                        color: '#1D4ED8',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="Normal">Normal Sugar</option>
                      <option value="Less Sugar">Less Sugar</option>
                      <option value="No Sugar">No Sugar</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(idx, 'qty', parseInt(e.target.value) || 1)}
                        style={{
                          width: '64px', padding: '0.35rem 0.5rem',
                          background: '#fff',
                          border: '1.5px solid #E2E8F0',
                          borderRadius: '0.5rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: '#0F172A',
                          outline: 'none',
                        }}
                        onFocus={e => { e.target.style.borderColor = '#0284C7'; }}
                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
                      />
                    </div>

                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8125rem', color: '#0369A1', minWidth: '90px', textAlign: 'right' }}>
                      Rp {(item.unitPrice * item.qty).toLocaleString('id-ID')}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{
                        width: '28px', height: '28px',
                        borderRadius: '0.5rem',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#DC2626',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Trash2 style={{ width: '13px', height: '13px' }} />
                    </button>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem',
                  background: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  borderRadius: '0.75rem',
                  marginTop: '0.25rem',
                }}>
                  <span style={{ fontWeight: 700, color: '#1D4ED8', fontSize: '0.8125rem' }}>Total Estimasi:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.0625rem', color: '#1D4ED8' }}>
                    Rp {totalValue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Catatan Order (Opsional)</label>
            <textarea
              rows="2"
              placeholder="Instruksi pengiriman, lokasi booth, catatan khusus..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => { e.target.style.borderColor = '#0284C7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.12)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1.5px solid #E2E8F0',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                background: '#F1F5F9',
                color: '#475569',
                border: '1.5px solid #E2E8F0',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={items.length === 0 || !customerName.trim()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 800,
                background: items.length === 0 ? '#E2E8F0' : 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: items.length === 0 ? '#94A3B8' : '#fff',
                border: 'none',
                cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: items.length > 0 ? '0 4px 14px rgba(2,132,199,0.3)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              Simpan Order PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
