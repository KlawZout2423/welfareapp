"use client";

import { Search, Download, Plus } from "lucide-react";
import { useState } from "react";

export default function MemberRegistry({ members, userRole, setShowMemberModal }) {
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [unionFilter, setUnionFilter] = useState("All Unions");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const filtered = members
    .filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || m.id.toLowerCase().includes(memberSearchQuery.toLowerCase()))
    .filter(m => unionFilter === "All Unions" || m.union === unionFilter)
    .filter(m => statusFilter === "All Status" || m.status === statusFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Members Registry</h2>
          <p>Manage all registered HTU Staff Welfare Scheme members</p>
        </div>
        {userRole === "admin" && (
          <button className="btn btn-primary" onClick={() => setShowMemberModal(true)}>
            <Plus className="w-4 h-4" /> Register Member
          </button>
        )}
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search className="w-4 h-4" />
          <input type="text" placeholder="Search by name, ID, or email..."
            value={memberSearchQuery} onChange={(e) => setMemberSearchQuery(e.target.value)} />
        </div>
        <select className="filter-select" value={unionFilter} onChange={(e) => setUnionFilter(e.target.value)}>
          <option>All Unions</option>
          <option>TUTAG</option><option>TUSAAG</option><option>TEWU</option><option>TUWAG</option><option>TUAAG</option>
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All Status</option>
          <option>Active</option><option>Defaulting</option><option>New</option>
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => alert("Simulation: Members registry list exported.")}>
          <Download className="w-4 h-4" /> Export Registry
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th><th>Staff ID</th><th>Union</th><th>Phone</th>
              <th>Months Paid</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, idx) => (
              <tr key={idx}>
                <td>
                  <div className="member-cell">
                    <div className="mini-avatar">{m.name.split(" ").map(n => n[0]).join("")}</div>
                    <div>
                      <div className="mini-name">{m.name}</div>
                      <div className="mini-id">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="font-bold text-text-2">{m.id}</td>
                <td className="font-bold text-text-3">{m.union}</td>
                <td>{m.phone}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: m.status === "Active" ? "var(--green)" : m.status === "Defaulting" ? "var(--red)" : "var(--gold)" }}>
                      {m.paidMonths}/{m.totalMonths}
                    </span>
                    <div className="prog-bar" style={{ width: "80px" }}>
                      <div className="prog-fill" style={{
                        width: `${(m.paidMonths / m.totalMonths) * 100}%`,
                        backgroundColor: m.status === "Active" ? "var(--green)" : m.status === "Defaulting" ? "var(--red)" : "var(--gold)"
                      }}></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${m.status === "Active" ? "badge-green" : m.status === "Defaulting" ? "badge-red" : "badge-gold"}`}>
                    {m.status}
                  </span>
                </td>
                <td><button className="action-dots" onClick={() => alert(`Simulated Member Profile for ${m.name}`)}>···</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
