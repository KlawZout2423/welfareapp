"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Info, AlertCircle, Loader2 } from "lucide-react";

const HTULogo = ({ className = "w-36 h-36" }) => (
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
      if (result?.error) {
        setAuthError(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-screen bg-navy-deep overflow-hidden">
      {/* LEFT PANEL */}
      <div className="left-panel hidden lg:flex">
        <div className="gear-pattern"></div>
        <div className="left-content text-center">
          <div className="logo-container flex justify-center">
            <HTULogo className="w-36 h-40 filter drop-shadow-[0_4px_24px_rgba(13,30,76,0.35)] animate-fade-in" />
          </div>
          <h2 className="university-name">Ho Technical University</h2>
          <div className="scheme-title font-semibold text-gold tracking-widest">Staff Welfare Scheme</div>
          <div className="italic text-white/70 text-xs mt-1 mb-4 font-serif">&quot;Adanu Nazu Kekeli&quot; (Knowledge Becomes Light)</div>
          <div className="divider"></div>

          <div className="text-left space-y-4 mb-6 max-w-sm mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider block mb-1">Our Mission</span>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                To develop highly competent human capital through career-focused education, skills training, research, and innovation in partnership with stakeholders.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider block mb-1">Our Vision</span>
              <p className="text-xs text-white/60 leading-relaxed font-sans">
                To become a hub of practical education and innovation advancing sustainable global development.
              </p>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat"><div className="stat-number">GH₵1.2M+</div><div className="stat-label">Reserve Fund</div></div>
            <div className="stat-divider"></div>
            <div className="stat"><div className="stat-number">GH₵485K+</div><div className="stat-label">Total Payout</div></div>
            <div className="stat-divider"></div>
            <div className="stat"><div className="stat-number">1,840</div><div className="stat-label">Active Staff</div></div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-14 xl:px-20 bg-cream">
        <div className="login-header">
          <h2>Portal Sign In</h2>
          <p>Enter your institutional credentials to log in.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Error banner */}
          {authError && (
            <div className="flex items-start gap-3 bg-red-pale border border-red/30 text-red px-4 py-3 rounded-xl text-xs font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="form-group">
            <div className="flex justify-between items-center">
              <label>Staff ID / Institutional Email</label>
              <div className="relative">
                <button type="button" onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                  className="text-[11px] text-gold font-bold flex items-center gap-1 hover:text-navy">
                  <Info className="w-3.5 h-3.5" /> Help Desk
                </button>
                {showHelpTooltip && (
                  <div className="absolute right-0 top-6 z-[10] w-[280px] bg-white border border-border rounded-xl shadow-xl p-3 text-left space-y-2">
                    <span className="text-[10px] font-bold text-navy uppercase block">Demo Credentials</span>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="bg-cream rounded-lg px-3 py-2">
                        <span className="font-bold text-navy block">Staff Member</span>
                        <span className="text-text-3">staff@gmail.com</span>
                        <span className="text-text-3 block">Password: <span className="font-bold text-navy">htu2026</span></span>
                      </div>
                      <div className="bg-cream rounded-lg px-3 py-2">
                        <span className="font-bold text-navy block">Scheme Manager</span>
                        <span className="text-text-3">manager@htu.edu.gh</span>
                        <span className="text-text-3 block">Password: <span className="font-bold text-navy">manager2026</span></span>
                      </div>
                      <div className="bg-cream rounded-lg px-3 py-2">
                        <span className="font-bold text-navy block">System Auditor</span>
                        <span className="text-text-3">auditor@htu.edu.gh</span>
                        <span className="text-text-3 block">Password: <span className="font-bold text-navy">audit2026</span></span>
                      </div>
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
                placeholder="e.g. eugene.dushie@htu.edu.gh"
                value={loginEmail}
                onChange={(e) => { setLoginEmail(e.target.value); setAuthError(""); }}
                className="form-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Portal Password</label>
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
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn" disabled={isLoading}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="form-footer">
            <label className="remember-wrap">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <span>Remember session</span>
            </label>
            <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); alert("Contact the Welfare Secretariat to reset your password.\n📞 0302 000 000\n✉ welfare@htu.edu.gh"); }}>
              Forgot Password?
            </a>
          </div>

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

        <div className="footer-note">
          Ho Technical University Welfare Board Office — <span>HTU Campus</span>
        </div>
      </div>
    </div>
  );
}
