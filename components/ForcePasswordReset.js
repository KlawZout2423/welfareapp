"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, KeyRound } from "lucide-react";

export default function ForcePasswordReset({ userEmail, currentPassword, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Password strength check
  const hasMin = newPassword.length >= 6;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const strength = [hasMin, hasUpper, hasNumber].filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = ["", "bg-red", "bg-gold", "bg-green"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!hasMin) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          payload: {
            email: userEmail,
            currentPassword,
            newPassword,
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to update password.");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-navy-deep/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy-mid px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-bold text-base">Set Your Password</h3>
              <p className="text-[11px] text-white/60 mt-0.5">You must create a personal password before continuing.</p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mx-6 mt-5 flex items-start gap-2.5 bg-gold-pale border border-gold/30 px-4 py-3 rounded-xl text-xs font-semibold text-navy">
          <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <span>
            For security, the default password assigned to your account must be replaced with a personal one.
            This is a one-time step.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-pale border border-red/30 text-red px-3 py-2.5 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* New password */}
          <div className="form-field">
            <label>New Password</label>
            <div className="input-wrap">
              <Lock className="h-5 w-5" />
              <input
                type={showNew ? "text" : "password"}
                required
                placeholder="Enter a strong password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                className="form-input"
                disabled={isLoading}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="eye-btn" disabled={isLoading}>
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Strength meter */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthColor : "bg-slate-200"}`} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-text-3">Strength: <span className={strength === 3 ? "text-green" : strength === 2 ? "text-gold" : "text-red"}>{strengthLabel}</span></span>
                  <div className="flex gap-3 text-text-3">
                    <span className={hasMin ? "text-green" : ""}>6+ chars</span>
                    <span className={hasUpper ? "text-green" : ""}>Uppercase</span>
                    <span className={hasNumber ? "text-green" : ""}>Number</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="form-field">
            <label>Confirm New Password</label>
            <div className="input-wrap">
              <Lock className="h-5 w-5" />
              <input
                type={showConfirm ? "text" : "password"}
                required
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                className="form-input"
                disabled={isLoading}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="eye-btn" disabled={isLoading}>
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[10px] text-red font-semibold mt-1">Passwords do not match.</p>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <p className="text-[10px] text-green font-semibold mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !hasMin || newPassword !== confirmPassword}
            className="w-full btn btn-primary py-3 justify-center font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Set New Password & Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
