"use client";

import { Plus, AlertCircle } from "lucide-react";

export default function ClaimsTracker({
  userRole, userProfile, claims,
  setShowClaimModal, handleApproveClaim, handleRejectClaim
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Welfare Benefit Claims</h2>
          <p>Apply for support benefits and check progress.</p>
        </div>
        {userRole === "staff" && (
          <button className="btn btn-primary" onClick={() => setShowClaimModal(true)}>
            <Plus className="w-4 h-4" /> File Benefit Claim
          </button>
        )}
        {userRole === "admin" && (
          <button className="btn btn-primary" onClick={() => setShowClaimModal(true)}>Record Claim for Member</button>
        )}
      </div>

      {/* Admin pipeline summary cards */}
      {userRole === "admin" && (
        <div className="claims-pipeline">
          <div className="pipeline-card" style={{ borderTopColor: "var(--gold)" }}>
            <div className="pipeline-num text-gold">{claims.filter(c => c.status === "Pending").length}</div>
            <div className="pipeline-label">Pending Review</div>
          </div>
          <div className="pipeline-card" style={{ borderTopColor: "var(--blue)" }}>
            <div className="pipeline-num text-blue">{claims.filter(c => c.status === "Under Review").length}</div>
            <div className="pipeline-label">Under Investigation</div>
          </div>
          <div className="pipeline-card" style={{ borderTopColor: "var(--green)" }}>
            <div className="pipeline-num text-green">{claims.filter(c => c.status === "Approved").length}</div>
            <div className="pipeline-label">Approved &amp; Paid</div>
          </div>
          <div className="pipeline-card" style={{ borderTopColor: "var(--red)" }}>
            <div className="pipeline-num text-red">{claims.filter(c => c.status === "Rejected").length}</div>
            <div className="pipeline-label">Rejected Requests</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {userRole === "staff" ? "My Welfare Claims & Entitlements Tracker" : "Claims Registry"}
          </div>
        </div>
        <div className="card-body">
          {userRole === "staff" ? (
            <div className="space-y-6">
              {claims
                .filter(c => c.applicant === userProfile.name)
                .map((c, idx) => {
                  const steps = [
                    { label: "Submitted", desc: "Claim logged in system", done: true, current: false },
                    { label: "Under Review", desc: "Welfare board verification", done: c.status !== "Pending", current: c.status === "Pending" },
                    { label: "Decision", desc: c.status === "Rejected" ? "Claim Rejected" : c.status === "Approved" ? "Claim Approved" : "Awaiting Decision", done: c.status === "Approved", current: false, failed: c.status === "Rejected" },
                    { label: "Disbursement", desc: c.status === "Approved" ? "Disbursed via Bank" : "Payout pending", done: c.status === "Approved", current: false }
                  ];
                  return (
                    <div key={idx} className="p-6 bg-white border border-border/40 rounded-2xl shadow-sm space-y-6 hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                        <div>
                          <span className="text-[10px] font-bold text-navy uppercase tracking-wider bg-navy-mid/5 px-2.5 py-1 rounded-md">{c.id}</span>
                          <h3 className="text-base font-bold text-navy mt-1.5 font-sans">{c.type}</h3>
                          <p className="text-xs text-text-3 font-semibold mt-0.5">Submitted on: {c.date}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-text-3 uppercase block">Entitlement Payout</span>
                          <span className="text-lg font-extrabold text-navy-deep font-sans">GH₵ {c.amount.toLocaleString()}.00</span>
                        </div>
                      </div>

                      <p className="text-xs text-text-2 italic bg-cream/30 p-3 rounded-lg border border-border/20">
                        <strong>Status Detail:</strong> {c.notes}
                      </p>

                      {/* Progress Steps UI */}
                      <div className="relative pt-2 pb-6">
                        <div className="relative flex items-center justify-between w-full">
                          <div className="absolute left-0 right-0 h-1 bg-border/40 top-[18px] -z-10 rounded-full" />
                          <div className="absolute left-0 h-1 bg-green top-[18px] -z-10 rounded-full transition-all duration-500"
                            style={{ width: c.status === "Approved" ? "100%" : c.status === "Rejected" ? "66.6%" : "33.3%" }} />
                          {steps.map((step, sIdx) => {
                            let bubbleClass = "bg-white text-text-3 border-border/80";
                            if (step.done) bubbleClass = "bg-green text-white border-green";
                            else if (step.failed) bubbleClass = "bg-red text-white border-red";
                            else if (step.current) bubbleClass = "bg-gold text-white border-gold animate-pulse";
                            return (
                              <div key={sIdx} className="flex flex-col items-center text-center flex-1 relative">
                                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-sm transition-all ${bubbleClass}`}>
                                  {step.done ? "✓" : step.failed ? "✕" : sIdx + 1}
                                </div>
                                <span className="text-[11px] font-bold text-navy mt-2 block">{step.label}</span>
                                <span className="text-[10px] text-text-3 font-semibold mt-0.5 hidden md:block">{step.desc}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {claims.filter(c => c.applicant === userProfile.name).length === 0 && (
                <div className="text-center py-10 text-text-3 font-semibold">No benefit claims submitted yet.</div>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Applicant</th>
                    <th>Benefit Type</th>
                    <th>Amount</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                    {userRole === "admin" && <th>Action Options</th>}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c, idx) => (
                    <tr key={idx}>
                      <td className="font-bold text-text-3 text-xs">{c.id}</td>
                      <td className="font-semibold">{c.applicant} ({c.index})</td>
                      <td className="font-bold text-text-2">{c.type}</td>
                      <td className="font-bold text-navy-deep">GH₵{c.amount}</td>
                      <td>{c.date}</td>
                      <td>
                        <span className={`badge ${c.status === "Approved" ? "badge-green" : c.status === "Rejected" ? "badge-red" : "badge-gold"}`}>
                          {c.status}
                        </span>
                      </td>
                      {userRole === "admin" && (
                        <td>
                          {c.status === "Pending" ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleApproveClaim(c.id)} className="btn btn-sm"
                                style={{ background: "var(--green-pale)", color: "var(--green)", border: "none", cursor: "pointer", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: "600" }}>
                                Approve
                              </button>
                              <button onClick={() => handleRejectClaim(c.id)} className="btn btn-sm"
                                style={{ background: "var(--red-pale)", color: "var(--red)", border: "none", cursor: "pointer", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: "600" }}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-3 font-semibold">Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
