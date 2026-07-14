"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Info, AlertCircle, Loader2 } from "lucide-react";
import { useWelfare } from "@/lib/context/WelfareContext";

const HTULogo = ({ className = "w-20 h-20" }) => (
  <img
    src="/htu_logo.jpg"
    alt="Ho Technical University Logo"
    className={`${className} object-contain rounded-full bg-white p-1 border border-slate-200/50`}
  />
);

export default function LoginView({ onLogin }) {
  const { showToastMsg } = useWelfare();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [view, setView] = useState("login"); // "login" or "forgot"
  const [forgotEmail, setForgotEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError("");
    setForgotSuccessMsg("");
    setTempPassword("");
    setIsForgotLoading(true);

    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "forgotPassword",
          payload: { email: forgotEmail }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Password reset failed.");
      } else {
        setForgotSuccessMsg("Reset request authorized.");
        setTempPassword(data.tempPassword);
        showToastMsg("Temporary password key generated!");
      }
    } catch (err) {
      setForgotError("Connection error resetting password.");
    } finally {
      setIsForgotLoading(false);
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

          {view === "login" ? (
            <>
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
                              { role: "Staff Member", email: "staff@htu.edu.gh", pw: "htu2026" },
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
                  <div className="input-wrap relative">
                    <Mail className="h-5 w-5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. staff@htu.edu.gh"
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
                  <div className="input-wrap relative">
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
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
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
                    className="forgot-link text-sm font-semibold hover:text-gold transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotEmail("");
                      setForgotError("");
                      setForgotSuccessMsg("");
                      setTempPassword("");
                      setView("forgot");
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Submit */}
                <button type="submit" className="login-btn cursor-pointer" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying credentials...
                    </span>
                  ) : (
                    "Authorize Access"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8 animate-fade-in">
                <h2 className="font-eb-garamond text-3xl font-medium text-navy-deep mb-1">Reset Portal Key</h2>
                <p className="text-sm text-text-3">Request a temporary authorization key to restore access.</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-5 animate-fade-in">
                {/* Error Banner */}
                {forgotError && (
                  <div className="flex items-start gap-3 bg-red-pale border border-red/30 text-red px-4 py-3 rounded-xl text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {forgotSuccessMsg && (
                  <div className="flex flex-col gap-2.5 bg-green-pale border border-green/30 text-green px-5 py-4 rounded-xl text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔑</span>
                      <span>Temporary Key Issued Successfully!</span>
                    </div>
                  </div>
                )}

                {/* Temp Password Output Box */}
                {tempPassword && (
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-center animate-fade-in">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Copy Temporary Password</span>
                    <span className="text-lg font-mono font-extrabold text-[#1565c0] block select-all tracking-wider p-2 bg-slate-50 border border-dashed border-slate-300 rounded">
                      {tempPassword}
                    </span>
                    <span className="text-[10px] text-text-3 block leading-relaxed">
                      Use this key to sign in. The portal will prompt you to configure a new personal password immediately.
                    </span>
                  </div>
                )}

                {!tempPassword && (
                  <div className="form-group">
                    <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                      Registered HTU Email
                    </label>
                    <div className="input-wrap relative">
                      <Mail className="h-5 w-5" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. yourname@htu.edu.gh"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                        className="form-input"
                        disabled={isForgotLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2">
                  {!tempPassword && (
                    <button type="submit" className="login-btn cursor-pointer" disabled={isForgotLoading}>
                      {isForgotLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Verifying member record...
                        </span>
                      ) : (
                        "Generate Temporary Password"
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      setForgotEmail("");
                      setForgotError("");
                      setForgotSuccessMsg("");
                      setTempPassword("");
                    }}
                    className="w-full text-center text-xs font-bold text-navy hover:text-gold transition-colors py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-xs text-text-3">
            Ho Technical University Welfare Board Office — <span className="text-gold font-medium">HTU Campus</span>
          </p>
        </div>
      </div>
    </div>
  );
}
