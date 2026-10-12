import React from 'react';
import { X, Printer, Coffee, CheckCircle2 } from 'lucide-react';

export const ReceiptModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => window.print();

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>

        {/* Header */}
        <div
          className="no-print"
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1.5px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#F8FAFC',
            borderRadius: '1.5rem 1.5rem 0 0',
          }}
        >
          <h4 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>Struk Penjualan / Invoice</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4rem 0.875rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 3px 8px rgba(2,132,199,0.3)',
              }}
            >
              <Printer style={{ width: '13px', height: '13px' }} />
              Cetak Struk
            </button>
            <button
              onClick={onClose}
              style={{
                width: '30px', height: '30px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '0.5rem',
                background: '#F1F5F9', border: '1px solid #E2E8F0',
                cursor: 'pointer', color: '#64748B',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>

        {/* Printable Receipt */}
        <div
          id="printable-struk"
          style={{
            padding: '1.5rem',
            background: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            borderRadius: '0 0 1.5rem 1.5rem',
          }}
        >
          {/* Brand */}
          <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '1.5px dashed #E2E8F0', marginBottom: '1rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.625rem',
              boxShadow: '0 4px 12px rgba(2,132,199,0.25)',
            }}>
              <Coffee style={{ width: '22px', height: '22px', color: '#fff' }} />
            </div>
            <h2 style={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>KOPI SESUK</h2>
            <p style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>Jualan PO Instansi & CFD Lapangan</p>
            <p style={{ fontSize: '0.7rem', color: '#64748B' }}>Jl. Sudirman No. 88, Jakarta</p>
          </div>

          {/* Order Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', paddingBottom: '0.875rem', borderBottom: '1.5px dashed #E2E8F0', marginBottom: '0.875rem' }}>
            {[
              ['No. Nota', order.orderNumber],
              ['Tanggal', order.deliveryDate],
              ['Pelanggan', order.customerName],
              ['Metode', order.paymentMethod],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>{label}:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingBottom: '0.875rem', borderBottom: '1.5px dashed #E2E8F0', marginBottom: '0.875rem' }}>
            {order.items.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0F172A' }}>
                  <span>{item.productName} ({item.sizeLabel})</span>
                  <span>Rp {(item.unitPrice * item.qty).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  {item.qty} x Rp {item.unitPrice.toLocaleString('id-ID')} · Gula: {item.sugarLevel}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.9rem', color: '#0284C7' }}>
              <span>TOTAL SALES:</span>
              <span>Rp {(order.totalAmount || 0).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
              <span style={{ color: '#64748B' }}>Status Bayar:</span>
              <span style={{ fontWeight: 700, color: '#16A34A' }}>{order.paymentStatus}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
              <span style={{ color: '#64748B' }}>Status Order:</span>
              <span style={{ fontWeight: 700, color: '#16A34A' }}>{order.status}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1.5px dashed #E2E8F0', fontSize: '0.7rem', color: '#94A3B8' }}>
            Terima kasih atas pesanan Kopi Sesuk! ☕<br />
            Resep Otentik & Stok Bahan Baku Terpusat.
          </div>
        </div>
      </div>
    </div>
  );
};
