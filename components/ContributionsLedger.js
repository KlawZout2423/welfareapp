"use client";

import { useState } from "react";
import { Plus, Download, Search } from "lucide-react";
import { useWelfare } from "@/lib/context/WelfareContext";

export default function ContributionsLedger({
  userRole, members, contributions, personalContributions,
  fundStats, schemeConfig, setShowPaymentModal, searchQuery = ""
}) {
  const { showToastMsg } = useWelfare();
  const TRACKED_MONTHS_FULL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const threshold = schemeConfig.eligibilityThreshold || 6;
  const TRACKED_MONTHS = TRACKED_MONTHS_FULL.slice(0, Math.min(Math.max(threshold, 1), 12));

  const paidSet = new Set(
    (personalContributions || []).map(c => {
      const raw = (c.month || "").split(" ")[0].toLowerCase().slice(0, 3);
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    })
  );

  // Find indices of all paid months
  const paidIndices = TRACKED_MONTHS_FULL
    .map((m, idx) => paidSet.has(m) ? idx : -1)
    .filter(idx => idx !== -1);

  let hasSkippedMonths = false;
  if (paidIndices.length > 0) {
    const minIndex = Math.min(...paidIndices);
    const maxIndex = Math.max(...paidIndices);
    for (let i = minIndex; i <= maxIndex; i++) {
      if (!paidSet.has(TRACKED_MONTHS_FULL[i])) {
        hasSkippedMonths = true;
        break;
      }
    }
  }

  const isConsecutivelyCompliant = (personalContributions || []).length >= threshold && !hasSkippedMonths;

  // Live stats for admin summary cards
  const staffMembers = contributions; // dues_ledger rows (staff only)
  const totalExpected = staffMembers.length * schemeConfig.monthlyContribution;
  const totalCollectedLive = staffMembers.reduce((sum, m) => sum + (parseFloat(m.total) || 0), 0);
  const defaulters = staffMembers.filter(m => !m[TRACKED_MONTHS[TRACKED_MONTHS.length - 1]?.toLowerCase()]);
  const outstandingAmount = (defaulters.length) * schemeConfig.monthlyContribution;
  const collectionRate = totalExpected > 0 ? Math.min((totalCollectedLive / totalExpected) * 100, 100) : 0;
  const defaultRate = staffMembers.length > 0 ? (defaulters.length / staffMembers.length) * 100 : 0;

  // Month filter state for admin view
  const allMonthOptions = ["All Months", "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026", "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"];
  const [selectedMonth, setSelectedMonth] = useState("All Months");

  // Filter contributions by search query
  const filteredContributions = contributions.filter(c => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (c.name || "").toLowerCase().includes(q) || (c.id || "").toLowerCase().includes(q) || (c.union || "").toLowerCase().includes(q);
  });

  // CSV export helper
  const downloadCSV = (filename, headers, rows) => {
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Contributions</h2>
          <p>{userRole === "staff" ? "Track your monthly welfare dues contributions." : "Track and manage monthly member contributions."}</p>
        </div>
        {userRole === "staff" && (
          !isConsecutivelyCompliant ? (
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
              <Plus className="w-4 h-4" /> Contribute Monthly Dues
            </button>
          ) : (
            <span className="badge badge-green py-2 px-3 font-bold text-xs">✓ Dues Up-to-Date</span>
          )
        )}
        {userRole === "admin" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <select className="filter-select" style={{ padding: "10px 14px" }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {allMonthOptions.map(m => <option key={m}>{m}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>Record Member Payment</button>
          </div>
        )}
      </div>

      {userRole === "staff" ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">My Dues Payment History</div>
            <button className="btn btn-outline btn-sm" onClick={() => {
              const headers = ["Receipt ID", "Transaction Ref", "Month", "Date Paid", "Amount", "Status"];
              const rows = personalContributions.map(c => [`REC-HTU-${c.id}`, c.reference, c.month, c.date, `GH₵${c.amount}.00`, "success"]);
              downloadCSV(`HTU_Dues_Statement_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
            }}>
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
              <div className="contrib-amount" style={{ color: "var(--navy)" }}>GH₵{totalCollectedLive.toLocaleString()}</div>
              <div className="contrib-label">Total Collected (All Months)</div>
              <div className="prog-bar" style={{ marginTop: "12px" }}>
                <div className="prog-fill" style={{ width: `${collectionRate.toFixed(1)}%`, backgroundColor: "var(--green)" }}></div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", fontWeight: "600" }}>{collectionRate.toFixed(1)}% collection rate</div>
            </div>
            <div className="contrib-card">
              <div className="contrib-amount" style={{ color: "var(--red)" }}>GH₵{outstandingAmount.toLocaleString()}</div>
              <div className="contrib-label">Outstanding ({defaulters.length} defaulters)</div>
              <div className="prog-bar" style={{ marginTop: "12px" }}>
                <div className="prog-fill" style={{ width: `${defaultRate.toFixed(1)}%`, backgroundColor: "var(--red)" }}></div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--red)", marginTop: "4px", fontWeight: "600" }}>{defaultRate.toFixed(1)}% default rate</div>
            </div>
            <div className="contrib-card">
              <div className="contrib-amount" style={{ color: "var(--gold)" }}>GH₵{totalExpected.toLocaleString()}</div>
              <div className="contrib-label">Expected ({staffMembers.length} × GH₵{schemeConfig.monthlyContribution})</div>
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-3)" }}>{staffMembers.length} registered staff members</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Contribution Ledger</div>
              {userRole === "admin" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-outline btn-sm" onClick={() => showToastMsg(`SMS reminder queued for ${defaulters.length} defaulting member(s). Gateway pending.`)}>SMS Defaulters</button>
                  <button className="btn btn-outline btn-sm" onClick={() => {
                    const months = TRACKED_MONTHS.map(m => m.toLowerCase());
                    const headers = ["Member", "Staff ID", "Union", ...TRACKED_MONTHS, "Total Paid"];
                    const rows = filteredContributions.map(c => [c.name, c.id, c.union, ...months.map(m => c[m] ? "Paid" : "Unpaid"), `GH₵${c.total}`]);
                    downloadCSV(`HTU_Contributions_Ledger_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
                  }}>Export CSV Ledger</button>
                </div>
              )}
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th><th>Staff ID</th><th>Union</th>
                    {TRACKED_MONTHS.map(m => (
                      <th key={m}>{m}</th>
                    ))}
                    <th>Total Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const displayedLedger = filteredContributions.filter(c => {
                      if (selectedMonth === "All Months") return true;
                      const col = selectedMonth.split(" ")[0].toLowerCase().slice(0, 3);
                      return c[col] === true;
                    });

                    if (displayedLedger.length === 0) {
                      return (
                        <tr>
                          <td colSpan={TRACKED_MONTHS.length + 4} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-2 text-text-3">
                              <Search className="w-8 h-8 opacity-40 text-gold" />
                              <p className="font-bold text-sm text-navy-deep">No Contribution Records Found</p>
                              <p className="text-xs font-semibold">Try adjusting your filters or search query.</p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return displayedLedger.map((c, idx) => {
                      const months = TRACKED_MONTHS.map(m => m.toLowerCase());
                      const lastMonthKey = months[months.length - 1];
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
                          <td style={{ fontWeight: "600", color: c[lastMonthKey] ? "var(--green)" : "var(--red)" }}>GH₵{c.total}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
