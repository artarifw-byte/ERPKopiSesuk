import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  Printer,
  PlusCircle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export const OrdersModule = ({ onOpenNewOrder, onShowReceipt }) => {
  const { orders, completeOrder, markOrderPaid } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // { [orderId]: paymentMethod } untuk konfirmasi lunas
  const [confirmPayMethod, setConfirmPayMethod] = useState({});
  const [confirmingId, setConfirmingId] = useState(null);

  const filteredOrders = orders.filter(ord => {
    // 1. Global Keyword Search
    const q = searchQuery.toLowerCase().trim();
    const itemNames = (ord.items || []).map(it => it.productName || '').join(' ').toLowerCase();
    const matchesSearch =
      !q ||
      ord.orderNumber.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      (ord.segment || '').toLowerCase().includes(q) ||
      itemNames.includes(q);

    // 2. Status Filter
    const matchesStatus = selectedStatus === 'ALL' || ord.status === selectedStatus;
    if (!matchesSearch || !matchesStatus) return false;

    // 3. Date / Period Filter
    const orderDate = new Date(ord.deliveryDate || ord.createdAt);
    const now = new Date();
    if (periodFilter === 'THIS_MONTH') {
      if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) {
        return false;
      }
    } else if (periodFilter === 'LAST_MONTH') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      if (orderDate.getMonth() !== lastMonth || orderDate.getFullYear() !== lastYear) {
        return false;
      }
    } else if (periodFilter === 'THIS_YEAR') {
      if (orderDate.getFullYear() !== now.getFullYear()) return false;
    } else if (periodFilter === 'CUSTOM') {
      if (startDate && ord.deliveryDate < startDate) return false;
      if (endDate && ord.deliveryDate > endDate) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, periodFilter, startDate, endDate]);

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
            Navigasi Pencarian Seragam, Filter Periode Cepat & Pembatasan 10 Baris/Halaman
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

      {/* Filters (FSD v1.1 Section 3) */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
          {/* Global Search */}
          <div style={{ position: 'relative', width: '320px', minWidth: '240px' }}>
            <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Cari No. Order, Customer, Produk, Instansi..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
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
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            {/* Quick Period Filter Dropdown */}
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
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
            >
              <option value="ALL">Semua Periode</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="LAST_MONTH">Bulan Lalu</option>
              <option value="THIS_YEAR">Tahun Ini</option>
              <option value="CUSTOM">Rentang Tanggal Kustom...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {periodFilter === 'CUSTOM' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 0.875rem', background: '#F0F9FF',
            borderRadius: '0.625rem', border: '1px solid #BAE6FD',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>Rentang Pengiriman:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', fontSize: '0.75rem' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', fontSize: '0.75rem' }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset
              </button>
            )}
          </div>
        )}
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
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                    Tidak ada transaksi order yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord) => (
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

        {/* Standard Table Pagination (FSD v1.1 Section 3: 10 items/page) */}
        <div style={{
          padding: '0.875rem 1.25rem',
          borderTop: '1.5px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
            Menampilkan <strong style={{ color: '#0F172A' }}>{filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> - <strong style={{ color: '#0F172A' }}>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> dari <strong style={{ color: '#0F172A' }}>{filteredOrders.length}</strong> pesanan (Standar 10 baris/halaman)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: '#FFFFFF', color: currentPage === 1 ? '#CBD5E1' : '#475569',
                border: '1.5px solid #E2E8F0', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronsLeft style={{ width: '14px', height: '14px' }} />
              First
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: '#FFFFFF', color: currentPage === 1 ? '#CBD5E1' : '#475569',
                border: '1.5px solid #E2E8F0', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
              Prev
            </button>

            <span style={{
              padding: '0.4rem 0.875rem', borderRadius: '0.5rem',
              fontSize: '0.75rem', fontWeight: 800,
              background: '#0284C7', color: '#FFFFFF', fontFamily: 'var(--font-mono)'
            }}>
              Halaman {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: '#FFFFFF', color: currentPage === totalPages ? '#CBD5E1' : '#475569',
                border: '1.5px solid #E2E8F0', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                padding: '0.4rem 0.65rem', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontWeight: 700,
                background: '#FFFFFF', color: currentPage === totalPages ? '#CBD5E1' : '#475569',
                border: '1.5px solid #E2E8F0', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Last
              <ChevronsRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
