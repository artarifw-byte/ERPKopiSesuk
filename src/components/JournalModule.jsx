import React from 'react';
import { useERP } from '../context/ERPContext';
import { BookOpenCheck, TrendingUp, PlusCircle, Receipt } from 'lucide-react';

export const JournalModule = ({ onOpenOpex, onOpenStockIn }) => {
  const { journal, coa } = useERP();

  let totalDebits = 0;
  let totalCredits = 0;
  journal.forEach(entry => {
    entry.items.forEach(item => {
      totalDebits += Number(item.debit) || 0;
      totalCredits += Number(item.credit) || 0;
    });
  });

  const isBalanced = totalDebits === totalCredits;

  const autoJournalRules = [
    { event: 'Penerimaan Hasil Sales / PO', debet: '101 - Kas / Bank', kredit: '401 - Pendapatan Sales', note: 'Pencatatan kas masuk hasil penjualan toko/PO' },
    { event: 'Pengakuan HPP saat Transaksi', debet: '501 - BPP (HPP Kopi)', kredit: '102 - Persediaan Bahan', note: 'Deduksi otomatis persediaan berdasarkan kalkulasi resep BOM' },
    { event: 'Pembelian Bahan Tunai', debet: '102 - Persediaan Bahan', kredit: '101 - Kas / Bank', note: 'Pembelian persediaan bahan baku dari Kas toko' },
    { event: 'Pembelian Bahan Kredit Vendor', debet: '102 - Persediaan Bahan', kredit: '201 - Hutang Supplier', note: 'Tagihan dari supplier umum' },
    { event: 'Pelunasan Hutang Supplier', debet: '201 - Hutang Supplier', kredit: '101 - Kas / Bank', note: 'Pembayaran kewajiban supplier' },
    { event: 'Pengeluaran OPEX', debet: '601 - Beban Operasional', kredit: '101 - Kas / Bank', note: 'Biaya sewa, listrik, pemasaran, packaging, dll' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpenCheck style={{ width: '22px', height: '22px', color: '#0284C7' }} />
            Jurnal Akuntansi Double-Entry & Buku Besar
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
            Pencatatan Berpasangan (Debet & Kredit) Otomatis Terintegrasi
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
                <th>Keterangan</th>
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
              {journal.map((entry) => (
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
                          <td rowSpan={entry.items.length} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A', verticalAlign: 'top', paddingTop: '1rem', maxWidth: '200px' }}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
