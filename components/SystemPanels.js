"use client";

import { useState } from "react";
import { Check, Info, ShieldCheck } from "lucide-react";

// --- SMS Broadcast Panel ---
export function SMSPanel({ userRole, members = [], smsData, setSmsData, smsHistory = [], handleSendSMS, isSubmittingSMS }) {
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [targetType, setTargetType] = useState("all"); // "all", "single", "union", "defaulting", "custom"
  const [selectedUnion, setSelectedUnion] = useState("TUTAG");

  const totalCount = members.length;
  const tutagCount = members.filter(m => (m.union || m.union_name) === "TUTAG").length;
  const tusagCount = members.filter(m => (m.union || m.union_name) === "TUSAG").length;
  const tewuCount = members.filter(m => (m.union || m.union_name) === "TEWU").length;
  const gauaCount = members.filter(m => (m.union || m.union_name) === "GAUA").length;
  const defaultingCount = members.filter(m => m.status === "Defaulting").length;

  const handleTargetTypeChange = (type) => {
    setTargetType(type);
    if (type === "all") {
      setSmsData({ ...smsData, recipients: "All Members", targetMemberId: "", customPhones: "" });
    } else if (type === "defaulting") {
      setSmsData({ ...smsData, recipients: "Defaulting Members", targetMemberId: "", customPhones: "" });
    } else if (type === "union") {
      setSmsData({ ...smsData, recipients: `${selectedUnion} Members`, targetMemberId: "", customPhones: "" });
    } else if (type === "single") {
      const firstMember = members[0];
      setSmsData({ 
        ...smsData, 
        recipients: firstMember ? `Single Member: ${firstMember.name}` : "Single Member", 
        targetMemberId: firstMember ? firstMember.id : "",
        customPhones: "" 
      });
    } else if (type === "custom") {
      setSmsData({ ...smsData, recipients: "Custom Phone Number(s)", targetMemberId: "", customPhones: "" });
    }
  };

  const handleUnionChange = (u) => {
    setSelectedUnion(u);
    setSmsData({ ...smsData, recipients: `${u} Members` });
  };

  const handleSingleMemberChange = (memberId) => {
    const m = members.find(mem => mem.id === memberId);
    setSmsData({
      ...smsData,
      targetMemberId: memberId,
      recipients: m ? `Single Member: ${m.name}` : "Single Member"
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>SMS Dispatch & Broadcast Gateway</h2>
          <p>Send instant SMS messages to individual members, custom phone numbers, or target groups via SailUp API</p>
        </div>
      </div>

      <div className="two-col">
        {/* Compose Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Compose SMS Message</div>
          </div>
          <form onSubmit={handleSendSMS} className="card-body space-y-4">
            
            {/* Target Category Selector */}
            <div className="form-field">
              <label>Target Audience Category</label>
              <select 
                value={targetType}
                onChange={(e) => handleTargetTypeChange(e.target.value)}
                disabled={userRole === "auditor" || isSubmittingSMS}
              >
                <option value="all">📢 All Registered Members ({totalCount})</option>
                <option value="single">👤 Single Specific Member</option>
                <option value="union">🏛️ Specific Union Group (TUTAG, TUSAG...)</option>
                <option value="defaulting">⚠️ Defaulting Members Only ({defaultingCount})</option>
                <option value="custom">📱 Custom Phone Number(s)</option>
              </select>
            </div>

            {/* Dynamic Sub-field based on Target Selection */}
            {targetType === "single" && (
              <div className="form-field" style={{ background: "var(--cream)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--navy)", textTransform: "uppercase" }}>Select Member Recipient</label>
                <select
                  value={smsData.targetMemberId || (members[0]?.id || "")}
                  onChange={(e) => handleSingleMemberChange(e.target.value)}
                  disabled={userRole === "auditor" || isSubmittingSMS}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id}) — {m.phone || "No Phone"} ({m.union || m.union_name || 'Staff'})
                    </option>
                  ))}
                </select>
                {smsData.targetMemberId && (
                  <div style={{ fontSize: "12px", color: "var(--green)", marginTop: "6px", fontWeight: "600" }}>
                    ✓ Registered Phone: {members.find(m => m.id === smsData.targetMemberId)?.phone || "No phone on file"}
                  </div>
                )}
              </div>
            )}

            {targetType === "union" && (
              <div className="form-field" style={{ background: "var(--cream)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--navy)", textTransform: "uppercase" }}>Select Staff Union</label>
                <select
                  value={selectedUnion}
                  onChange={(e) => handleUnionChange(e.target.value)}
                  disabled={userRole === "auditor" || isSubmittingSMS}
                >
                  <option value="TUTAG">TUTAG Members ({tutagCount})</option>
                  <option value="TUSAG">TUSAG Members ({tusagCount})</option>
                  <option value="TEWU">TEWU Members ({tewuCount})</option>
                  <option value="GAUA">GAUA Members ({gauaCount})</option>
                </select>
              </div>
            )}

            {targetType === "custom" && (
              <div className="form-field" style={{ background: "var(--cream)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--navy)", textTransform: "uppercase" }}>Enter Phone Number(s)</label>
                <input
                  type="text"
                  placeholder="e.g. 0241234567 or 0201112222, 0553334444"
                  value={smsData.customPhones || ""}
                  onChange={(e) => setSmsData({ ...smsData, customPhones: e.target.value, recipients: `Custom: ${e.target.value}` })}
                  disabled={userRole === "auditor" || isSubmittingSMS}
                  required={targetType === "custom"}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-3)", display: "block", marginTop: "4px" }}>
                  Separate multiple phone numbers with commas. Ghanaian local numbers (02X, 05X, 03X) are automatically formatted.
                </span>
              </div>
            )}

            <div className="form-field">
              <label>Message Category / Title</label>
              <select 
                value={smsData.type} 
                onChange={(e) => setSmsData({ ...smsData, type: e.target.value })} 
                disabled={userRole === "auditor" || isSubmittingSMS}
              >
                <option value="Contribution Reminder">Contribution Reminder</option>
                <option value="General Announcement">General Announcement</option>
                <option value="Defaulters Alert">Defaulters Alert</option>
                <option value="Claim Status Update">Claim Status Update</option>
                <option value="Direct Notification">Direct Individual Message</option>
              </select>
            </div>

            <div className="form-field">
              <label>SMS Message Content</label>
              <textarea 
                rows="4" 
                required 
                placeholder="Type SMS content here..." 
                value={smsData.message}
                onChange={(e) => setSmsData({ ...smsData, message: e.target.value })} 
                disabled={userRole === "auditor" || isSubmittingSMS} 
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--text-3)", marginTop: "4px" }}>
                <span>Characters: {smsData.message ? smsData.message.length : 0}</span>
                <span>Est. SMS Parts: {Math.ceil((smsData.message ? smsData.message.length : 0) / 160) || 1}</span>
              </div>
            </div>

            {userRole !== "auditor" && (
              <button 
                type="submit" 
                className="btn btn-primary w-full justify-center"
                disabled={isSubmittingSMS}
                style={{ marginTop: "8px" }}
              >
                {isSubmittingSMS ? "Dispatching via SailUp API..." : "Send SMS Message"}
              </button>
            )}
          </form>
        </div>

        {/* Broadcast History Card */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="card-title">Broadcast History & Audit Log</div>
            <span className="badge badge-blue">
              {smsHistory.length} Logged
            </span>
          </div>

          <div className="card-body" style={{ padding: "0" }}>
            {smsHistory.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-3)", fontSize: "13px" }}>No SMS messages sent yet.</div>
            ) : (
              smsHistory.map((s, idx) => (
                <div 
                  key={s.id || idx} 
                  className="activity-item"
                  style={{
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    background: selectedHistory?.id === s.id ? "var(--cream)" : "transparent"
                  }}
                  onClick={() => setSelectedHistory(selectedHistory?.id === s.id ? null : s)}
                >
                  <div className="activity-icon" style={{
                    backgroundColor: s.status === "failed" ? "var(--red-pale)" : "var(--green-pale)",
                    color: s.status === "failed" ? "var(--red)" : "var(--green)"
                  }}>
                    {s.status === "failed" ? <Info className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </div>

                  <div className="activity-body text-left" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="activity-title" style={{ fontWeight: "600", color: "var(--navy-deep)" }}>{s.title}</div>
                      <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{s.date || s.date_str}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{s.recipients}</span>
                      <span className={`badge ${s.status === "failed" ? "badge-red" : "badge-green"}`}>
                        {s.status === "failed" ? "Failed / Pending" : "Sent / Delivered"}
                      </span>
                    </div>

                    {selectedHistory?.id === s.id && (
                      <div style={{
                        marginTop: "10px",
                        padding: "12px",
                        background: "var(--white)",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        fontSize: "12px",
                        color: "var(--text)"
                      }}>
                        <div style={{ fontWeight: "600", color: "var(--navy)", marginBottom: "4px" }}>Dispatch Audit Record:</div>
                        <div><strong>Target:</strong> {s.recipients}</div>
                        <div><strong>Timestamp:</strong> {s.date || s.date_str}</div>
                        {s.message && <div style={{ marginTop: "4px" }}><strong>Message Body:</strong> "{s.message}"</div>}
                        <div style={{ color: s.status === "failed" ? "var(--red)" : "var(--green)", fontWeight: "500", marginTop: "6px" }}>
                          {s.status === "failed" ? "⚠ Dispatch failed or pending provider approval." : "✓ Dispatched via SailUp Gateway"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Audit Trail Log ---
export function AuditLog({ auditLogs, searchQuery = "" }) {
  const filteredLogs = auditLogs.filter(l => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (l.user || "").toLowerCase().includes(q) || (l.action || "").toLowerCase().includes(q) || (l.details || "").toLowerCase().includes(q) || (l.ip || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Audit Trail log</h2>
          <p>Full system activity log for accountability</p>
        </div>
        <button className="btn btn-outline" onClick={() => {
          const headers = ["Timestamp", "User", "Action", "Details", "IP Address"];
          const rows = filteredLogs.map(l => [l.timestamp, l.user, l.action, l.details, l.ip]);
          const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(",")).join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `HTU_Audit_Log_${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }}>Export Log</button>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">System Activity Log</div></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th><th>User</th><th>Action</th><th>Details</th><th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr key={idx}>
                <td style={{ fontSize: "12px", color: "var(--text-3)" }}>{log.timestamp}</td>
                <td className="font-semibold">{log.user}</td>
                <td>
                  <span className={`badge ${log.action === "Payment" || log.action === "Register" ? "badge-green" : log.action === "Claim" ? "badge-blue" : "badge-gold"}`}>
                    {log.action}
                  </span>
                </td>
                <td>{log.details}</td>
                <td style={{ fontSize: "12px", color: "var(--text-3)" }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Reports Panel ---
export function ReportsPanel({ userRole, reportsList, setShowReportModal, handleGenerateReport }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Financial Reports</h2>
          <p>View and generate financial performance reports for the HTU Welfare Scheme.</p>
        </div>
        {userRole === "admin" && (
          <button className="btn btn-primary" onClick={() => setShowReportModal(true)}>Generate Report</button>
        )}
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Available Reports</div></div>
        <div className="card-body" style={{ padding: "0" }}>
          <table className="data-table">
            <thead>
              <tr><th>Report Name</th><th>Period</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {reportsList.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "500" }}>{r.name}</td>
                  <td>{r.period}</td>
                  <td>{r.date}</td>
                  <td>
                    <span className={`badge ${r.status === "Available" ? "badge-green" : "badge-gold"}`}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === "Available" ? (
                      <button className="btn btn-outline btn-sm" onClick={() => {
                        const printWin = window.open("", "_blank");
                        printWin.document.write(`<!DOCTYPE html><html><head><title>${r.name} - ${r.period}</title><style>body{font-family:system-ui,sans-serif;padding:40px;color:#1c2333}h1{font-size:20px;color:#0d1e4c}h2{font-size:14px;color:#5a6377;font-weight:normal;margin-bottom:24px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #e2e8f0}th{background:#f4f6fa;font-weight:600;color:#0d1e4c}.footer{margin-top:32px;font-size:11px;color:#9aa0ae;border-top:1px solid #e2e8f0;padding-top:16px}@media print{body{padding:20px}}</style></head><body>`);
                        printWin.document.write(`<h1>HTU Staff Welfare Scheme</h1><h2>${r.name} &mdash; ${r.period} &bull; Generated: ${r.date}</h2>`);
                        printWin.document.write(`<table><thead><tr><th>Report</th><th>Period</th><th>Date Generated</th><th>Status</th></tr></thead><tbody>`);
                        printWin.document.write(`<tr><td>${r.name}</td><td>${r.period}</td><td>${r.date}</td><td>${r.status}</td></tr>`);
                        printWin.document.write(`</tbody></table>`);
                        printWin.document.write(`<div class="footer">HTU Staff Welfare Scheme &copy; 2026. This is a system-generated document.</div>`);
                        printWin.document.write(`</body></html>`);
                        printWin.document.close();
                        setTimeout(() => printWin.print(), 300);
                      }}>Download PDF</button>
                    ) : (
                      userRole === "admin" && (
                        <button className="btn btn-primary font-bold btn-sm" onClick={() => handleGenerateReport(r.name, r.period)}>Generate</button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Settings Panel ---
export function SettingsPanel({ userRole, userProfile, schemeConfig, setSchemeConfig, members, showToastMsg }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState("");
  const [pwErrorMsg, setPwErrorMsg] = useState("");

  const handleSaveConfig = async () => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveSettings",
          payload: {
            monthlyContribution: schemeConfig.monthlyContribution,
            eligibilityThreshold: schemeConfig.eligibilityThreshold,
            smsGateway: schemeConfig.smsGateway,
            financialYear: schemeConfig.financialYear
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToastMsg("Scheme configuration settings saved!");
      } else {
        showToastMsg(data.error || "Failed to save configuration settings.", "error");
      }
    } catch (err) {
      console.error(err);
      showToastMsg("An error occurred while saving configuration.", "error");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwSuccessMsg("");
    setPwErrorMsg("");
    if (newPassword !== confirmPassword) {
      setPwErrorMsg("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwErrorMsg("New password must be at least 6 characters.");
      return;
    }
    setIsUpdatingPw(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          payload: {
            email: userProfile.email,
            currentPassword,
            newPassword
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPwErrorMsg(data.error || "Failed to update password.");
      } else {
        setPwSuccessMsg("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPwErrorMsg("Network error. Please try again.");
    } finally {
      setIsUpdatingPw(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h2>{userRole === "staff" ? "My Profile Settings" : "System Settings"}</h2>
          <p>{userRole === "staff" ? "View and manage your personal HTU membership details." : "Configure scheme parameters and system roles access."}</p>
        </div>
      </div>

      {userRole === "staff" ? (
        <div className="card max-w-2xl mx-auto">
          <div className="card-header"><div className="card-title font-semibold text-navy">Member Profile Registry Details</div></div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label>Full Name</label>
                <input type="text" defaultValue={userProfile.name} disabled className="bg-cream/40 cursor-not-allowed font-medium" />
              </div>
              <div className="form-field">
                <label>Staff registry ID</label>
                <input type="text" defaultValue={userProfile.id} disabled className="bg-cream/40 cursor-not-allowed font-semibold" />
              </div>
            </div>
            <div className="form-field">
              <label>Work Email Address</label>
              <input type="email" defaultValue={userProfile.email} disabled className="bg-cream/40 cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label>Academic Department</label>
                <input type="text" defaultValue={userProfile.department} disabled className="bg-cream/40 cursor-not-allowed" />
              </div>
              <div className="form-field">
                <label>Monthly Dues tier</label>
                <input type="text" defaultValue={`GH₵ ${schemeConfig.monthlyContribution}.00 / Month`} disabled className="bg-cream/40 cursor-not-allowed" />
              </div>
            </div>
            <div className="form-field">
              <label>Date of Scheme Enrollment</label>
              <input type="text" defaultValue={userProfile.enrolledDate} disabled className="bg-cream/40 cursor-not-allowed font-semibold text-text-3" />
            </div>
            <div className="border-t border-border pt-6 flex justify-between items-center text-xs text-text-3 font-semibold">
              <span className="flex items-center gap-1 text-green">
                <ShieldCheck className="w-4 h-4 text-green" /> Verification Status: Verified Active
              </span>
              <button onClick={() => showToastMsg("Verification request sent to Welfare Secretariat.")} className="btn btn-outline btn-sm">Request Update</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="two-col">
          <div className="card">
            <div className="card-header"><div className="card-title">Scheme Configuration</div></div>
            <div className="card-body space-y-4">
              <div className="form-field">
                <label>Monthly Contribution (GH₵)</label>
                <input type="number" value={schemeConfig.monthlyContribution}
                  onChange={(e) => setSchemeConfig({ ...schemeConfig, monthlyContribution: parseFloat(e.target.value) })}
                  disabled={userRole === "auditor"} />
              </div>
              <div className="form-field">
                <label>Eligibility Threshold (months)</label>
                <input type="number" value={schemeConfig.eligibilityThreshold}
                  onChange={(e) => setSchemeConfig({ ...schemeConfig, eligibilityThreshold: parseInt(e.target.value) })}
                  disabled={userRole === "auditor"} />
              </div>
              <div className="form-field">
                <label>SMS Gateway Provider</label>
                <select value={schemeConfig.smsGateway}
                  onChange={(e) => setSchemeConfig({ ...schemeConfig, smsGateway: e.target.value })}
                  disabled={userRole === "auditor"}>
                  <option>Hubtel</option><option>mNotify</option><option>Africa&apos;s Talking</option>
                </select>
              </div>
              <div className="form-field">
                <label>Scheme Financial Year</label>
                <select value={schemeConfig.financialYear}
                  onChange={(e) => setSchemeConfig({ ...schemeConfig, financialYear: e.target.value })}
                  disabled={userRole === "auditor"}>
                  <option>January – December</option>
                </select>
              </div>
               {userRole === "admin" && (
                <button className="btn btn-primary" onClick={handleSaveConfig}>Save Configuration</button>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">User Roles &amp; Access Registry</div></div>
            <div className="card-body" style={{ padding: "0" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Access Class Role</th><th>Enrolled accounts</th><th>Gateway Status</th></tr>
                </thead>
                <tbody>
                  {[
                    { role: "Scheme Manager (Admin)", count: members.filter(m => m.role === "admin").length },
                    { role: "System Auditors", count: members.filter(m => m.role === "auditor").length },
                    { role: "Staff Members", count: members.filter(m => m.role === "staff").length },
                  ].map((r, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: "500" }}>{r.role}</td>
                      <td>{r.count}</td>
                      <td><span className="badge badge-green">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD CARD FOR ALL USERS */}
      <div className="card max-w-2xl mx-auto">
        <div className="card-header"><div className="card-title font-semibold text-navy">Update System Password</div></div>
        <form onSubmit={handlePasswordChange} className="card-body space-y-4">
          {pwSuccessMsg && (
            <div className="bg-green-50 text-green-700 text-xs font-semibold p-2.5 rounded-lg border border-green-200">
              {pwSuccessMsg}
            </div>
          )}
          {pwErrorMsg && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold p-2.5 rounded-lg border border-red-200">
              {pwErrorMsg}
            </div>
          )}
          <div className="form-field">
            <label>Current Password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>New Password</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-field">
              <label>Confirm New Password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isUpdatingPw}>
            {isUpdatingPw ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
