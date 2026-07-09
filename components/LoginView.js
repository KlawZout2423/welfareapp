"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Info, AlertCircle, Loader2 } from "lucide-react";

const HTULogo = ({ className = "w-20 h-20" }) => (
  <img
    src="/htu_logo.jpg"
    alt="Ho Technical University Logo"
    className={`${className} object-contain rounded-full bg-white p-1 border border-slate-200/50`}
  />
);

export default function LoginView({ onLogin }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setAuthError("");
    setIsLoading(true);
    try {
      const result = await onLogin(loginEmail.trim(), loginPassword);
      if (result?.error) setAuthError(result.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-screen bg-navy-deep overflow-hidden">

      {/* ── LEFT PANEL — desktop only ─────────────────────────────────── */}
      <div className="left-panel hidden lg:flex">
        <div className="gear-pattern" />
        <div className="left-content text-center">
          <div className="logo-container flex justify-center">
            <HTULogo className="w-36 h-40 filter drop-shadow-[0_4px_24px_rgba(13,30,76,0.35)] animate-fade-in" />
          </div>
          <h2 className="university-name">Ho Technical University</h2>
          <div className="scheme-title font-semibold text-gold tracking-widest">Staff Welfare Scheme</div>
          <div className="italic text-white/70 text-xs mt-1 mb-4 font-serif">&quot;Adanu Nazu Kekeli&quot; (Knowledge Becomes Light)</div>
          <div className="divider" />
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
      <div className="w-full lg:w-[45%] flex flex-col min-h-screen bg-cream">

        {/* Mobile top branding strip */}
        <div className="lg:hidden flex flex-col items-center pt-10 pb-6 bg-navy-deep px-6 text-center">
          <HTULogo className="w-20 h-20 mb-3" />
          <h1 className="text-white font-extrabold text-lg leading-tight">Ho Technical University</h1>
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mt-1">Staff Welfare Scheme</p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-8 lg:px-14 xl:px-20 lg:relative lg:before:absolute lg:before:top-0 lg:before:left-0 lg:before:w-1 lg:before:h-full lg:before:bg-gradient-to-b lg:before:from-gold lg:before:via-navy lg:before:to-gold">

          <div className="mb-8">
            <h2 className="font-eb-garamond text-3xl font-medium text-navy-deep mb-1">Portal Sign In</h2>
            <p className="text-sm text-text-3">Enter your institutional credentials to log in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error banner */}
            {authError && (
              <div className="flex items-start gap-3 bg-red-pale border border-red/30 text-red px-4 py-3 rounded-xl text-xs font-semibold animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                  Staff ID / Email
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                    className="text-[11px] text-gold font-bold flex items-center gap-1 hover:text-navy"
                  >
                    <Info className="w-3.5 h-3.5" /> Help
                  </button>
                  {showHelpTooltip && (
                    <div className="absolute right-0 top-6 z-[50] w-[260px] bg-white border border-border rounded-xl shadow-xl p-3 text-left space-y-2">
                      <span className="text-[10px] font-bold text-navy uppercase block">Demo Credentials</span>
                      <div className="space-y-1.5 text-[11px]">
                        {[
                          { role: "Staff Member", email: "staff@gmail.com", pw: "htu2026" },
                          { role: "Scheme Manager", email: "manager@htu.edu.gh", pw: "manager2026" },
                          { role: "System Auditor", email: "auditor@htu.edu.gh", pw: "audit2026" },
                        ].map(c => (
                          <div key={c.role} className="bg-cream rounded-lg px-3 py-2">
                            <span className="font-bold text-navy block">{c.role}</span>
                            <span className="text-text-3 block">{c.email}</span>
                            <span className="text-text-3">Password: <span className="font-bold text-navy">{c.pw}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="input-wrap">
                <Mail className="h-5 w-5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. staff@gmail.com"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setAuthError(""); }}
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Portal Password
              </label>
              <div className="input-wrap">
                <Lock className="h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setAuthError(""); }}
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-btn"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end items-center">
              <a
                href="#"
                className="forgot-link text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Contact the Welfare Secretariat to reset your password.\n📞 0302 000 000\n✉ welfare@htu.edu.gh");
                }}
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying credentials...
                </span>
              ) : (
                "Authorize Access"
              )}
            </button>

          </form>

          <p className="mt-8 text-center text-xs text-text-3">
            Ho Technical University Welfare Board Office — <span className="text-gold font-medium">HTU Campus</span>
          </p>
        </div>
      </div>
    </div>
  );
}
