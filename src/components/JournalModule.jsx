import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import {
  BookOpenCheck,
  TrendingUp,
  PlusCircle,
  Receipt,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Flame,
  Wrench
} from 'lucide-react';

export const JournalModule = ({ onOpenOpex, onOpenStockIn }) => {
  const { journal, coa } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  let totalDebits = 0;
  let totalCredits = 0;
  journal.forEach(entry => {
    (entry.items || []).forEach(item => {
      totalDebits += Number(item.debit) || 0;
      totalCredits += Number(item.credit) || 0;
    });
  });

  const isBalanced = totalDebits === totalCredits;

  const autoJournalRules = [
    { event: 'Penerimaan Hasil Sales / PO', debet: '101 - Kas / Bank', kredit: '401 - Pendapatan Sales', note: 'Kas masuk hasil penjualan tunai/QRIS/transfer' },
    { event: 'Pengakuan HPP saat Transaksi', debet: '501 - BPP (HPP Kopi)', kredit: '102 - Persediaan Bahan', note: 'Deduksi otomatis persediaan sesuai formula BOM' },
    { event: 'OPEX Pengeluaran Rutin', debet: '502 - Beban Operasional', kredit: '101 - Kas / Bank', note: 'Beban listrik, kebersihan, air, sewa tempat CFD' },
    { event: 'OPEX Waste CFD (Produk Sisa/Rusak)', debet: '504 - Beban Waste CFD', kredit: '102 - Persediaan Bahan', note: 'Kerugian produk CFD olahan tidak laku / rusak' },
    { event: 'CAPEX Aset Peralatan', debet: '103 - Aset Tetap Peralatan', kredit: '101 - Kas / 201 - Hutang', note: 'Mesin espresso, grinder, blender, coolbox (depresiasi)' },
    { event: 'CAPEX Perlengkapan Toko', debet: '104 - Aset Perlengkapan', kredit: '101 - Kas / Bank', note: 'Meja lipat CFD, banner promosi, tenda canopy' },
    { event: 'Pembelian Bahan Baku Tunai', debet: '102 - Persediaan Bahan', kredit: '101 - Kas / Bank', note: 'Restok bahan baku tunai dari Kas toko' },
    { event: 'Pembelian Bahan Kredit Vendor', debet: '102 - Persediaan Bahan', kredit: '201 - Hutang Supplier', note: 'Kewajiban tagihan tempo dari vendor' }
  ];

  // Filtering Logic (FSD v1.1 Section 3)
  const filteredJournal = useMemo(() => {
    return journal.filter(entry => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (entry.ref || '').toLowerCase().includes(q) ||
        (entry.description || '').toLowerCase().includes(q) ||
        (entry.date || '').toLowerCase().includes(q) ||
        (entry.items || []).some(it =>
          (it.accountCode || '').toLowerCase().includes(q) ||
          (it.accountName || '').toLowerCase().includes(q)
        );

      if (!matchSearch) return false;

      const entryDate = new Date(entry.date);
      const now = new Date();
      if (periodFilter === 'THIS_MONTH') {
        if (entryDate.getMonth() !== now.getMonth() || entryDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (periodFilter === 'LAST_MONTH') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (entryDate.getMonth() !== lastMonth || entryDate.getFullYear() !== lastYear) {
          return false;
        }
      } else if (periodFilter === 'THIS_YEAR') {
        if (entryDate.getFullYear() !== now.getFullYear()) return false;
      } else if (periodFilter === 'CUSTOM') {
        if (startDate && entry.date < startDate) return false;
        if (endDate && entry.date > endDate) return false;
      }

      return true;
    });
  }, [journal, searchQuery, periodFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredJournal.length / itemsPerPage));
  const paginatedJournal = filteredJournal.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, periodFilter, startDate, endDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F1F38', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpenCheck style={{ width: '22px', height: '22px', color: '#0284C7' }} />
            Jurnal Akuntansi Double-Entry & Buku Besar
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
            Pencatatan Berpasangan Otomatis, Standarisasi Navigasi & Pembatasan 10 Baris
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            onClick={onOpenOpex}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', borderRadius: '0.625rem',
              fontSize: '0.8rem', fontWeight: 700,
              background: '#F0F9FF', color: '#0284C7',
              border: '1.5px solid #BAE6FD', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E0F2FE'}
            onMouseLeave={e => e.currentTarget.style.background = '#F0F9FF'}
          >
            <TrendingUp style={{ width: '14px', height: '14px' }} />
            Biaya OPEX
          </button>
          <button
            onClick={onOpenStockIn}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', borderRadius: '0.625rem',
              fontSize: '0.8rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(2,132,199,0.3)',
            }}
          >
            <PlusCircle style={{ width: '14px', height: '14px' }} />
            Jurnal Stok
          </button>
        </div>
      </div>

      {/* Auto-Journal Rules */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Receipt style={{ width: '16px', height: '16px', color: '#0284C7' }} />
          Aturan Auto-Posting Jurnal Berpasangan
        </h3>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Peristiwa Bisnis</th>
                <th>Akun Debet</th>
                <th>Akun Kredit</th>
                <th>Keterangan Akuntansi</th>
              </tr>
            </thead>
            <tbody>
              {autoJournalRules.map((rule, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem' }}>{rule.event}</td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16A34A', fontSize: '0.8rem' }}>{rule.debet}</span></td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284C7', fontSize: '0.8rem' }}>{rule.kredit}</span></td>
                  <td style={{ fontSize: '0.8rem', color: '#64748B' }}>{rule.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COA Cards Container */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', marginBottom: '0.875rem' }}>
          Daftar Bagan Akun Standar (Chart of Accounts - COA)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {coa.map((account) => (
            <div
              key={account.code}
              style={{
                padding: '0.875rem',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '0.875rem',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#BAE6FD'; e.currentTarget.style.background = '#F0F9FF'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800, color: '#0284C7', display: 'block' }}>{account.code}</span>
              <h5 style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.25rem' }}>{account.name}</h5>
              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '0.375rem', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: '0.375rem', display: 'inline-block' }}>
                {account.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar for Journal */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
          <div style={{ position: 'relative', width: '320px', minWidth: '240px' }}>
            <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Cari Ref, keterangan, kode/nama akun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                borderRadius: '0.625rem', fontSize: '0.8125rem', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#0284C7'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.875rem', background: '#F8FAFC',
              border: '1.5px solid #E2E8F0', borderRadius: '0.625rem',
              fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer'
            }}
          >
            <option value="ALL">Semua Periode</option>
            <option value="THIS_MONTH">Bulan Ini</option>
            <option value="LAST_MONTH">Bulan Lalu</option>
            <option value="THIS_YEAR">Tahun Ini</option>
            <option value="CUSTOM">Rentang Tanggal Kustom...</option>
          </select>
        </div>

        {periodFilter === 'CUSTOM' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.875rem', background: '#F0F9FF', borderRadius: '0.625rem', border: '1px solid #BAE6FD', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>Rentang Jurnal:</span>
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

      {/* General Journal Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Journal Table Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
          <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>Buku Jurnal Umum (General Journal Ledger)</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            <span style={{ color: '#64748B' }}>Total Debet: <strong style={{ color: '#16A34A' }}>Rp {totalDebits.toLocaleString('id-ID')}</strong></span>
            <span style={{ color: '#64748B' }}>Total Kredit: <strong style={{ color: '#0284C7' }}>Rp {totalCredits.toLocaleString('id-ID')}</strong></span>
            <span style={{
              padding: '0.2rem 0.625rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800,
              background: isBalanced ? '#DCFCE7' : '#FEE2E2',
              color: isBalanced ? '#15803D' : '#DC2626',
              border: `1px solid ${isBalanced ? '#86EFAC' : '#FCA5A5'}`,
            }}>
              {isBalanced ? 'BALANCED ✓' : 'UNBALANCED !'}
            </span>
          </div>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No. Ref</th>
                <th>Keterangan Transaksi</th>
                <th>Kode Akun</th>
                <th>Nama Akun</th>
                <th style={{ textAlign: 'right' }}>Debet (Rp)</th>
                <th style={{ textAlign: 'right' }}>Kredit (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJournal.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                    Tidak ada catatan jurnal yang sesuai kriteria pencarian/filter.
                  </td>
                </tr>
              ) : (
                paginatedJournal.map((entry) => (
                  <React.Fragment key={entry.id}>
                    {entry.items.map((item, idx) => (
                      <tr key={`${entry.id}-${idx}`} style={{ borderTop: idx === 0 ? '1.5px solid #F1F5F9' : 'none' }}>
                        {idx === 0 && (
                          <>
                            <td rowSpan={entry.items.length} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748B', verticalAlign: 'top', paddingTop: '1rem' }}>
                              {entry.date}
                            </td>
                            <td rowSpan={entry.items.length} style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284C7', fontSize: '0.8rem', verticalAlign: 'top', paddingTop: '1rem' }}>
                              {entry.ref}
                            </td>
                            <td rowSpan={entry.items.length} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A', verticalAlign: 'top', paddingTop: '1rem', maxWidth: '240px' }}>
                              {entry.description}
                            </td>
                          </>
                        )}
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>{item.accountCode}</td>
                        <td style={{ fontSize: '0.8rem', color: '#475569' }}>{item.accountName}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16A34A', fontSize: '0.8rem' }}>
                          {item.debit > 0 ? `Rp ${item.debit.toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284C7', fontSize: '0.8rem' }}>
                          {item.credit > 0 ? `Rp ${item.credit.toLocaleString('id-ID')}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
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
            Menampilkan <strong style={{ color: '#0F172A' }}>{filteredJournal.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> - <strong style={{ color: '#0F172A' }}>{Math.min(currentPage * itemsPerPage, filteredJournal.length)}</strong> dari <strong style={{ color: '#0F172A' }}>{filteredJournal.length}</strong> entri jurnal (Standar 10 baris/halaman)
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
