"use client";

import { useState, useEffect, useRef } from "react";
import { CreditCard, Sparkles, Plus, AlertCircle, FileText, CheckCircle, Upload, X, Paperclip } from "lucide-react";
import { uploadClaimFile } from "@/lib/supabase/storage";

// --- MODAL 1: REGISTER MEMBER ---
export function RegisterMemberModal({
  show,
  onClose,
  newMember,
  setNewMember,
  onSubmit
}) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Register New Member</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-field">
                <label>First Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asante"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Staff ID</label>
                <input
                  type="text"
                  required
                  placeholder="HTU/0001"
                  value={newMember.staffId}
                  onChange={(e) => setNewMember({ ...newMember, staffId: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Staff Union</label>
                <select
                  value={newMember.union}
                  onChange={(e) => setNewMember({ ...newMember, union: e.target.value })}
                >
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
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="024 XXX XXXX"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@htu.edu.gh"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Academic Faculty</label>
                <select
                  value={newMember.department}
                  onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                >
                  <option value="Applied Sciences & Technology">Applied Sciences & Technology</option>
                  <option value="Art & Design">Art & Design</option>
                  <option value="Built & Natural Environment">Built & Natural Environment</option>
                  <option value="Business School">Business School</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
              <div className="form-field">
                <label>Date of Employment</label>
                <input
                  type="date"
                  value={newMember.employmentDate}
                  onChange={(e) => setNewMember({ ...newMember, employmentDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "var(--cream)", borderRadius: "8px", marginTop: "4px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--navy)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Immediate Relatives (for benefits)</div>
              <div className="form-row" style={{ marginBottom: "0" }}>
                <div className="form-field" style={{ marginBottom: "0" }}>
                  <label>Spouse Name</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={newMember.spouseName}
                    onChange={(e) => setNewMember({ ...newMember, spouseName: e.target.value })}
                  />
                </div>
                <div className="form-field" style={{ marginBottom: "0" }}>
                  <label>Nominated Guardian</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={newMember.guardianName}
                    onChange={(e) => setNewMember({ ...newMember, guardianName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
              <input
                type="checkbox"
                required
                id="gdpr-consent"
                className="mt-0.5 cursor-pointer"
              />
              <label htmlFor="gdpr-consent" className="text-slate-500 font-semibold leading-relaxed cursor-pointer select-none">
                I confirm that this member consents to the storage and processing of their institutional staff data under Ho Technical University's Welfare Scheme Privacy Policy and GDPR/Data Protection guidelines.
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Member</button>
          </div>
        </form>
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
  personalContributions = []
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

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal max-w-sm">
        <div className="modal-header">
          <h3 className="modal-title">{userRole === "staff" ? "Dues Payment Gateway" : "Record Dues Payment"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
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
                <label>Select Member</label>
                <select
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
                <label>Contribution Month</label>
                <select
                  value={newPayment.month}
                  onChange={(e) => setNewPayment({ ...newPayment, month: e.target.value })}
                >
                  {activeMonths.map((m, idx) => (
                    <option key={idx} value={m.label}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Amount (GH₵)</label>
                <input
                  type="number"
                  required
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Payment Method</label>
                <select
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
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Record Payment</button>
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
  onSubmit
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

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">New Benefit Claim Request</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {userRole !== "staff" && (
              <div className="form-field">
                <label>Filing Member</label>
                <select
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
              <label>Benefit Type</label>
              <select
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
              <label>Claim Amount (GH₵)</label>
              <input
                type="number"
                required
                placeholder="e.g. 3000"
                value={newClaim.amount}
                onChange={(e) => setNewClaim({ ...newClaim, amount: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Claim Event Title / Description</label>
              <textarea
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
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={uploading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? "Uploading..." : "File Claim"}
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
  onSubmit
}) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Request Emergency Loan</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body space-y-4">
            <div className="form-field">
              <label>Loan Amount Request (GH₵)</label>
              <input
                type="number"
                required
                placeholder="e.g. 1000 (Max GH₵1,500)"
                value={newLoan.amount}
                onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Repayment Term Limit</label>
              <select
                value={newLoan.term}
                onChange={(e) => setNewLoan({ ...newLoan, term: e.target.value })}
              >
                <option value="2 months">2 Months Plan</option>
                <option value="3 months">3 Months Plan</option>
                <option value="4 months">4 Months Plan</option>
                <option value="6 months">6 Months Plan</option>
              </select>
            </div>

            <div className="form-field">
              <label>Urgent Reason for Loan</label>
              <textarea
                rows="3"
                required
                placeholder="Briefly describe the emergency need..."
                value={newLoan.reason}
                onChange={(e) => setNewLoan({ ...newLoan, reason: e.target.value })}
              />
            </div>

            <p className="text-[10px] text-text-3 font-semibold leading-relaxed">
              *Notice: Dues will be deducted directly from your salary source under scheme rules. Zero-interest fee applies.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold">Request Loan</button>
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
