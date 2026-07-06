"use client";

import { CreditCard } from "lucide-react";

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
  onSubmitStaff
}) {
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
            <div>
              <h4 className="font-semibold text-lg">Pay GH₵ {schemeConfig.monthlyContribution}.00</h4>
              <p className="text-xs text-text-3 mt-1">Paying welfare dues for the upcoming month (July 2026) to preserve active membership.</p>
            </div>

            <div className="bg-cream p-4 rounded-xl text-left text-xs font-semibold space-y-2 border border-border/30">
              <div className="flex justify-between">
                <span className="text-text-3">Staff Member:</span>
                <span>{userProfile.name}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2">
                <span className="text-text-3">Welfare ID:</span>
                <span>{userProfile.id}</span>
              </div>
            </div>

            <button 
              onClick={onSubmitStaff}
              className="w-full btn btn-primary py-3 flex justify-center gap-2"
            >
              Authorize MoMo Payment
            </button>
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
                  <option>June 2026</option>
                  <option>May 2026</option>
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
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">New Benefit Claim Request</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
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
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">File Claim</button>
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
