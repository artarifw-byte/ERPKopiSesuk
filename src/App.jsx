import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ERPProvider, useERP } from './context/ERPContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POSModule } from './components/POSModule';
import { OrdersModule } from './components/OrdersModule';
import { InventoryModule } from './components/InventoryModule';
import { BOMModule } from './components/BOMModule';
import { JournalModule } from './components/JournalModule';
import { ReportsModule } from './components/ReportsModule';
import { AuditTrailModule } from './components/AuditTrailModule';
import { DDLViewerModal } from './components/DDLViewerModal';
import { NewOrderModal } from './components/NewOrderModal';
import { StockInModal } from './components/StockInModal';
import { OpexModal } from './components/OpexModal';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginPage } from './components/LoginPage';
import { supabase, supabaseConfigurationError } from './lib/supabase';
import { CheckCircle2, AlertCircle, Info, Database } from 'lucide-react';

const MainApp = ({ currentUser, onLogout }) => {
  const { activeTab, setActiveTab, toast } = useERP();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isOpexOpen, setIsOpexOpen] = useState(false);
  const [isDDLOpen, setIsDDLOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onOpenNewOrder={() => setIsNewOrderOpen(true)}
            onOpenStockIn={() => setIsStockInOpen(true)}
            onOpenOpex={() => setIsOpexOpen(true)}
            onOpenDDL={() => setIsDDLOpen(true)}
          />
        );
      case 'pos':
        return <POSModule onShowReceipt={(ord) => setReceiptOrder(ord)} />;
      case 'orders':
        return (
          <OrdersModule
            onOpenNewOrder={() => setIsNewOrderOpen(true)}
            onShowReceipt={(ord) => setReceiptOrder(ord)}
          />
        );
      case 'inventory':
        return <InventoryModule onOpenStockIn={() => setIsStockInOpen(true)} />;
      case 'bom':
        return <BOMModule />;
      case 'journal':
        return (
          <JournalModule
            onOpenOpex={() => setIsOpexOpen(true)}
            onOpenStockIn={() => setIsStockInOpen(true)}
          />
        );
      case 'reports':
        return <ReportsModule />;
      case 'audit':
        return <AuditTrailModule />;
      case 'ddl':
        return (
          <div className="glass-card p-8 text-center space-y-4 max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Database className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Supabase PostgreSQL DDL Script Generator</h2>
            <p className="text-xs text-slate-300">
              Seluruh struktur tabel RDBMS, Enums, View Safety Stock & ROP, Trigger Deduksi Stok BOM Otomatis, serta Auto-Posting Jurnal telah disiapkan.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setIsDDLOpen(true)}
                className="btn btn-primary text-xs shadow-lg shadow-amber-600/30"
              >
                <span>Buka Modal Viewer & Exporter DDL</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <Dashboard
            onOpenNewOrder={() => setIsNewOrderOpen(true)}
            onOpenStockIn={() => setIsStockInOpen(true)}
            onOpenOpex={() => setIsOpexOpen(true)}
            onOpenDDL={() => setIsDDLOpen(true)}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content View */}
      <div className="main-content">
        <Navbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          onOpenNewOrder={() => setIsNewOrderOpen(true)}
          onOpenStockIn={() => setIsStockInOpen(true)}
          onOpenOpex={() => setIsOpexOpen(true)}
          onOpenDDL={() => setIsDDLOpen(true)}
          currentUser={currentUser}
          onLogout={onLogout}
        />

        <main className="page-container">
          {renderActiveModule()}
        </main>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div className="toast-container">
          <div className="toast-box">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-amber-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global Interactive Modals */}
      <NewOrderModal isOpen={isNewOrderOpen} onClose={() => setIsNewOrderOpen(false)} />
      <StockInModal isOpen={isStockInOpen} onClose={() => setIsStockInOpen(false)} />
      <OpexModal isOpen={isOpexOpen} onClose={() => setIsOpexOpen(false)} />
      <DDLViewerModal isOpen={isDDLOpen} onClose={() => setIsDDLOpen(false)} />
      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(supabase ? undefined : null); // undefined = loading
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) return;

    // Cek session yang sudah ada
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    }).catch(() => {
      setCurrentUser(null);
    });

    // Listen perubahan auth state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sinkronisasi navigasi route & status otentikasi
  useEffect(() => {
    if (currentUser === undefined) return;

    if (!currentUser) {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    } else {
      if (location.pathname === '/' || location.pathname === '/login') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, location.pathname, navigate]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  // Loading state — cek session dulu
  if (currentUser === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F9FF' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #BAE6FD', borderTopColor: '#0284C7', borderRadius: '9999px', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>Memuat sistem...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} configurationError={supabaseConfigurationError} />;
  }

  return (
    <ERPProvider>
      <MainApp currentUser={currentUser} onLogout={handleLogout} />
    </ERPProvider>
  );
}
