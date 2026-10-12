import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  Printer,
  PlusCircle,
  Banknote,
} from 'lucide-react';

export const OrdersModule = ({ onOpenNewOrder, onShowReceipt }) => {
  const { orders, completeOrder, markOrderPaid } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  // { [orderId]: paymentMethod } untuk konfirmasi lunas
  const [confirmPayMethod, setConfirmPayMethod] = useState({});
  const [confirmingId, setConfirmingId] = useState(null);

  const filteredOrders = orders.filter(ord => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || ord.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck style={{ width: '22px', height: '22px', color: '#0284C7' }} />
            Jadwal Pre-Order (PO) & Penjualan
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
            Kelola Jadwal Pre-Order, Status Pesanan, dan Bukti Cetak
          </p>
        </div>
        <button
          onClick={onOpenNewOrder}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.55rem 1.125rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #0284C7, #0369A1)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
          }}
        >
          <PlusCircle style={{ width: '15px', height: '15px' }} />
          Buat PO / Order Baru
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Cari No. Order / Nama Pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '0.625rem',
              fontSize: '0.8125rem',
              color: '#0F172A',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = '#0284C7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Status Select */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '0.5rem 0.875rem',
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '0.625rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#0F172A',
            cursor: 'pointer',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#0284C7'}
          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
        >
          <option value="ALL">Semua Status</option>
          <option value="PENDING">PENDING</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Nama Pelanggan</th>
                <th>Tgl Pengiriman</th>
                <th>Detail Item</th>
                <th>Total Sales / HPP</th>
                <th>Pembayaran</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                    Tidak ada transaksi order yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7', fontSize: '0.8rem' }}>
                      {ord.orderNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>{ord.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>{ord.paymentMethod}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569' }}>
                      {ord.deliveryDate}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {ord.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: '#475569' }}>
                            <span style={{ fontWeight: 800, color: '#0284C7', fontFamily: 'var(--font-mono)' }}>{item.qty}x</span>
                            <span>{item.productName} ({item.sizeLabel})</span>
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.375rem', borderRadius: '0.375rem', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', fontWeight: 600 }}>
                              {item.sugarLevel}
                            </span>
                          </div>
                        ))}
                        {ord.notes && (
                          <p style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic', marginTop: '0.125rem' }}>"{ord.notes}"</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#0F172A', fontSize: '0.875rem' }}>
                        Rp {(ord.totalAmount || 0).toLocaleString('id-ID')}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B' }}>
                        HPP: Rp {(ord.totalHPP || 0).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800,
                        padding: '0.2rem 0.625rem', borderRadius: '9999px',
                        background: ord.paymentStatus === 'LUNAS' ? '#DCFCE7' : '#FEF3C7',
                        color: ord.paymentStatus === 'LUNAS' ? '#15803D' : '#B45309',
                        border: `1px solid ${ord.paymentStatus === 'LUNAS' ? '#86EFAC' : '#FDE68A'}`,
                      }}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ord.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {ord.status === 'PENDING' && (
                          <button
                            onClick={() => completeOrder(ord.id)}
                            title="Selesaikan order & potong stok BOM otomatis"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.35rem 0.7rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.75rem', fontWeight: 700,
                              background: 'linear-gradient(135deg, #16A34A, #15803D)',
                              color: '#fff', border: 'none', cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                            }}
                          >
                            <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                            Proses & Potong Stok
                          </button>
                        )}

                        {/* Tombol Konfirmasi Lunas — muncul jika belum LUNAS */}
                        {ord.paymentStatus !== 'LUNAS' && (
                          confirmingId === ord.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                              <select
                                value={confirmPayMethod[ord.id] || ord.paymentMethod || 'TRANSFER'}
                                onChange={e => setConfirmPayMethod(prev => ({ ...prev, [ord.id]: e.target.value }))}
                                style={{
                                  padding: '0.3rem 0.4rem',
                                  borderRadius: '0.375rem',
                                  border: '1.5px solid #86EFAC',
                                  background: '#F0FDF4',
                                  fontSize: '0.7rem', fontWeight: 700,
                                  color: '#15803D', cursor: 'pointer', outline: 'none'
                                }}
                              >
                                <option value="TRANSFER">Transfer</option>
                                <option value="QRIS">QRIS</option>
                                <option value="CASH">Cash</option>
                              </select>
                              <button
                                onClick={async () => {
                                  setConfirmingId(null);
                                  await markOrderPaid(ord.id, confirmPayMethod[ord.id] || ord.paymentMethod);
                                }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.7rem', fontWeight: 800,
                                  background: 'linear-gradient(135deg, #16A34A, #15803D)',
                                  color: '#fff', border: 'none', cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                                }}
                              >
                                <CheckCircle2 style={{ width: '11px', height: '11px' }} />
                                OK
                              </button>
                              <button
                                onClick={() => setConfirmingId(null)}
                                style={{
                                  padding: '0.3rem 0.4rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.7rem', fontWeight: 700,
                                  background: '#F1F5F9', color: '#64748B',
                                  border: '1px solid #E2E8F0', cursor: 'pointer'
                                }}
                              >✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmPayMethod(prev => ({ ...prev, [ord.id]: ord.paymentMethod || 'TRANSFER' }));
                                setConfirmingId(ord.id);
                              }}
                              title="Konfirmasi pembayaran sudah diterima (LUNAS)"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.72rem', fontWeight: 700,
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                color: '#fff', border: 'none', cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
                              }}
                            >
                              <Banknote style={{ width: '12px', height: '12px' }} />
                              Lunas
                            </button>
                          )
                        )}

                        <button
                          onClick={() => onShowReceipt(ord)}
                          title="Cetak Struk Penjualan"
                          style={{
                            width: '30px', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '0.5rem',
                            background: '#F0F9FF', border: '1.5px solid #BAE6FD',
                            cursor: 'pointer', color: '#0284C7', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#E0F2FE'}
                          onMouseLeave={e => e.currentTarget.style.background = '#F0F9FF'}
                        >
                          <Printer style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
