"use client";

import { useState, useEffect, useRef } from "react";
import { CreditCard, Sparkles, Plus, AlertCircle, FileText, CheckCircle, Upload, X, Paperclip } from "lucide-react";
import { uploadClaimFile } from "@/lib/supabase/storage";

function useFocusTrap(ref, show) {
  useEffect(() => {
    if (!show || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      setTimeout(() => firstElement.focus(), 50);
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, ref]);
}

// --- MODAL 1: REGISTER MEMBER ---
export function RegisterMemberModal({
  show,
  onClose,
  newMember,
  setNewMember,
  onSubmit,
  isSubmitting = false
}) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, show);

  const [regTab, setRegTab] = useState("single");
  const [csvRows, setCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const fileInputRef = useRef(null);

  const resetCsvState = () => {
    setCsvRows([]);
    setCsvFileName("");
    setCsvError("");
    setBulkResult(null);
  };

  const handleClose = () => {
    resetCsvState();
    setRegTab("single");
    onClose();
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      setCsvError("CSV must have a header row and at least one data row.");
      return [];
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

    const fieldMap = {};
    const mappings = {
      staffid: "staffId", staff_id: "staffId", id: "staffId",
      firstname: "firstName", first_name: "firstName", first: "firstName",
      lastname: "lastName", last_name: "lastName", last: "lastName", surname: "lastName",
      union: "union", union_name: "union", staffunion: "union",
      phone: "phone", phonenumber: "phone", phone_number: "phone", mobile: "phone",
      email: "email", emailaddress: "email", email_address: "email",
      department: "department", dept: "department", faculty: "department"
    };

    headers.forEach((h, idx) => {
      const key = h.replace(/[^a-z0-9]/g, "");
      if (mappings[key]) fieldMap[idx] = mappings[key];
      else if (mappings[h]) fieldMap[idx] = mappings[h];
    });

    const required = ["staffId", "firstName", "lastName"];
    const mappedFields = Object.values(fieldMap);
    const missing = required.filter(f => !mappedFields.includes(f));
    if (missing.length > 0) {
      setCsvError(`CSV is missing required columns: ${missing.join(", ")}. Expected: staffId, firstName, lastName, union, phone, email, department`);
      return [];
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = "";
      let inQuotes = false;
      for (const ch of lines[i]) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; }
        else { current += ch; }
      }
      values.push(current.trim());

      const row = {};
      Object.entries(fieldMap).forEach(([idx, field]) => {
        row[field] = (values[parseInt(idx)] || "").replace(/^["']|["']$/g, "");
      });

      if (row.staffId && row.firstName && row.lastName) {
        rows.push(row);
      }
    }
    return rows;
  };

  const handleFileUpload = (e) => {
    setCsvError("");
    setBulkResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setCsvError("Please upload a .csv file.");
      return;
    }

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rows = parseCSV(text);
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (csvRows.length === 0) return;
    setIsBulkSubmitting(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulkRegister",
          payload: { members: csvRows }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setCsvError(data.error || "Bulk registration failed.");
        return;
      }
      setBulkResult(data);
      if (data.registered > 0) {
        window.dispatchEvent(new CustomEvent("portalDataRefresh"));
      }
    } catch (err) {
      setCsvError("Network error during bulk registration.");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "staffId,firstName,lastName,union,phone,email,department\nHTU/0300,Ama,Boateng,TUTAG,0241234567,a.boateng@htu.edu.gh,Engineering\nHTU/0301,Kofi,Mensah,TEWU,0551234567,k.mensah@htu.edu.gh,Business School";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "htu_member_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="register-member-title" style={{ maxWidth: regTab === "csv" ? "720px" : undefined }}>
        <div className="modal-header">
          <h3 id="register-member-title" className="modal-title">Register Members</h3>
          <button className="modal-close" onClick={handleClose} aria-label="Close dialog">✕</button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)", margin: "0 20px" }}>
          <button
            type="button"
            onClick={() => { setRegTab("single"); resetCsvState(); }}
            style={{
              flex: 1, padding: "10px 16px", fontSize: "12px", fontWeight: 700,
              border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px",
              borderBottom: regTab === "single" ? "2px solid var(--gold)" : "2px solid transparent",
              color: regTab === "single" ? "var(--navy)" : "var(--text-3)",
              backgroundColor: "transparent"
            }}
          >
            <Plus className="w-3.5 h-3.5" style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Single Member
          </button>
          <button
            type="button"
            onClick={() => setRegTab("csv")}
            style={{
              flex: 1, padding: "10px 16px", fontSize: "12px", fontWeight: 700,
              border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px",
              borderBottom: regTab === "csv" ? "2px solid var(--gold)" : "2px solid transparent",
              color: regTab === "csv" ? "var(--navy)" : "var(--text-3)",
              backgroundColor: "transparent"
            }}
          >
            <Upload className="w-3.5 h-3.5" style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            CSV Bulk Upload
          </button>
        </div>

        {regTab === "single" ? (
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="reg-first-name">First Name</label>
                  <input id="reg-first-name" type="text" required placeholder="e.g. Kwame" value={newMember.firstName} onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })} />
                </div>
                <div className="form-field">
                  <label htmlFor="reg-last-name">Last Name</label>
                  <input id="reg-last-name" type="text" required placeholder="e.g. Asante" value={newMember.lastName} onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="reg-staff-id">Staff ID</label>
                  <input id="reg-staff-id" type="text" required placeholder="HTU/0001" value={newMember.staffId} onChange={(e) => setNewMember({ ...newMember, staffId: e.target.value })} />
                </div>
                <div className="form-field">
                  <label htmlFor="reg-union">Staff Union</label>
                  <select id="reg-union" value={newMember.union} onChange={(e) => setNewMember({ ...newMember, union: e.target.value })}>
                    <option>TUTAG</option>
                    <option>TUSAAG</option>
                    <option>TEWU</option>
                    <option>TUWAG</option>
                    <option>TUAAG</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="reg-phone">Phone Number</label>
                  <input id="reg-phone" type="text" required pattern="^0\d{9}$" title="Ghana phone number must start with 0 and contain exactly 10 digits (e.g. 024XXXXXXX)" placeholder="024 XXX XXXX" value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} />
                </div>
                <div className="form-field">
                  <label htmlFor="reg-email">Email Address</label>
                  <input id="reg-email" type="email" required pattern="[a-zA-Z0-9._%+-]+@htu\.edu\.gh" title="Please use your institutional Ho Technical University email address (e.g. name@htu.edu.gh)" placeholder="name@htu.edu.gh" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="reg-dept">Academic Faculty</label>
                  <select id="reg-dept" value={newMember.department} onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}>
                    <option value="Applied Sciences &amp; Technology">Applied Sciences &amp; Technology</option>
                    <option value="Art &amp; Design">Art &amp; Design</option>
                    <option value="Built &amp; Natural Environment">Built &amp; Natural Environment</option>
                    <option value="Business School">Business School</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="reg-employment-date">Date of Employment</label>
                  <input id="reg-employment-date" type="date" value={newMember.employmentDate} onChange={(e) => setNewMember({ ...newMember, employmentDate: e.target.value })} />
                </div>
              </div>

              <div style={{ padding: "12px", backgroundColor: "var(--cream)", borderRadius: "8px", marginTop: "4px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--navy)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Immediate Relatives (for benefits)</div>
                <div className="form-row" style={{ marginBottom: "0" }}>
                  <div className="form-field" style={{ marginBottom: "0" }}>
                    <label htmlFor="reg-spouse">Spouse Name</label>
                    <input id="reg-spouse" type="text" placeholder="Optional" value={newMember.spouseName} onChange={(e) => setNewMember({ ...newMember, spouseName: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: "0" }}>
                    <label htmlFor="reg-guardian">Nominated Guardian</label>
                    <input id="reg-guardian" type="text" placeholder="Optional" value={newMember.guardianName} onChange={(e) => setNewMember({ ...newMember, guardianName: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
                <input type="checkbox" required id="gdpr-consent" className="mt-0.5 cursor-pointer" />
                <label htmlFor="gdpr-consent" className="text-slate-500 font-semibold leading-relaxed cursor-pointer select-none">
                  I confirm that this member consents to the storage and processing of their institutional staff data under Ho Technical University's Welfare Scheme Privacy Policy and GDPR/Data Protection guidelines.
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register Member"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="modal-body" style={{ minHeight: "280px" }}>
              <div style={{ padding: "14px", backgroundColor: "var(--cream)", borderRadius: "10px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>CSV Format Requirements</div>
                <p style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                  Upload a <strong>.csv</strong> file with columns: <strong>staffId</strong>, <strong>firstName</strong>, <strong>lastName</strong>, union, phone, email, department.
                  All emails must end with <strong>@htu.edu.gh</strong>. Default password for all new members: <strong>htu2026</strong>
                </p>
                <button type="button" onClick={downloadTemplate} style={{ marginTop: "8px", fontSize: "11px", fontWeight: 700, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                  ↓ Download Template CSV
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--border)", borderRadius: "12px",
                  padding: "28px 20px", textAlign: "center", cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: csvFileName ? "rgba(201, 162, 39, 0.05)" : "var(--white)"
                }}
              >
                <Upload className="w-8 h-8 mx-auto" style={{ color: csvFileName ? "var(--gold)" : "var(--text-3)", marginBottom: "8px" }} />
                {csvFileName ? (
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)" }}>{csvFileName}</p>
                    <p style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>{csvRows.length} member(s) parsed</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--navy)" }}>Click to upload CSV file</p>
                    <p style={{ fontSize: "11px", color: "var(--text-3)", fontWeight: 500 }}>Supports .csv files up to 200 members</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
              </div>

              {csvError && (
                <div className="flex items-start gap-2 mt-3" style={{ padding: "10px 14px", backgroundColor: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px" }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--red)" }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--red)" }}>{csvError}</span>
                </div>
              )}

              {bulkResult && (
                <div style={{ marginTop: "12px", padding: "12px 14px", backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <CheckCircle className="w-4 h-4" style={{ color: "var(--green)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)" }}>{bulkResult.message}</span>
                  </div>
                  {bulkResult.errors && bulkResult.errors.length > 0 && (
                    <div style={{ marginTop: "8px", maxHeight: "100px", overflowY: "auto" }}>
                      {bulkResult.errors.map((err, i) => (
                        <p key={i} style={{ fontSize: "11px", color: "var(--red)", fontWeight: 500, margin: "2px 0" }}>• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {csvRows.length > 0 && !bulkResult && (
                <div style={{ marginTop: "14px", maxHeight: "200px", overflowY: "auto", borderRadius: "10px", border: "1px solid var(--border)" }}>
                  <table className="data-table" style={{ fontSize: "11px" }}>
                    <thead>
                      <tr>
                        <th>#</th><th>Staff ID</th><th>Name</th><th>Union</th><th>Email</th><th>Dept</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 50).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ color: "var(--text-3)" }}>{idx + 1}</td>
                          <td style={{ fontWeight: 700 }}>{row.staffId}</td>
                          <td>{row.firstName} {row.lastName}</td>
                          <td>{row.union || "TUTAG"}</td>
                          <td style={{ fontSize: "10px" }}>{row.email || `${row.staffId?.toLowerCase().replace("/", "")}@htu.edu.gh`}</td>
                          <td style={{ fontSize: "10px" }}>{row.department || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvRows.length > 50 && (
                    <p style={{ textAlign: "center", fontSize: "11px", color: "var(--text-3)", fontWeight: 600, padding: "8px" }}>
                      Showing first 50 of {csvRows.length} rows...
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isBulkSubmitting}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={csvRows.length === 0 || isBulkSubmitting || !!bulkResult}
                onClick={handleBulkSubmit}
              >
                {isBulkSubmitting ? "Importing..." : `Import ${csvRows.length} Member${csvRows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MODAL 2: CONTRIBUTE DUES ---
export function ContributeDuesModal({
  show,
  onClose,
  userRole,
  userProfile,
  schemeConfig,
  members,
  newPayment,
  setNewPayment,
  onSubmitAdmin,
  onSubmitStaff,
  personalContributions = [],
  isSubmitting = false
}) {
  const TRACKED_MONTHS_FULL = [
    { key: "jan", label: "January 2026" },
    { key: "feb", label: "February 2026" },
    { key: "mar", label: "March 2026" },
    { key: "apr", label: "April 2026" },
    { key: "may", label: "May 2026" },
    { key: "jun", label: "June 2026" },
    { key: "jul", label: "July 2026" },
    { key: "aug", label: "August 2026" },
    { key: "sep", label: "September 2026" },
    { key: "oct", label: "October 2026" },
    { key: "nov", label: "November 2026" },
    { key: "dec", label: "December 2026" }
  ];

  const threshold = schemeConfig.eligibilityThreshold || 6;
  const activeMonths = TRACKED_MONTHS_FULL.slice(0, Math.min(Math.max(threshold, 1), 12));

  const paidSet = new Set(
    (personalContributions || []).map(c => {
      const raw = (c.month || "").split(" ")[0].toLowerCase().slice(0, 3);
      return raw;
    })
  );

  const unpaidMonths = activeMonths.filter(m => !paidSet.has(m.key));

  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    if (unpaidMonths.length > 0) {
      setSelectedMonth(unpaidMonths[0].label);
    } else {
      setSelectedMonth("");
    }
  }, [show, personalContributions]);

  const modalRef = useRef(null);
  useFocusTrap(modalRef, show);

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal max-w-sm" role="dialog" aria-modal="true" aria-labelledby="dues-title">
        <div className="modal-header">
          <h3 id="dues-title" className="modal-title">{userRole === "staff" ? "Dues Payment Gateway" : "Record Dues Payment"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        {userRole === "staff" ? (
          <div className="modal-body text-center space-y-4">
            <div className="w-16 h-16 bg-navy-mid/10 text-navy-deep rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8" />
            </div>

            {unpaidMonths.length === 0 ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-12 h-12 bg-green-50 text-green rounded-full flex items-center justify-center mx-auto border border-green-200">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-navy text-base">Contributions Up to Date</h4>
                  <p className="text-xs text-text-3 px-4">All dues for the current year (Jan–Dec) are fully paid! You have no outstanding dues.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-[#e8f0fe] rounded-xl flex items-center gap-3 border border-blue-200/50">
                  <div className="p-2 rounded-lg bg-white shadow-sm text-blue-600"><CheckCircle className="w-4 h-4" /></div>
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-blue-500 uppercase block tracking-wider">Secure Payment Gateway</span>
                    <span className="text-xs font-semibold text-navy">HTU Welfare Association Fund</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg text-navy-deep">Pay GH₵ {schemeConfig.monthlyContribution}.00</h4>
                  <p className="text-xs text-text-3 mt-1">Authorize your secure monthly welfare dues contribution.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Next Dues Month</span>
                  <span className="text-sm font-extrabold text-navy-deep block">{selectedMonth}</span>
                  <span className="text-[10px] text-text-3 block mt-1">Dues are processed chronologically in order of billing.</span>
                </div>

                <div className="bg-cream p-4 rounded-xl text-left text-xs font-semibold space-y-2 border border-border/30">
                  <div className="flex justify-between">
                    <span className="text-text-3">Staff Member:</span>
                    <span className="text-navy">{userProfile.name}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-2">
                    <span className="text-text-3">Welfare ID:</span>
                    <span className="font-bold text-navy">{userProfile.id}</span>
                  </div>
                </div>

                <div className="text-center py-1">
                  <button 
                    onClick={() => onSubmitStaff(selectedMonth)}
                    className="w-full btn btn-primary py-3 flex justify-center items-center gap-2 text-white font-bold rounded-xl bg-navy-deep hover:bg-navy transition-all shadow-md"
                  >
                    Authorize Paystack Payment
                  </button>
                  
                  {/* PAYSTACK SECURE BADGES */}
                  <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-text-3 font-semibold">
                    <span className="flex items-center gap-1">
                      🔒 Secured by <strong>paystack</strong>
                    </span>
                  </div>
                  
                  {/* PAYMENT ICONS */}
                  <div className="flex justify-center gap-2 mt-2 opacity-50 select-none">
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border font-bold">MTN MoMo</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border font-bold">Telecel</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border font-bold">AT Money</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border font-bold">Cards</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmitAdmin}>
            <div className="modal-body space-y-4">
              <div className="form-field">
                <label htmlFor="dues-member">Select Member</label>
                <select
                  id="dues-member"
                  value={newPayment.memberId}
                  onChange={(e) => setNewPayment({ ...newPayment, memberId: e.target.value })}
                  required
                >
                  <option value="">Select Member...</option>
                  {members.map((m, idx) => (
                    <option key={idx} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="dues-month">Contribution Month</label>
                <select
                  id="dues-month"
                  value={newPayment.month}
                  onChange={(e) => setNewPayment({ ...newPayment, month: e.target.value })}
                >
                  {activeMonths.map((m, idx) => (
                    <option key={idx} value={m.label}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="dues-amount">Amount (GH₵)</label>
                <input
                  id="dues-amount"
                  type="number"
                  required
                  min="5"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="dues-method">Payment Method</label>
                <select
                  id="dues-method"
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                >
                  <option>Mobile Money</option>
                  <option>Bank Deposit</option>
                  <option>Cash Payment</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// --- MODAL 3: NEW BENEFIT CLAIM ---
export function FileBenefitClaimModal({
  show,
  onClose,
  userRole,
  members,
  newClaim,
  setNewClaim,
  onSubmit,
  isSubmitting = false
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Reset files when modal opens/closes
  useEffect(() => {
    if (!show) {
      setFiles([]);
      setUploadError("");
    }
  }, [show]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    const invalid = selected.filter(f => !allowed.includes(f.type));
    if (invalid.length > 0) {
      setUploadError("Only PDF, JPG, and PNG files are accepted.");
      return;
    }
    const oversize = selected.filter(f => f.size > 5 * 1024 * 1024);
    if (oversize.length > 0) {
      setUploadError("Each file must be under 5MB.");
      return;
    }
    setUploadError("");
    setFiles(prev => [...prev, ...selected].slice(0, 5)); // max 5 files
    e.target.value = "";
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newClaim.title || !newClaim.amount) return;

    setUploading(true);
    setUploadError("");

    try {
      // Generate a temp claim ID prefix for file paths (server will create real ID)
      const tempId = `TEMP-${Date.now()}`;
      const uploadedDocs = [];

      for (const file of files) {
        const { url, error } = await uploadClaimFile(tempId, file);
        if (error) {
          setUploadError(`Failed to upload ${file.name}: ${error}`);
          setUploading(false);
          return;
        }
        uploadedDocs.push({ fileName: file.name, fileUrl: url, fileType: file.type });
      }

      // Pass uploaded docs along with the claim submission
      await onSubmit(e, uploadedDocs);
      setFiles([]);
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const modalRef = useRef(null);
  useFocusTrap(modalRef, show);

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="claim-title">
        <div className="modal-header">
          <h3 id="claim-title" className="modal-title">New Benefit Claim Request</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {userRole !== "staff" && (
              <div className="form-field">
                <label htmlFor="claim-member">Filing Member</label>
                <select
                  id="claim-member"
                  value={newClaim.memberId}
                  onChange={(e) => setNewClaim({ ...newClaim, memberId: e.target.value })}
                  required
                >
                  <option value="">Select Member...</option>
                  {members.map((m, idx) => (
                    <option key={idx} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="claim-type">Benefit Type</label>
              <select
                id="claim-type"
                value={newClaim.type}
                onChange={(e) => setNewClaim({ ...newClaim, type: e.target.value })}
              >
                <option>Critical Illness</option>
                <option>Death of Member</option>
                <option>Death of Spouse</option>
                <option>Death of Parent</option>
                <option>Death of Child</option>
                <option>Incapacitation</option>
                <option>Retirement</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="claim-amount">Claim Amount (GH₵)</label>
              <input
                id="claim-amount"
                type="number"
                required
                min="10"
                placeholder="e.g. 3000"
                value={newClaim.amount}
                onChange={(e) => setNewClaim({ ...newClaim, amount: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label htmlFor="claim-description">Claim Event Title / Description</label>
              <textarea
                id="claim-description"
                rows="3"
                required
                placeholder="Provide brief details about the welfare claim..."
                value={newClaim.title}
                onChange={(e) => setNewClaim({ ...newClaim, title: e.target.value })}
              />
            </div>

            {/* ── Document Upload ── */}
            <div className="form-field">
              <label className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                Supporting Documents
                <span className="text-text-3 font-normal normal-case tracking-normal" style={{ fontSize: "10px" }}>
                  (PDF, JPG, PNG — max 5MB each, up to 5 files)
                </span>
              </label>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-navy transition-colors"
                style={{ background: "var(--cream)" }}
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">
                  Click to upload or drag files here
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Medical reports, death certificates, doctor letters, etc.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-navy shrink-0" />
                      <span className="text-xs font-semibold text-navy flex-1 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-red transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 mt-2 text-red text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {uploadError}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={uploading || isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading || isSubmitting}>
              {uploading ? "Uploading Docs..." : isSubmitting ? "Submitting Claim..." : "File Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- MODAL 4: REQUEST EMERGENCY LOAN ---
export function RequestEmergencyLoanModal({
  show,
  onClose,
  newLoan,
  setNewLoan,
  onSubmit,
  isSubmitting = false,
  loans = [],
  userProfile = null
}) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, show);

  const parsedAmount = parseFloat(newLoan.amount) || 0;
  const isExceeded = parsedAmount > 1500;
  const hasActiveLoan = loans && userProfile && loans.some(
    l => l.applicant === userProfile.name && (l.status === "Pending" || l.status === "Active")
  );

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="loan-title">
        <div className="modal-header">
          <h3 id="loan-title" className="modal-title">Request Emergency Loan</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body space-y-4">
            {hasActiveLoan && (
              <div className="flex items-start gap-2 bg-red-pale border border-red/20 p-3 rounded-lg text-xs text-red font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Active Loan Warning</p>
                  <p className="font-normal mt-0.5">You currently have an active or pending emergency loan. Scheme policies restrict members to a single active loan account.</p>
                </div>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="loan-amount">Loan Amount Request (GH₵)</label>
              <input
                id="loan-amount"
                type="number"
                required
                min="50"
                max="1500"
                placeholder="e.g. 1000 (Max GH₵1,500)"
                value={newLoan.amount}
                onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })}
                disabled={hasActiveLoan}
              />
              {isExceeded && (
                <div className="flex items-center gap-1.5 mt-1.5 text-red text-[11px] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Amount exceeds the maximum limit of GH₵1,500.</span>
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loan-term">Repayment Term Limit</label>
              <select
                id="loan-term"
                value={newLoan.term}
                onChange={(e) => setNewLoan({ ...newLoan, term: e.target.value })}
                disabled={hasActiveLoan}
              >
                <option value="2 months">2 Months Plan</option>
                <option value="3 months">3 Months Plan</option>
                <option value="4 months">4 Months Plan</option>
                <option value="6 months">6 Months Plan</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="loan-reason">Urgent Reason for Loan</label>
              <textarea
                id="loan-reason"
                rows="3"
                required
                placeholder="Briefly describe the emergency need..."
                value={newLoan.reason}
                onChange={(e) => setNewLoan({ ...newLoan, reason: e.target.value })}
                disabled={hasActiveLoan}
              />
            </div>

            <p className="text-[10px] text-text-3 font-semibold leading-relaxed">
              *Notice: Dues will be deducted directly from your salary source under scheme rules. Zero-interest fee applies.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-gold" disabled={isSubmitting || hasActiveLoan || isExceeded}>
              {isSubmitting ? "Requesting..." : "Request Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- MODAL 5: GENERATE REPORT ---
export function GenerateReportModal({
  show,
  onClose,
  onSubmit
}) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal max-w-sm">
        <div className="modal-header">
          <h3 className="modal-title">Generate Report</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body space-y-4">
          <div className="form-field">
            <label>Report Type</label>
            <select id="rep-name">
              <option value="Quarterly Financial Statement">Quarterly Financial Statement</option>
              <option value="Semi-Annual Report">Semi-Annual Report</option>
              <option value="Annual Audited Report">Annual Audited Report</option>
            </select>
          </div>
          <div className="form-field">
            <label>Reporting Period</label>
            <select id="rep-period">
              <option value="Q2 2026 (Apr–Jun)">Q2 2026 (Apr–Jun)</option>
              <option value="Q3 2026 (Jul–Sep)">Q3 2026 (Jul–Sep)</option>
              <option value="Jan–Jun 2026">Jan–Jun 2026</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const name = document.getElementById("rep-name").value;
              const period = document.getElementById("rep-period").value;
              onSubmit(name, period);
            }}
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
