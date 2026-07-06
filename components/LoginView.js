"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Info } from "lucide-react";

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loginEmail) return;
    onLogin(loginEmail, loginPassword);
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
          <div className="form-group">
            <div className="flex justify-between items-center">
              <label>Staff ID / Institutional Email</label>
              <div className="relative">
                <button type="button" onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                  className="text-[11px] text-gold font-bold flex items-center gap-1 hover:text-navy">
                  <Info className="w-3.5 h-3.5" /> Help Desk
                </button>
                {showHelpTooltip && (
                  <div className="absolute right-0 top-6 z-[10] w-[260px] bg-white border border-border rounded-xl shadow-xl p-3 text-left space-y-1">
                    <span className="text-[10px] font-bold text-navy uppercase block">Staff Portal Guide</span>
                    <p className="text-[11px] text-text-2 leading-relaxed">To demo, input one of the following emails:</p>
                    <ul className="text-[10.5px] font-semibold text-text-3 list-disc list-inside space-y-0.5">
                      <li><span className="text-navy">Staff:</span> eugene.dushie@htu.edu.gh</li>
                      <li><span className="text-navy">Manager:</span> manager@htu.edu.gh</li>
                      <li><span className="text-navy">Auditor:</span> auditor@htu.edu.gh</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="input-wrap">
              <Mail className="h-5 w-5" />
              <input type="text" required placeholder="e.g. eugene.dushie@htu.edu.gh"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label>Portal Password</label>
            <div className="input-wrap">
              <Lock className="h-5 w-5" />
              <input type={showPassword ? "text" : "password"} required placeholder="••••••••"
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="form-input" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="form-footer">
            <label className="remember-wrap">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <span>Remember session</span>
            </label>
            <a href="#" className="forgot-link" onClick={() => alert("Simulation: Reset code sent to institutional administrator.")}>
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="login-btn">Authorize Access</button>
        </form>

        <div className="footer-note">
          Ho Technical University Welfare Board Office — <span>HTU Campus</span>
        </div>
      </div>
    </div>
  );
}
