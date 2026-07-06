"use client";

import { Plus, Landmark, Check, AlertCircle } from "lucide-react";

export default function LoansTracker({
  userRole, userProfile, loans, fundStats,
  setShowLoanModal, handleSettleInstallment, handleApproveLoan, handleRejectLoan
}) {
  const myLoans = loans.filter(l => l.applicant === userProfile.name);
  const myActiveLoans = myLoans.filter(l => l.status === "Active");
  const isAuditor = userRole === "auditor";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Emergency Loans</h2>
          <p>Access emergency cash assistance with zero interest rate repayment limits.</p>
        </div>
        {userRole === "staff" && (
          <button className="btn btn-primary" onClick={() => setShowLoanModal(true)}>
            <Plus className="w-4 h-4" /> Request Emergency Loan
          </button>
        )}
      </div>

      {userRole === "staff" ? (
        <div className="two-col animate-fade-in">
          <div className="space-y-6">
            {/* Active Outstanding Loan */}
            <div className="card">
              <div className="card-header"><div className="card-title">My Active Outstanding Loan</div></div>
              <div className="card-body space-y-4">
                {myActiveLoans.map((l, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="contrib-card">
                        <div className="contrib-amount text-navy-deep">GH₵{l.amount}.00</div>
                        <div className="contrib-label">Total Principal Borrowed</div>
                      </div>
                      <div className="contrib-card">
                        <div className="contrib-amount text-green">GH₵{l.repaid}.00</div>
                        <div className="contrib-label">Total Repaid to Date</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Repayment Progress</span>
                        <span>{Math.round((l.repaid / l.amount) * 100)}%</span>
                      </div>
                      <div className="prog-bar">
                        <div className="prog-fill bg-green" style={{ width: `${(l.repaid / l.amount) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
                {myActiveLoans.length === 0 && (
                  <div className="text-center py-6 text-text-3 font-semibold">No active loan liabilities.</div>
                )}
              </div>
            </div>

            {/* All Loan Application Status Tracker */}
            <div className="card">
              <div className="card-header"><div className="card-title font-semibold">Loan Application Status Tracker</div></div>
              <div className="card-body space-y-4">
                {myLoans.map((l, lIdx) => {
                  const steps = [];
                  if (l.status === "Rejected") {
                    steps.push({ label: "Requested", done: true, failed: false });
                    steps.push({ label: "Rejected", done: false, failed: true });
                  } else {
                    steps.push({ label: "Requested", done: true, current: false });
                    steps.push({ label: "Approved", done: l.status !== "Pending", current: l.status === "Pending" });
                    steps.push({ label: "Active Dues", done: l.status === "Repaid", current: l.status === "Active" });
                    steps.push({ label: "Fully Settled", done: l.status === "Repaid", current: false });
                  }
                  return (
                    <div key={lIdx} className="p-4 bg-cream/20 border border-border/30 rounded-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-border/20 pb-2">
                        <div>
                          <span className="text-xs font-bold text-navy">{l.id}</span>
                          <span className="text-[10px] text-text-3 font-semibold ml-2">Filed: {l.date}</span>
                        </div>
                        <span className="text-sm font-bold text-navy-deep">GH₵ {l.amount.toLocaleString()}</span>
                      </div>
                      <div className="relative pt-2 pb-4">
                        <div className="relative flex items-center justify-between w-full">
                          <div className="absolute left-0 right-0 h-0.5 bg-border/40 top-[14px] -z-10 rounded-full" />
                          <div className="absolute left-0 h-0.5 bg-green top-[14px] -z-10 rounded-full transition-all duration-500"
                            style={{ width: l.status === "Repaid" ? "100%" : l.status === "Active" ? "66.6%" : "33.3%" }} />
                          {steps.map((step, sIdx) => {
                            let cls = "bg-white text-text-3 border-border/80";
                            if (step.done) cls = "bg-green text-white border-green";
                            else if (step.failed) cls = "bg-red text-white border-red";
                            else if (step.current) cls = "bg-gold text-white border-gold animate-pulse";
                            return (
                              <div key={sIdx} className="flex flex-col items-center text-center flex-1 relative">
                                <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shadow-sm transition-all ${cls}`}>
                                  {step.done ? "✓" : step.failed ? "✕" : sIdx + 1}
                                </div>
                                <span className="text-[10px] font-bold text-navy mt-1.5 block">{step.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Repayment Installment Scheduler */}
          <div className="card">
            <div className="card-header"><div className="card-title font-semibold">Repayment Installment Scheduler</div></div>
            <div className="card-body">
              {myActiveLoans.map((l, idx) => (
                <div key={idx} className="p-4 bg-gold-pale border border-gold/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gold uppercase block">Installment Due</span>
                    <span className="text-xl font-bold text-navy-deep">GH₵{l.monthlyInstallment}.00</span>
                    <span className="text-[10px] text-text-3 block mt-0.5">Repayment Term Remaining: {l.term}</span>
                  </div>
                  <button onClick={() => handleSettleInstallment(l.id)} className="btn btn-gold btn-sm">
                    Pay Installment
                  </button>
                </div>
              ))}
              {myActiveLoans.length === 0 && (
                <div className="text-center py-6 text-text-3 font-semibold">Installment planner is clean.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Admin metrics
        <div className="stats-grid">
          <div className="stat-card gold">
            <div className="stat-icon gold-bg"><Landmark className="w-5 h-5" /></div>
            <div className="stat-val">GH₵{fundStats.activeLoans.toLocaleString()}.00</div>
            <div className="stat-label-text">Outstanding Loan Liabilities</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon green-bg"><Check className="w-5 h-5" /></div>
            <div className="stat-val">{loans.filter(l => l.status === "Active").length} Active</div>
            <div className="stat-label-text">Active Borrowers</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon red-bg"><AlertCircle className="w-5 h-5" /></div>
            <div className="stat-val">{loans.filter(l => l.status === "Pending").length} Pending</div>
            <div className="stat-label-text">Pending Applications</div>
          </div>
        </div>
      )}

      {/* Loans Database Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Emergency Loan Database</div>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Borrower</th>
                  <th>Borrowed Amount</th>
                  <th>Installment Rate</th>
                  <th>Repaid / Loan Total</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  {(userRole === "admin" || isAuditor) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loans
                  .filter(l => userRole !== "staff" || l.applicant === userProfile.name)
                  .map((l, idx) => (
                    <tr key={idx}>
                      <td className="font-bold text-text-3 text-xs">{l.id}</td>
                      <td className="font-semibold">{l.applicant}</td>
                      <td className="font-bold text-navy-deep">GH₵{l.amount}</td>
                      <td className="font-bold text-text-3">GH₵{l.monthlyInstallment}/mo</td>
                      <td className="font-medium text-text-2">GH₵{l.repaid} / GH₵{l.amount}</td>
                      <td>{l.date}</td>
                      <td>
                        <span className={`badge ${l.status === "Active" ? "badge-green" : l.status === "Repaid" ? "badge-blue" : l.status === "Rejected" ? "badge-red" : "badge-gold"}`}>
                          {l.status}
                        </span>
                      </td>
                      {(userRole === "admin" || isAuditor) && (
                        <td>
                          {userRole === "admin" && l.status === "Pending" ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleApproveLoan(l.id)} className="btn btn-sm btn-gold" style={{ fontSize: "11px", padding: "5px 10px" }}>Approve</button>
                              <button onClick={() => handleRejectLoan(l.id)} className="btn btn-sm"
                                style={{ background: "var(--red-pale)", color: "var(--red)", border: "none", cursor: "pointer", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: "600" }}>Reject</button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-3 font-semibold">
                              {isAuditor ? "Read-Only" : "Processed"}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
