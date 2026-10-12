import React, { useState } from "react";
import { Eye, EyeOff, Cat, ShieldCheck, LogIn, Layers, BarChart3, PackageCheck, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email atau password salah. Coba lagi.'
        : authError.message);
      setLoading(false);
    } else {
      // onLogin dipanggil dari App.jsx via onAuthStateChange, tapi kita juga pass user langsung
      onLogin(data.user);
    }
  };


  const features = [
    { icon: Layers, label: "BOM & HPP Otomatis", desc: "Kalkulasi resep & harga pokok real-time" },
    { icon: PackageCheck, label: "Stok Terpusat", desc: "Safety Stock & Reorder Point cerdas" },
    { icon: BarChart3, label: "Laporan Keuangan", desc: "BEP Analysis & Double-Entry Journal" },
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", background: "#F0F9FF", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Left Hero Panel */}
      <div style={{ flex: "0 0 42%", background: "linear-gradient(150deg, #0284C7 0%, #0369A1 35%, #1D4ED8 70%, #1e3a8a 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "3rem 3.5rem", position: "relative", overflow: "hidden" }} className="login-hero-panel">
        <div style={{ position: "absolute", top: "-120px", right: "-120px", width: "400px", height: "400px", borderRadius: "9999px", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-80px", left: "-80px", width: "320px", height: "320px", borderRadius: "9999px", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        {/* Brand */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "1rem", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Cat style={{ width: "24px", height: "24px", color: "#FFFFFF" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.1 }}>Kopi Sesuk</h1>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#BAE6FD", letterSpacing: "0.08em", textTransform: "uppercase" }}>ERP System v1.0</span>
            </div>
          </div>
        </div>
        {/* Hero Copy */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.875rem", borderRadius: "9999px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", marginBottom: "1.25rem" }}>
            <ShieldCheck style={{ width: "14px", height: "14px", color: "#6EE7B7" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E0F2FE", letterSpacing: "0.04em" }}>Sistem ERP Terpusat</span>
          </div>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "1rem" }}>
            Kelola Bisnis Kopi<br /><span style={{ color: "#7DD3FC" }}>Lebih Cerdas.</span>
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "#BFDBFE", lineHeight: 1.7, maxWidth: "380px", fontWeight: 500, marginBottom: "2rem" }}>
            Satu platform untuk stok bahan baku, POS kasir, kalkulasi BOM, penjadwalan PO, dan laporan keuangan otomatis.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1rem", borderRadius: "0.875rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "0.625rem", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: "18px", height: "18px", color: "#7DD3FC" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#FFFFFF" }}>{label}</div>
                  <div style={{ fontSize: "0.725rem", color: "#BAE6FD", marginTop: "0.1rem" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ position: "relative", zIndex: 10, fontSize: "0.7rem", color: "rgba(186,230,253,0.6)", fontWeight: 500 }}>© 2026 Kopi Sesuk · Internal ERP System</p>
      </div>

      {/* Right Login Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "#F0F9FF" }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "1.5rem", border: "1.5px solid #E2E8F0", boxShadow: "0 20px 60px -12px rgba(15,23,42,0.12), 0 4px 16px -4px rgba(15,23,42,0.06)", overflow: "hidden" }}>
            {/* Card Header */}
            <div style={{ padding: "2rem 2rem 1.5rem", borderBottom: "1.5px solid #F1F5F9", background: "#FAFCFF" }}>
              <h3 style={{ fontSize: "1.375rem", fontWeight: 900, color: "#0F172A", letterSpacing: "-0.025em", margin: "0 0 0.25rem" }}>Selamat Datang 👋</h3>
              <p style={{ fontSize: "0.875rem", color: "#64748B", fontWeight: 500, margin: 0 }}>Masuk ke sistem ERP Kopi Sesuk</p>
            </div>
            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: "1.75rem 2rem 2rem" }}>

              {/* Email */}
              <div style={{ marginBottom: "1.1rem" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#374151", marginBottom: "0.45rem" }}>Email</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="admin@email.com" autoComplete="email" required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`, background: error ? "#FEF2F2" : "#F8FAFC", fontSize: "0.9rem", color: "#0F172A", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              {/* Password */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#374151", marginBottom: "0.45rem" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="••••••••" autoComplete="current-password" required
                    style={{ width: "100%", padding: "0.75rem 3rem 0.75rem 1rem", borderRadius: "0.75rem", border: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`, background: error ? "#FEF2F2" : "#F8FAFC", fontSize: "0.9rem", color: "#0F172A", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "0.2rem", display: "flex", alignItems: "center" }}>
                    {showPass ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                  </button>
                </div>
              </div>
              {/* Error */}
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: "0.75rem", marginBottom: "1.25rem" }}>
                  <AlertCircle style={{ width: "16px", height: "16px", color: "#DC2626", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8125rem", color: "#B91C1C", fontWeight: 600 }}>{error}</span>
                </div>
              )}
              {/* Submit */}
              <button type="submit" disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.875rem", borderRadius: "0.875rem", fontSize: "0.9375rem", fontWeight: 800, border: "none", cursor: loading ? "not-allowed" : "pointer", background: loading ? "#94A3B8" : "linear-gradient(135deg, #0284C7 0%, #0369A1 60%, #1D4ED8 100%)", color: "#FFFFFF", boxShadow: loading ? "none" : "0 6px 20px rgba(2,132,199,0.38)", letterSpacing: "-0.01em" }}>
                {loading ? (
                  <><span style={{ width: "18px", height: "18px", border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#FFFFFF", borderRadius: "9999px", animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />Memverifikasi...</>
                ) : (
                  <><LogIn style={{ width: "18px", height: "18px" }} />Masuk ke Dashboard</>
                )}
              </button>
              <div style={{ marginTop: "1.25rem", padding: "0.875rem", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "0.75rem" }}>
                <p style={{ fontSize: "0.7375rem", color: "#0369A1", fontWeight: 600, margin: 0, lineHeight: 1.7 }}>
                  🔐 Gunakan email & password yang sudah didaftarkan di Supabase Auth.
                </p>
              </div>
            </form>
          </div>
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#94A3B8", marginTop: "1.5rem", fontWeight: 500 }}>Sistem Internal — Akses hanya untuk tim Kopi Sesuk</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (max-width: 768px) { .login-hero-panel { display: none !important; } }`}</style>
    </div>
  );
};
