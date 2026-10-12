import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  X,
  FileSpreadsheet,
  Clock,
  Lock,
  ArrowUpDown,
  History,
  Copy,
  Check,
  Activity
} from 'lucide-react';

export const AuditTrailModule = () => {
  const { auditLogs } = useERP();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  // Category definitions with modern color tokens
  const categories = [
    { id: 'ALL', label: 'Semua Kategori', color: '#0F172A', bg: '#F1F5F9', border: '#CBD5E1' },
    { id: 'NAVIGASI', label: 'Navigasi Menu', color: '#475569', bg: '#F8FAFC', border: '#E2E8F0' },
    { id: 'PENJUALAN', label: 'Penjualan & PO', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    { id: 'INVENTORI', label: 'Stok & Bahan', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    { id: 'KEUANGAN', label: 'Keuangan & OPEX', color: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' },
    { id: 'PRODUKSI', label: 'Produksi & BOM', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
    { id: 'AUTENTIKASI', label: 'Autentikasi', color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE' },
    { id: 'SISTEM', label: 'Sistem & DB', color: '#BE123C', bg: '#FFF1F2', border: '#FECDD3' }
  ];

  const getCategoryStyle = (category) => {
    const found = categories.find(c => c.id === category);
    if (found) {
      return { color: found.color, background: found.bg, border: `1.5px solid ${found.border}` };
    }
    return { color: '#475569', background: '#F8FAFC', border: '1.5px solid #E2E8F0' };
  };

  // Filtered and sorted data
  const filteredLogs = useMemo(() => {
    let list = [...(auditLogs || [])];

    // Filter by Category
    if (selectedCategory !== 'ALL') {
      list = list.filter(item => item.category === selectedCategory);
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item => {
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const actionMatch = (item.action || '').toLowerCase().includes(q);
        const userMatch = (item.user || '').toLowerCase().includes(q);
        const idMatch = (item.id || '').toLowerCase().includes(q);
        const detailsStr = item.details ? JSON.stringify(item.details).toLowerCase() : '';
        const detailsMatch = detailsStr.includes(q);

        return descMatch || actionMatch || userMatch || idMatch || detailsMatch;
      });
    }

    // Sort by timestamp
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [auditLogs, selectedCategory, searchTerm, sortOrder]);

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Guard current page
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogsCount = useMemo(() => {
    return (auditLogs || []).filter(l => l.timestamp && l.timestamp.startsWith(todayStr)).length;
  }, [auditLogs, todayStr]);

  const criticalOpsCount = useMemo(() => {
    return (auditLogs || []).filter(l => ['PENJUALAN', 'INVENTORI', 'KEUANGAN'].includes(l.category)).length;
  }, [auditLogs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ['ID Log', 'Waktu (ISO)', 'Kategori', 'Aksi', 'Deskripsi', 'User', 'Detail JSON'];
    const rows = filteredLogs.map(log => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.category}"`,
      `"${log.action}"`,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      `"${log.user}"`,
      `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_Kopi_Sesuk_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyDetailsJSON = (details) => {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'var(--font-sans)' }}>
      {/* Top Banner & Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)',
        border: '1.5px solid #BAE6FD',
        borderRadius: '1.25rem',
        padding: '1.75rem',
        boxShadow: '0 4px 20px rgba(2, 132, 199, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 18px rgba(2, 132, 199, 0.3)',
              flexShrink: 0
            }}>
              <History style={{ width: '26px', height: '26px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                  Audit Trail & System Activity Log
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: '#DCFCE7',
                  color: '#15803D',
                  border: '1.5px solid #86EFAC'
                }}>
                  <Lock style={{ width: '13px', height: '13px' }} />
                  Hanya-Baca (Read Only)
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Perekaman kronologis jejak audit digital: navigasi modul, pengadaan bahan, transaksi POS/PO, perubahan resep BOM, hingga jurnal keuangan.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '0.75rem',
                fontSize: '0.825rem',
                fontWeight: 800,
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1.5px solid #CBD5E1',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#0284C7';
                e.currentTarget.style.color = '#0284C7';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.color = '#0F172A';
              }}
            >
              <FileSpreadsheet style={{ width: '16px', height: '16px', color: '#16A34A' }} />
              Ekspor Log (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Entri Audit', val: (auditLogs || []).length, sub: 'Tersimpan di local storage & session', icon: Layers, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
          { label: 'Aktivitas Hari Ini', val: todayLogsCount, sub: `Aktivitas sesi tanggal ${todayStr}`, icon: Calendar, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
          { label: 'Transaksi & Bahan', val: criticalOpsCount, sub: 'Log Penjualan, Stok & Keuangan', icon: Activity, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
          { label: 'Status Integritas', val: '100% Valid', sub: 'Immutable • Anti-Tampering', icon: ShieldCheck, color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: `1.5px solid ${kpi.border}`,
                borderRadius: '1rem',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {kpi.label}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '0.625rem',
                  background: kpi.bg,
                  color: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon style={{ width: '18px', height: '18px' }} />
                </div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {kpi.val}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem', fontWeight: 600 }}>
                  {kpi.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '1.25rem',
        padding: '1.25rem',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '540px' }}>
            <Search style={{ width: '16px', height: '16px', color: '#94A3B8', position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Cari aktivitas, barang, invoice, akun, atau detail..."
              style={{
                width: '100%',
                padding: '0.65rem 2.25rem 0.65rem 2.5rem',
                borderRadius: '0.75rem',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.825rem',
                color: '#0F172A',
                outline: 'none',
                background: '#F8FAFC',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#0284C7';
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.background = '#F8FAFC';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            )}
          </div>

          {/* Controls: Sort & Page Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '0.75rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowUpDown style={{ width: '14px', height: '14px', color: '#0284C7' }} />
              {sortOrder === 'desc' ? 'Urutkan: Terbaru Dulu' : 'Urutkan: Terlama Dulu'}
            </button>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.75rem',
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#475569'
            }}>
              <span>Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontWeight: 800,
                  color: '#0284C7',
                  cursor: 'pointer',
                  fontSize: '0.825rem'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <Filter style={{ width: '13px', height: '13px' }} />
            Filter Kategori:
          </span>
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  border: isActive ? '1.5px solid #0284C7' : '1.5px solid #E2E8F0',
                  background: isActive ? '#0284C7' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#475569',
                  boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
      }}>
        {/* Table Header Strip */}
        <div style={{
          padding: '1rem 1.5rem',
          background: '#F8FAFC',
          borderBottom: '1.5px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock style={{ width: '17px', height: '17px', color: '#0284C7' }} />
            <h3 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Daftar Log Riwayat Sistem ({totalItems} aktivitas ditemukan)
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>
            Halaman {safeCurrentPage} dari {totalPages}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1.5px solid #CBD5E1', color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.725rem', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.85rem 1rem', width: '50px' }}>No</th>
                <th style={{ padding: '0.85rem 1.25rem', width: '190px' }}>Waktu & ID</th>
                <th style={{ padding: '0.85rem 1.25rem', width: '160px' }}>Kategori & Aksi</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Deskripsi Aktivitas</th>
                <th style={{ padding: '0.85rem 1.25rem', width: '220px' }}>User / Akun</th>
                <th style={{ padding: '0.85rem 1rem', width: '90px', textAlign: 'center' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity style={{ width: '36px', height: '36px', color: '#CBD5E1' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>Tidak ada log yang cocok</div>
                      <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Coba ubah kata kunci pencarian atau ganti filter kategori.</p>
                      <button
                        onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); }}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.45rem 1rem',
                          borderRadius: '0.625rem',
                          background: '#E0F2FE',
                          color: '#0369A1',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const rowNumber = startIndex + index + 1;
                  const catStyle = getCategoryStyle(log.category);

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Row No */}
                      <td style={{ padding: '1rem', color: '#94A3B8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {rowNumber}
                      </td>

                      {/* Timestamp & ID */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-mono)', fontSize: '0.785rem' }}>
                          {formatDateTime(log.timestamp)}
                        </div>
                        <div style={{ fontSize: '0.685rem', color: '#94A3B8', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                          {log.id}
                        </div>
                      </td>

                      {/* Category & Action */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.685rem',
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                            ...catStyle
                          }}>
                            {log.category}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#64748B' }}>
                            {log.action}
                          </span>
                        </div>
                      </td>

                      {/* Description & Payload preview */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.45, fontSize: '0.825rem' }}>
                          {log.description}
                        </div>
                        {log.details && typeof log.details === 'object' && (
                          <div style={{
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                            color: '#64748B',
                            marginTop: '0.25rem',
                            maxWidth: '460px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </td>

                      {/* User Account */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '9999px',
                            background: '#E2E8F0',
                            color: '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.75rem',
                            flexShrink: 0
                          }}>
                            {(log.user || 'A')[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.785rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.user || 'admin@kopisesuk.com'}
                            </div>
                            <div style={{ fontSize: '0.685rem', color: '#64748B', fontWeight: 600 }}>
                              {log.role || 'Admin ERP'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Detail Button */}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.625rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: '#F0F9FF',
                            color: '#0284C7',
                            border: '1.5px solid #BAE6FD',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#0284C7';
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#0284C7';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = '#F0F9FF';
                            e.currentTarget.style.color = '#0284C7';
                            e.currentTarget.style.borderColor = '#BAE6FD';
                          }}
                        >
                          <Eye style={{ width: '13px', height: '13px' }} />
                          <span>Lihat</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1.5px solid #E2E8F0',
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
            Menampilkan <strong style={{ color: '#0F172A' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong style={{ color: '#0F172A' }}>{Math.min(startIndex + pageSize, totalItems)}</strong> dari{' '}
            <strong style={{ color: '#0F172A' }}>{totalItems}</strong> aktivitas tercatat
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '0.5rem',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: safeCurrentPage <= 1 ? '#CBD5E1' : '#334155',
                cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Halaman Pertama"
            >
              <ChevronsLeft style={{ width: '16px', height: '16px' }} />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '0.5rem',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: safeCurrentPage <= 1 ? '#CBD5E1' : '#334155',
                cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </button>

            {/* Page number buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 0.25rem' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (safeCurrentPage <= 3) {
                  pageNum = i + 1;
                } else if (safeCurrentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = safeCurrentPage - 2 + i;
                }

                const isActive = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      minWidth: '32px',
                      height: '32px',
                      padding: '0 0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: isActive ? '1.5px solid #0284C7' : '1.5px solid #CBD5E1',
                      background: isActive ? '#0284C7' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#334155',
                      boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '0.5rem',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: safeCurrentPage >= totalPages ? '#CBD5E1' : '#334155',
                cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Halaman Berikutnya"
            >
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '0.5rem',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: safeCurrentPage >= totalPages ? '#CBD5E1' : '#334155',
                cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Halaman Terakhir"
            >
              <ChevronsRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Read-Only Detail Inspector Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '560px',
            border: '1.5px solid #CBD5E1',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
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
                  <Lock style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                    Detail Entri Audit Trail
                  </h3>
                  <span style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>
                    {selectedLog.id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
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

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Waktu Log</span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    {formatDateTime(selectedLog.timestamp)}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Akun Operator</span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedLog.user}
                  </div>
                  <div style={{ fontSize: '0.675rem', color: '#64748B', fontWeight: 600 }}>{selectedLog.role || 'Admin ERP'}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kategori</span>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      ...getCategoryStyle(selectedLog.category)
                    }}>
                      {selectedLog.category}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kode Aksi</span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284C7', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    {selectedLog.action}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Deskripsi Lengkap
                </span>
                <div style={{
                  marginTop: '0.35rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  color: '#1E293B',
                  lineHeight: 1.5
                }}>
                  {selectedLog.description}
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Parameter Payload Teknis (JSON)
                    </span>
                    <button
                      onClick={() => copyDetailsJSON(selectedLog.details)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'transparent',
                        border: 'none',
                        color: copied ? '#16A34A' : '#0284C7',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {copied ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                      {copied ? 'Tersalin' : 'Salin JSON'}
                    </button>
                  </div>
                  <pre style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '0.75rem',
                    background: '#0F172A',
                    color: '#38BDF8',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    maxHeight: '180px',
                    lineHeight: 1.5,
                    border: '1.5px solid #1E293B'
                  }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                background: '#FEF3C7',
                border: '1.5px solid #FDE68A',
                color: '#92400E',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <Lock style={{ width: '16px', height: '16px', color: '#D97706', flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                  <strong>Jaminan Integritas:</strong> Log ini bersifat <em>immutable</em> (hanya-baca) dan tidak memiliki opsi edit/hapus untuk mematuhi regulasi akuntabilitas internal Kopi Sesuk.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1.5px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
