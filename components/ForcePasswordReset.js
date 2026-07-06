"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, KeyRound } from "lucide-react";

function PasswordInput({ value, onChange, show, onToggle, placeholder, disabled }) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type={show ? "text" : "password"}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm font-medium text-navy-deep bg-white outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition disabled:bg-slate-50 disabled:cursor-not-allowed placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function ForcePasswordReset({ userEmail, currentPassword, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMin    = newPassword.length >= 6;
  const hasUpper  = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const strength  = [hasMin, hasUpper, hasNumber].filter(Boolean).length;
  const matches   = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = hasMin && matches && !isLoading;

  const strengthMeta = [
    { label: "Weak",   bar: "bg-red"   },
    { label: "Fair",   bar: "bg-gold"  },
    { label: "Strong", bar: "bg-green" },
  ][strength - 1] ?? { label: "", bar: "" };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!hasMin) { setError("Password must be at least 6 characters."); return; }
    if (!matches) { setError("Passwords do not match."); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          payload: { email: userEmail, currentPassword, newPassword }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Failed to update password."); return; }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(6,15,38,0.75)", backdropFilter: "blur(4px)" }}>

      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-[#0d1e4c] to-[#162a66]">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-4.5 h-4.5 text-gold" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Set Your Password</p>
            <p className="text-white/50 text-[11px] mt-0.5">One-time setup before you continue</p>
          </div>
        </div>

        {/* ── Notice ── */}
        <div className="mx-5 mt-5 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 font-semibold leading-relaxed">
            Your account was assigned a default password. Please create a personal one to secure your access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* New password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              New Password
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
              placeholder="Choose a strong password"
              disabled={isLoading}
            />

            {/* Strength bar */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthMeta.bar : "bg-slate-200"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-slate-400">
                    Strength:{" "}
                    <span className={strength === 3 ? "text-green-600" : strength === 2 ? "text-blue-600" : "text-red-500"}>
                      {strengthMeta.label}
                    </span>
                  </span>
                  <div className="flex gap-3 text-slate-400">
                    <span className={hasMin    ? "text-green-600" : ""}>6+ chars</span>
                    <span className={hasUpper  ? "text-green-600" : ""}>A–Z</span>
                    <span className={hasNumber ? "text-green-600" : ""}>0–9</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Confirm Password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              placeholder="Re-enter your password"
              disabled={isLoading}
            />
            {confirmPassword.length > 0 && (
              <p className={`text-[10px] font-semibold flex items-center gap-1 ${matches ? "text-green-600" : "text-red-500"}`}>
                {matches
                  ? <><ShieldCheck className="w-3 h-3" /> Passwords match</>
                  : "Passwords do not match"}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canSubmit ? "var(--navy)" : "#94a3b8" }}
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : "Set Password & Continue"}
          </button>

        </form>
      </div>
    </div>
  );
}
