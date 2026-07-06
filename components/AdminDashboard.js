"use client";

import { Check, AlertCircle, ChevronRight, Heart, Send } from "lucide-react";
import StatsGrid from "@/components/StatsGrid";
import { ADMIN_QUICK_ACTIONS } from "@/lib/navConfig";

export default function AdminDashboard({
  userRole,
  members,
  claims,
  fundStats,
  activities,
  setActiveTab,
  setShowMemberModal,
  handleBackupDatabase
}) {
  const pendingClaims = claims.filter(c => c.status === "Pending");

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── QUICK ACTIONS ─────────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {ADMIN_QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          const handleClick = () => {
            if (item.id === "backup") {
              handleBackupDatabase();
            } else if (item.tab) {
              setActiveTab(item.tab);
              if (item.modal === "member") setShowMemberModal(true);
            } else if (item.alert) alert(item.alert);
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

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <StatsGrid members={members} claims={claims} fundStats={fundStats} />

      {/* ── SCHEME HEALTH & SECURITY KPIs ───────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Scheme Health &amp; Compliance KPIs</div>
            <div className="card-subtitle">Real-time metrics for data privacy, processing turnaround, and risk factors</div>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> GDPR Compliant
          </span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* KPI 1 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Average Turnaround Time</span>
              <span className="text-2xl font-extrabold text-slate-800">2.4 Days</span>
              <span className="text-[10px] text-green-600 font-semibold block">↓ 12% vs last month</span>
            </div>
            {/* KPI 2 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Defaulter Rate</span>
              <span className="text-2xl font-extrabold text-slate-800">
                {members.length > 0 ? ((members.filter(m => m.status === "Defaulting").length / members.length) * 100).toFixed(1) : 0}%
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block">Target: Under 5%</span>
            </div>
            {/* KPI 3 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Data Encryption Status</span>
              <span className="text-2xl font-extrabold text-[#1565c0]">SSL/TLS</span>
              <span className="text-[10px] text-slate-500 font-semibold block">Enforced at rest &amp; in-transit</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHARTS + UNION BREAKDOWN ──────────────────────────────────── */}
      <div className="three-col">

        {/* Monthly Collections Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Contributions</div>
              <div className="card-subtitle">Expected vs Collected (2026)</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => alert("Simulation: Exporting CSV.")}>
              Export
            </button>
          </div>
          <div className="card-body">
            <div className="chart-bars">
              {[
                { month: "Jan", expected: 72, collected: 70 },
                { month: "Feb", expected: 80, collected: 78 },
                { month: "Mar", expected: 88, collected: 85 },
                { month: "Apr", expected: 75, collected: 73 },
                { month: "May", expected: 92, collected: 90 },
                { month: "Jun", expected: 96, collected: 94 },
              ].map((b, idx) => (
                <div key={idx} className="bar-group">
                  <div className="bar-wrap">
                    <div className="bar navy-bar" style={{ height: `${b.expected}%` }} />
                    <div className="bar gold-bar" style={{ height: `${b.collected}%` }} />
                  </div>
                  <span className="bar-label">{b.month}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: "var(--navy)" }} />Expected
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: "var(--gold)" }} />Collected
              </div>
            </div>
          </div>
        </div>

        {/* Union Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Union Breakdown</div>
          </div>
          <div className="card-body" style={{ padding: "16px 20px" }}>
            <div className="donut-legend">
              {[
                { name: "TUTAG",  count: 98, pct: 40, color: "#1a2744" },
                { name: "TUSAAG", count: 62, pct: 25, color: "var(--gold)" },
                { name: "TEWU",   count: 42, pct: 17, color: "var(--green)" },
                { name: "TUWAG",  count: 28, pct: 11, color: "var(--red)" },
                { name: "TUAAG",  count: 18, pct:  7, color: "var(--blue)" },
              ].map((u, idx) => (
                <div key={idx} className="donut-item">
                  <div className="donut-dot" style={{ backgroundColor: u.color }} />
                  <div className="donut-info">
                    <div className="flex justify-between">
                      <span className="donut-name">{u.name}</span>
                      <span className="font-semibold text-navy text-xs">
                        {u.count} <span className="text-text-3 font-normal">({u.pct}%)</span>
                      </span>
                    </div>
                    <div className="donut-bar-bg">
                      <div className="donut-bar-fill" style={{ width: `${u.pct}%`, backgroundColor: u.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVITY LOG + PENDING CLAIMS ─────────────────────────────── */}
      <div className="two-col">

        {/* Activity Timeline */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-subtitle">Latest ledger events</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 22px" }}>
            <div className="activity-list max-h-[280px] overflow-y-auto pr-1">
              {activities.map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-icon" style={{
                    backgroundColor: act.type === "in" ? "var(--green-pale)" : act.type === "claim" ? "var(--blue-pale)" : "var(--gold-pale)",
                    color: act.type === "in" ? "var(--green)" : act.type === "claim" ? "var(--blue)" : "var(--gold)"
                  }}>
                    {act.type === "in" ? <Check className="w-4 h-4" /> : act.type === "claim" ? <Heart className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </div>
                  <div className="activity-body text-left">
                    <div className="activity-title font-semibold">
                      {act.title}
                      {act.amount !== "Broadcast" && act.amount !== "New Member" && (
                        <span className="font-bold text-xs text-navy ml-1">{act.amount}</span>
                      )}
                    </div>
                    <div className="activity-time">{act.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Claims Queue */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Pending Claims</div>
              <div className="card-subtitle">Awaiting board approval</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setActiveTab("claims")}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.slice(0, 5).map((c, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="member-cell">
                        <div className="mini-avatar">{c.applicant.split(" ").map(n => n[0]).join("")}</div>
                        <div>
                          <div className="mini-name">{c.applicant}</div>
                          <div className="mini-id">{c.index}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold text-text-2 text-xs">{c.type}</td>
                    <td className="font-bold text-navy-deep">GH₵{c.amount.toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveTab("claims")}
                      >
                        Review <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingClaims.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8">
                      <AlertCircle className="w-7 h-7 text-border mx-auto mb-2" />
                      <p className="text-xs text-text-3 font-semibold">No pending claims.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
