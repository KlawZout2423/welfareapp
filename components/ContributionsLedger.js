"use client";

import { Plus, Download } from "lucide-react";

export default function ContributionsLedger({
  userRole, members, contributions, personalContributions,
  fundStats, schemeConfig, setShowPaymentModal
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Contributions</h2>
          <p>{userRole === "staff" ? "Track your monthly welfare dues contributions." : "Track and manage monthly member contributions."}</p>
        </div>
        {userRole === "staff" && (
          <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
            <Plus className="w-4 h-4" /> Contribute Monthly Dues
          </button>
        )}
        {userRole === "admin" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <select className="filter-select" style={{ padding: "10px 14px" }}>
              <option>June 2026</option><option>May 2026</option>
            </select>
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>Record Member Payment</button>
          </div>
        )}
      </div>

      {userRole === "staff" ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">My Dues Payment History</div>
            <button className="btn btn-outline btn-sm" onClick={() => alert("Simulation: Receipt report generated.")}>
              Download Statement
            </button>
          </div>
          <div className="card-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt ID</th><th>Transaction Ref</th><th>Contribution Month</th>
                    <th>Date paid</th><th>Amount</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {personalContributions.map((c, idx) => (
                    <tr key={idx}>
                      <td className="font-bold text-text-3">REC-HTU-{c.id}</td>
                      <td className="font-bold">{c.reference}</td>
                      <td className="font-semibold text-navy">{c.month}</td>
                      <td>{c.date}</td>
                      <td className="font-bold text-green">GH₵{c.amount}.00</td>
                      <td><span className="badge badge-green">success</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="contribution-summary">
            <div className="contrib-card">
              <div className="contrib-amount" style={{ color: "var(--navy)" }}>GH₵{fundStats.juneCollections.toLocaleString()}</div>
              <div className="contrib-label">Collected (June 2026)</div>
              <div className="prog-bar" style={{ marginTop: "12px" }}>
                <div className="prog-fill" style={{ width: "96.2%", backgroundColor: "var(--green)" }}></div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", fontWeight: "600" }}>96.2% collection rate</div>
            </div>
            <div className="contrib-card">
              <div className="contrib-amount" style={{ color: "var(--red)" }}>GH₵200</div>
              <div className="contrib-label">Outstanding (8 defaulters)</div>
              <div className="prog-bar" style={{ marginTop: "12px" }}>
                <div className="prog-fill" style={{ width: "3.8%", backgroundColor: "var(--red)" }}></div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--red)", marginTop: "4px", fontWeight: "600" }}>3.8% default rate</div>
            </div>
            <div className="contrib-card">
              <div className="contrib-amount" style={{ color: "var(--gold)" }}>GH₵{((members.length || 248) * schemeConfig.monthlyContribution).toLocaleString()}</div>
              <div className="contrib-label">Expected ({members.length} × GH₵{schemeConfig.monthlyContribution})</div>
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-3)" }}>{members.length} active members</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Contribution Ledger</div>
              {userRole === "admin" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-outline btn-sm" onClick={() => alert("Simulation: SMS reminder broadcast queued for defaulters.")}>SMS Defaulters</button>
                  <button className="btn btn-outline btn-sm" onClick={() => alert("Simulation: CSV Ledger file generated.")}>Export CSV Ledger</button>
                </div>
              )}
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th><th>Staff ID</th><th>Union</th>
                  <th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th><th>Jun</th><th>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c, idx) => {
                  const months = ["jan", "feb", "mar", "apr", "may", "jun"];
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="member-cell">
                          <div className="mini-avatar">{c.name.split(" ").map(n => n[0]).join("")}</div>
                          <div className="mini-name">{c.name}</div>
                        </div>
                      </td>
                      <td className="font-bold text-text-2">{c.id}</td>
                      <td className="font-bold text-text-3">{c.union}</td>
                      {months.map(m => (
                        <td key={m}>{c[m] ? <span className="badge badge-green">✓</span> : <span className="badge badge-red">✗</span>}</td>
                      ))}
                      <td style={{ fontWeight: "600", color: c.jun ? "var(--green)" : "var(--red)" }}>GH₵{c.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
