"use client";

import {
  CreditCard, CheckCircle, Landmark, Heart,
  ShieldCheck, Mail, Building, User,
  AlertCircle, Banknote, CheckCheck
} from "lucide-react";
import { STAFF_QUICK_ACTIONS } from "@/lib/navConfig";

// ── Progress Tracker ──────────────────────────────────────────────────────────
function ProgressTracker({ steps, currentStep }) {
  return (
    <div className="flex justify-between items-start relative py-2 w-full">
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <div key={idx} className="flex flex-col items-center z-10 grow relative">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 shrink-0 transition-all ${
              isDone ? "bg-green-50 text-green-700 border-green-600" :
              isActive ? "bg-blue-50 text-blue-800 border-blue-600 ring-4 ring-blue-500/15" :
              "bg-white text-slate-400 border-slate-200"
            }`}>
              {isDone ? <CheckCheck className="w-3.5 h-3.5" /> : <span>{idx + 1}</span>}
            </div>
            {idx < steps.length - 1 && (
              <div className={`absolute top-3.5 left-1/2 w-full h-0.5 -z-10 ${isDone ? "bg-green-500" : "bg-slate-200"}`} />
            )}
            <span className={`text-[10px] mt-1.5 text-center ${isActive ? "text-slate-900 font-bold" : isDone ? "text-green-700 font-semibold" : "text-slate-400"}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StaffOverview({
  userProfile,
  personalContributions,
  loans,
  claims,
  schemeConfig,
  setShowPaymentModal,
  setShowClaimModal,
  setShowLoanModal,
  handleSettleInstallment,
  setActiveTab
}) {
  const activeLoans = loans.filter(l => l.applicant === userProfile.name && l.status === "Active");
  const pendingClaims = (claims || []).filter(c => c.applicant === userProfile.name && c.status === "Pending");
  const paidMonths = personalContributions.length;
  const ytdTotal = personalContributions.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

  const latestClaim = (claims || []).find(c => c.applicant === userProfile.name);
  const claimStep = !latestClaim ? 0
    : latestClaim.status === "Pending" ? 1
    : latestClaim.status === "Approved" ? 3
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── IDENTITY STRIP ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-br from-[#0d1e4c] to-[#060f26] text-white px-6 py-5 rounded-2xl shadow-md">
        {/* Avatar */}
        <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-full flex items-center justify-center relative shrink-0">
          <span className="text-lg font-extrabold">{userProfile.avatarInitials || "ED"}</span>
          <div className="w-3 h-3 bg-[#1a7a4a] border-2 border-[#060f26] rounded-full absolute bottom-0 right-0" />
        </div>

        {/* Info */}
        <div className="flex-grow text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h2 className="text-lg font-extrabold tracking-tight">{userProfile.name}</h2>
            <span className="inline-flex items-center gap-1 bg-green-500/15 border border-green-500/25 text-[#2ecc71] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
            <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-white/70 text-[11px] font-medium px-2 py-0.5 rounded-lg">
              <User className="w-3 h-3" />{userProfile.id}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-white/70 text-[11px] font-medium px-2 py-0.5 rounded-lg">
              <Building className="w-3 h-3" />{userProfile.department || "Computer Science"}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-white/70 text-[11px] font-medium px-2 py-0.5 rounded-lg">
              <Mail className="w-3 h-3" />{userProfile.email}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          className="btn btn-gold btn-sm shrink-0 font-bold"
          onClick={() => setShowPaymentModal(true)}
        >
          <CreditCard className="w-3.5 h-3.5" /> Pay Monthly Dues
        </button>
      </div>

      {/* ── QUICK ACTIONS ───────────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {STAFF_QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          const handleClick = () => {
            if (item.modal === "payment") setShowPaymentModal(true);
            else if (item.modal === "claim") setShowClaimModal(true);
            else if (item.modal === "loan") setShowLoanModal(true);
            else if (item.tab) setActiveTab?.(item.tab);
            else if (item.alert) alert(item.alert);
          };
          return (
            <button
              key={item.id}
              onClick={handleClick}
              className="flex flex-col items-center gap-2.5 bg-white border border-slate-200/80 hover:border-slate-800 hover:shadow-sm p-4.5 rounded-2xl cursor-pointer transition-all duration-200 min-w-[130px] shrink-0 hover:-translate-y-0.5 outline-none"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
              <span className="text-[12px] font-bold text-slate-600">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card navy">
          <div className="stat-icon navy-bg"><Banknote className="w-5 h-5" /></div>
          <div className="stat-val">GH₵{ytdTotal.toFixed(2)}</div>
          <div className="stat-label-text">Contributions YTD</div>
          <span className="stat-change up">↑ GH₵{schemeConfig.monthlyContribution}/mo · {paidMonths} months</span>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green-bg"><CheckCircle className="w-5 h-5" /></div>
          <div className="stat-val">Active</div>
          <div className="stat-label-text">Membership Status</div>
          <span className="stat-change up">Compliant · {paidMonths}/{schemeConfig.eligibilityThreshold || 6} months</span>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon gold-bg"><Landmark className="w-5 h-5" /></div>
          <div className="stat-val">{activeLoans.length > 0 ? `GH₵${activeLoans[0].amount}` : "None"}</div>
          <div className="stat-label-text">Active Loan</div>
          <span className="stat-change down">{activeLoans.length > 0 ? activeLoans[0].id : "No outstanding loans"}</span>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red-bg"><Heart className="w-5 h-5" /></div>
          <div className="stat-val">{pendingClaims.length}</div>
          <div className="stat-label-text">Pending Claims</div>
          <span className="stat-change up">{pendingClaims.length === 0 ? "None pending" : `${pendingClaims.length} under review`}</span>
        </div>
      </div>

      {/* ── TWO-COLUMN: CLAIM STATUS + RECENT CONTRIBUTIONS ─────────────── */}
      <div className="two-col">

        {/* Claim Progress */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Latest Claim Status</div>
            <button className="btn btn-outline btn-sm" onClick={() => setActiveTab?.("claims")}>All Claims</button>
          </div>
          <div className="card-body space-y-5">
            {latestClaim ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy">{latestClaim.type}</span>
                  <span className={`badge ${latestClaim.status === "Approved" ? "badge-green" : latestClaim.status === "Rejected" ? "badge-red" : "badge-gold"}`}>
                    {latestClaim.status}
                  </span>
                </div>
                <ProgressTracker
                  steps={["Submitted", "Under Review", "Board Approval", "Disbursed"]}
                  currentStep={claimStep}
                />
                {latestClaim.notes && (
                  <div className="bg-cream rounded-xl p-3 text-[11px] text-text-2 leading-relaxed border border-border/40">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-gold" />
                    {latestClaim.notes}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 space-y-3">
                <Heart className="w-9 h-9 text-border mx-auto" />
                <p className="text-xs text-text-3 font-semibold">No welfare claims filed yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowClaimModal(true)}>
                  File a Claim
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Contributions</div>
            <button className="btn btn-outline btn-sm" onClick={() => setActiveTab?.("contributions")}>
              Full Statement
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>Ref</th><th>Month</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {personalContributions.slice(0, 5).map((pc, idx) => (
                  <tr key={idx}>
                    <td className="font-bold text-text-3 text-[11px]">{pc.reference}</td>
                    <td className="font-semibold text-navy text-[11px]">{pc.month}</td>
                    <td className="font-bold text-green">GH₵{pc.amount}</td>
                    <td><span className="badge badge-green">Paid</span></td>
                  </tr>
                ))}
                {personalContributions.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-xs text-text-3 py-6">No contributions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Loan repayment inline if active */}
          {activeLoans.length > 0 && (
            <div className="mx-5 mb-5 mt-3 p-4 bg-gold-pale border border-gold/30 rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-gold uppercase block">Monthly Installment Due</span>
                <span className="text-lg font-extrabold text-navy-deep">GH₵{activeLoans[0].monthlyInstallment}.00</span>
                <span className="text-[10px] text-text-3 block mt-0.5">{activeLoans[0].id}</span>
              </div>
              <button onClick={() => handleSettleInstallment(activeLoans[0].id)} className="btn btn-gold btn-sm shrink-0">
                Settle Now
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
