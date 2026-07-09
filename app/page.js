"use client";

import { useState, useEffect } from "react";
import { Sparkles, Heart } from "lucide-react";

// Import modular components
import LoginView from "@/components/LoginView";
import LandingPage from "@/components/LandingPage";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StaffOverview from "@/components/StaffOverview";
import AdminDashboard from "@/components/AdminDashboard";
import MemberRegistry from "@/components/MemberRegistry";
import ContributionsLedger from "@/components/ContributionsLedger";
import ClaimsTracker from "@/components/ClaimsTracker";
import LoansTracker from "@/components/LoansTracker";
import { SMSPanel, AuditLog, ReportsPanel, SettingsPanel } from "@/components/SystemPanels";
import ForcePasswordReset from "@/components/ForcePasswordReset";
import {
  RegisterMemberModal,
  ContributeDuesModal,
  FileBenefitClaimModal,
  RequestEmergencyLoanModal,
  GenerateReportModal
} from "@/components/Modals";

export default function WelfarePortal() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState("landing"); // landing, login, dashboard
  const [userRole, setUserRole] = useState("admin"); // staff, admin, auditor
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, overview, members, contributions, claims, reports, sms, audit, settings
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dropdown states
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Modals state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  // Real-Time Toast Alerts
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Force password reset state (staff first-time login)
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [pendingLoginEmail, setPendingLoginEmail] = useState("");
  const [pendingLoginPassword, setPendingLoginPassword] = useState("");

  const showToastMsg = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // Form registration state
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    staffId: "",
    union: "TUTAG",
    phone: "",
    email: "",
    department: "Applied Sciences & Technology",
    employmentDate: "",
    spouseName: "",
    guardianName: ""
  });

  // Record payment state
  const [newPayment, setNewPayment] = useState({
    memberId: "",
    month: "June 2026",
    amount: "25",
    method: "Mobile Money"
  });

  // SMS composer state
  const [smsData, setSmsData] = useState({
    recipients: "All Members (248)",
    type: "Contribution Reminder",
    message: ""
  });

  // New claim form input
  const [newClaim, setNewClaim] = useState({
    memberId: "",
    type: "Critical Illness",
    title: "",
    amount: "",
    description: ""
  });

  // New loan form input
  const [newLoan, setNewLoan] = useState({
    amount: "",
    term: "3 months",
    reason: ""
  });

  // Global Mock Database States (Synced in Real-time)
  const [fundStats, setFundStats] = useState({
    totalFund: 43750,
    totalDisbursed: 38000,
    juneCollections: 6200,
    activeLoans: 18400
  });

  // Scheme settings
  const [schemeConfig, setSchemeConfig] = useState({
    monthlyContribution: 25,
    eligibilityThreshold: 6,
    smsGateway: "Hubtel",
    financialYear: "January – December"
  });

  // User Profile
  const [userProfile, setUserProfile] = useState({
    name: "Scheme Manager",
    id: "HTU/ADM-001",
    email: "manager@htu.edu.gh",
    role: "Administrator",
    avatarInitials: "SM",
    roleLabel: "Scheme Manager",
    department: "Administration Secretariat",
    enrolledDate: "January 15, 2018"
  });

  // Database State Bindings
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [personalContributions, setPersonalContributions] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loans, setLoans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [smsHistory, setSmsHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reportsList, setReportsList] = useState([]);

  // Fetch all state tables on mount and restore session if valid
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch("/api/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkSession" })
        });
        const data = await res.json();
        if (res.ok && data.authenticated) {
          const { user } = data;
          if (user.role === "admin") {
            setUserRole("admin");
            setUserProfile({
              name: user.name,
              id: user.id,
              email: user.email,
              role: "Administrator",
              avatarInitials: user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
              roleLabel: "Scheme Manager",
              department: user.dept || "Administration Secretariat",
              enrolledDate: "January 15, 2018"
            });
            setActiveTab("dashboard");
            setCurrentView("dashboard");
          } else if (user.role === "auditor") {
            setUserRole("auditor");
            setUserProfile({
              name: user.name,
              id: user.id,
              email: user.email,
              role: "Audit Executive",
              avatarInitials: user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
              roleLabel: "System Auditor",
              department: user.dept || "Internal Audit Directorate",
              enrolledDate: "November 01, 2021"
            });
            setActiveTab("dashboard");
            setCurrentView("dashboard");
          } else {
            setUserRole("staff");
            setUserProfile({
              name: user.name,
              id: user.id,
              email: user.email,
              role: "TUTAG Member",
              avatarInitials: user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
              roleLabel: "Staff Member",
              department: user.dept || "Computer Science Department",
              enrolledDate: "October 12, 2019"
            });
            setActiveTab("overview");
            setCurrentView("dashboard");
          }
          // Fetch database tables once profile matches
          setTimeout(() => {
            fetchPortalData();
          }, 100);
        }
      } catch (err) {
        console.error("Session restore failed:", err);
      }
    };
    restoreSession();
  }, []);

  const fetchPortalData = async () => {
    try {
      const res = await fetch("/api/portal");
      if (res.status === 401) {
        // Not authenticated
        return;
      }
      const data = await res.json();
      if (data.error) {
        console.error("Error loading live portal state:", data.error);
        return;
      }
      setMembers(data.members || []);
      setContributions(data.contributions || []);
      setPersonalContributions(data.personalContributions || []);
      setClaims(data.claims || []);
      setLoans(data.loans || []);
      setNotifications(data.notifications || []);
      setActivities(data.activities || []);
      setSmsHistory(data.smsHistory || []);
      setAuditLogs(data.auditLogs || []);
      setReportsList(data.reportsList || []);
      if (data.fundStats) {
        setFundStats(data.fundStats);
      }
    } catch (err) {
      console.error("Portal state fetch failed:", err);
    }
  };

  // Handle Login Authentication Routing based on Credentials
  const handleAuthentication = async (email, password) => {
    if (!email || !password) return;

    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", payload: { email, password } })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { error: data.error || "Login failed. Please try again." };
      }

      const { user } = data;

      // Staff on first login — force password reset before entering dashboard
      if (user.role === "staff" && !user.passwordChanged) {
        setPendingLoginEmail(email.trim());
        // Store the entered password temporarily in state so the reset modal can
        // pass it as currentPassword to the changePassword API for verification
        setPendingLoginPassword(password);
        setShowPasswordReset(true);
        // Pre-load profile so the dashboard is ready once they complete reset
        setUserRole("staff");
        setUserProfile({
          name: user.name,
          id: user.id,
          email: user.email,
          role: "TUTAG Member",
          avatarInitials: user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
          roleLabel: "Staff Member",
          department: user.dept || "Computer Science Department",
          enrolledDate: "October 12, 2019"
        });
        setActiveTab("overview");
        return { error: null };
      }

      if (user.role === "admin") {
        setUserRole("admin");
        setUserProfile({
          name: user.name,
          id: user.id,
          email: user.email,
          role: "Administrator",
          avatarInitials: user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
          roleLabel: "Scheme Manager",
          department: user.dept || "Administration Secretariat",
          enrolledDate: "January 15, 2018"
        });
        setActiveTab("dashboard");
        setCurrentView("dashboard");
        showToastMsg(`Welcome back, ${user.name}!`);
      } else if (user.role === "auditor") {
        setUserRole("auditor");
        setUserProfile({
          name: user.name,
          id: user.id,
          email: user.email,
          role: "Audit Executive",
          avatarInitials: user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
          roleLabel: "System Auditor",
          department: user.dept || "Internal Audit Directorate",
          enrolledDate: "November 01, 2021"
        });
        setActiveTab("dashboard");
        setCurrentView("dashboard");
        showToastMsg("Authorized audit trail console active.");
      } else {
        // Staff member — password already changed
        setUserRole("staff");
        setUserProfile({
          name: user.name,
          id: user.id,
          email: user.email,
          role: "TUTAG Member",
          avatarInitials: user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
          roleLabel: "Staff Member",
          department: user.dept || "Computer Science Department",
          enrolledDate: "October 12, 2019"
        });
        setActiveTab("overview");
        setCurrentView("dashboard");
        showToastMsg(`Welcome back, ${user.name}!`);
      }

      fetchPortalData();
      return { error: null };

    } catch (err) {
      console.error("Auth error:", err);
      return { error: "Unable to connect. Please check your network and try again." };
    }
  };

  // Register new member submit
  const handleRegisterMember = async (e) => {
    e.preventDefault();
    if (!newMember.firstName || !newMember.lastName || !newMember.staffId) return;

    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registerMember",
          payload: newMember
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "Failed to register member.", "error");
        return;
      }

      const fullName = `${newMember.firstName} ${newMember.lastName}`;
      setNewMember({
        firstName: "", lastName: "", staffId: "", union: "TUTAG", phone: "", email: "", department: "Applied Sciences & Technology", employmentDate: "", spouseName: "", guardianName: ""
      });
      setShowMemberModal(false);
      showToastMsg(`Registered ${fullName} successfully!`);
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error registering member.", "error");
    }
  };

  // Submit SMS Broadcast
  const handleSendSMS = async (e) => {
    e.preventDefault();
    if (!smsData.message) return;

    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendSMS",
          payload: {
            ...smsData,
            userProfileName: userProfile.name
          }
        })
      });
      setSmsData(prev => ({ ...prev, message: "" }));
      showToastMsg("SMS Broadcast sent successfully!");
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error sending broadcast.", "error");
    }
  };

  // Record payment custom
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.memberId) return;

    const member = members.find(m => m.id === newPayment.memberId);
    const memberName = member ? member.name : "Unknown Member";

    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recordPayment",
          payload: {
            ...newPayment,
            memberName
          }
        })
      });
      setShowPaymentModal(false);
      showToastMsg(`Payment recorded for ${memberName}`);
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error recording payment.", "error");
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!newClaim.title || !newClaim.amount) {
      console.warn("Claim submission blocked: Missing title/description or amount.", newClaim);
      return;
    }

    const targetMember = userRole === "staff" ? userProfile : (members.find(m => m.id === newClaim.memberId) || userProfile);

    try {
      console.log("Submitting claim to database...", { targetMember, newClaim });
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitClaim",
          payload: {
            applicant: targetMember.name,
            index: targetMember.id,
            type: newClaim.type || "Critical Illness",
            amount: newClaim.amount,
            notes: newClaim.title,
            userProfileName: userProfile.name
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed server request");
      }

      setNewClaim({ memberId: "", type: "Critical Illness", title: "", amount: "", description: "" });
      setShowClaimModal(false);
      showToastMsg("Claim submitted successfully!");
      fetchPortalData();
    } catch (err) {
      console.error("Claim Submission Error:", err);
      showToastMsg("Failed to submit claim. Please try again or contact the Welfare Secretariat.", "error");
    }
  };

  // Staff makes MoMo contribution directly via Paystack
  const handleStaffContributeDues = () => {
    const month = "July 2026";
    const amount = schemeConfig.monthlyContribution;

    if (typeof window === "undefined" || !window.PaystackPop) {
      showToastMsg("Payment gateway is loading. Please try again in a moment.", "error");
      return;
    }

    try {
      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: userProfile.email,
        amount: Math.round(amount * 100), // in pesewas
        currency: "GHS",
        onSuccess: async (transaction) => {
          try {
            const res = await fetch("/api/portal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "verifyDuesPayment",
                payload: {
                  reference: transaction.reference,
                  memberId: userProfile.id,
                  month,
                  amount,
                  memberName: userProfile.name
                }
              })
            });
            const data = await res.json();
            if (!res.ok) {
              showToastMsg(data.error || "Payment verification failed.", "error");
            } else {
              setShowPaymentModal(false);
              showToastMsg(`Welfare dues paid and verified successfully!`);
              fetchPortalData();
            }
          } catch (err) {
            showToastMsg("Connection error verifying transaction.", "error");
          }
        },
        onCancel: () => {
          showToastMsg("Transaction was cancelled.", "error");
        }
      });
    } catch (err) {
      showToastMsg("Payment gateway checkout could not be initialized. Please check your connection.", "error");
    }
  };

  // Staff requests Emergency Loan
  const handleStaffLoanRequest = async (e) => {
    e.preventDefault();
    if (!newLoan.amount) return;

    const termMonths = parseInt(newLoan.term, 10); // safely extracts leading number from "3 months"
    const monthlyInstallment = termMonths > 0
      ? Math.ceil(parseFloat(newLoan.amount) / termMonths)
      : parseFloat(newLoan.amount);

    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitLoan",
          payload: {
            applicant: userProfile.name,
            index: userProfile.id,
            amount: newLoan.amount,
            term: newLoan.term,
            reason: newLoan.reason,
            monthlyInstallment
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "Failed to submit loan application.", "error");
        return;
      }
      setNewLoan({ amount: "", term: "3 months", reason: "" });
      setShowLoanModal(false);
      showToastMsg("Loan application submitted successfully!");
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error requesting loan.", "error");
    }
  };

  // Settle Loan Installment (Staff Member uses Paystack, Admin logs directly)
  const handleSettleInstallment = async (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const paymentAmount = loan.monthlyInstallment;

    if (userRole === "staff") {
      if (typeof window === "undefined" || !window.PaystackPop) {
        showToastMsg("Payment gateway is loading. Please try again in a moment.", "error");
        return;
      }

      try {
        const paystack = new window.PaystackPop();
        paystack.newTransaction({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: userProfile.email,
          amount: Math.round(paymentAmount * 100),
          currency: "GHS",
          onSuccess: async (transaction) => {
            try {
              const res = await fetch("/api/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "verifyLoanPayment",
                  payload: {
                    reference: transaction.reference,
                    loanId,
                    paymentAmount,
                    userProfileName: userProfile.name
                  }
                })
              });
              const data = await res.json();
              if (!res.ok) {
                showToastMsg(data.error || "Loan payment verification failed.", "error");
              } else {
                showToastMsg(`Installment of GH₵${paymentAmount}.00 settled and verified successfully!`);
                fetchPortalData();
              }
            } catch (err) {
              showToastMsg("Connection error verifying transaction.", "error");
            }
          },
          onCancel: () => {
            showToastMsg("Transaction was cancelled.", "error");
          }
        });
      } catch (err) {
        showToastMsg("Payment gateway checkout could not be initialized. Please check your connection.", "error");
      }
    } else {
      try {
        const res = await fetch("/api/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "settleInstallment",
            payload: {
              loanId,
              paymentAmount,
              userProfileName: userProfile.name
            }
          })
        });
        const data = await res.json();
        if (!res.ok) {
          showToastMsg(data.error || "Error settling installment.", "error");
          return;
        }
        showToastMsg(`Settled GH₵${paymentAmount}.00 installment for ${loanId}`);
        fetchPortalData();
      } catch (err) {
        showToastMsg("Error settling installment.", "error");
      }
    }
  };

  // Admin approves claim
  const handleApproveClaim = async (claimId) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approveClaim",
          payload: {
            claimId,
            amount: claim.amount,
            userProfileName: userProfile.name
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "Error approving claim.", "error");
        return;
      }
      showToastMsg(`Claim ${claimId} approved!`);
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error approving claim.", "error");
    }
  };

  // Admin rejects claim
  const handleRejectClaim = async (claimId) => {
    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rejectClaim",
          payload: {
            claimId,
            userProfileName: userProfile.name
          }
        })
      });
      showToastMsg(`Claim ${claimId} rejected`);
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error rejecting claim.", "error");
    }
  };

  // Admin approves loan
  const handleApproveLoan = async (loanId) => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approveLoan",
          payload: {
            loanId,
            userProfileName: userProfile.name
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "Error approving loan.", "error");
        return;
      }
      showToastMsg(`Loan ${loanId} Approved!`);
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error approving loan.", "error");
    }
  };

  // Admin rejects loan
  const handleRejectLoan = async (loanId) => {
    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rejectLoan",
          payload: {
            loanId,
            userProfileName: userProfile.name
          }
        })
      });
      showToastMsg(`Loan ${loanId} rejected`);
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error rejecting loan.", "error");
    }
  };

  // Generate Financial report
  const handleGenerateReport = async (reportName, period) => {
    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateReport",
          payload: {
            name: reportName,
            period,
            userProfileName: userProfile.name
          }
        })
      });
      showToastMsg(`Generated report for ${period}`);
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error generating report.", "error");
    }
  };

  const handleUpdatePrivileges = async (memberId, role, status) => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateMemberPrivileges",
          payload: { memberId, role, status }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "Failed to update privileges.", "error");
        return { error: data.error };
      }
      showToastMsg("Privileges updated successfully.");
      fetchPortalData();
      return { success: true };
    } catch (err) {
      showToastMsg("Error updating privileges.", "error");
      return { error: "Network error. Please try again." };
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" })
      });
      setCurrentView("login");
      showToastMsg("Logged out successfully.");
    } catch (err) {
      showToastMsg("Logout failed.", "error");
    }
  };

  const handleBackupDatabase = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        exportedBy: userProfile.name,
        systemName: "HTU Staff Welfare Scheme Portal",
        databaseType: "PostgreSQL (Neon Cloud Backup)",
        tables: {
          members,
          dues_ledger: contributions,
          receipts: personalContributions,
          claims,
          loans,
          auditLogs,
          reportsList
        }
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `HTU_Welfare_Backup_${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToastMsg("JSON database backup file downloaded successfully!");
    } catch (err) {
      showToastMsg("Failed to generate database backup.", "error");
    }
  };

  const markAllNotifRead = async () => {
    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "markAllNotifRead"
        })
      });
      showToastMsg("All notifications marked as read");
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error marking notifications.", "error");
    }
  };

  return (
    <div className="flex-1 flex flex-col font-sans">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[300] bg-white/95 border border-gold/40 rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-fade-in transition-all">
          <div className="p-1 rounded-full bg-gold/15 text-gold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-navy uppercase block">System Notification</span>
            <p className="text-xs font-semibold text-text-2">{toast.message}</p>
          </div>
        </div>
      )}

      {currentView === "landing" ? (
        <LandingPage onEnterPortal={() => setCurrentView("login")} />
      ) : currentView === "login" ? (
        <LoginView onLogin={handleAuthentication} />
      ) : (
        <div className="flex-1 flex min-h-screen bg-cream overflow-x-hidden">
          
          <Sidebar
            userRole={userRole}
            userProfile={userProfile}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setCurrentView={setCurrentView}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            loans={loans}
            claims={claims}
            members={members}
            onLogout={handleLogout}
          />

          <div className="main flex flex-col min-h-screen">
            <Topbar
              userRole={userRole}
              userProfile={userProfile}
              activeTab={activeTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              notifications={notifications}
              isNotifOpen={isNotifOpen}
              setIsNotifOpen={setIsNotifOpen}
              markAllNotifRead={markAllNotifRead}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <main className="flex-1 p-8 space-y-6 lg:p-8 md:p-6 p-4">
              
              {/* TAB: STAFF OVERVIEW */}
              {activeTab === "overview" && userRole === "staff" && (
                <StaffOverview
                  userProfile={userProfile}
                  personalContributions={personalContributions}
                  loans={loans}
                  claims={claims}
                  schemeConfig={schemeConfig}
                  setShowPaymentModal={setShowPaymentModal}
                  setShowClaimModal={setShowClaimModal}
                  setShowLoanModal={setShowLoanModal}
                  setActiveTab={setActiveTab}
                  handleSettleInstallment={handleSettleInstallment}
                />
              )}

              {/* TAB: ADMIN OVERVIEW / DASHBOARD */}
              {activeTab === "dashboard" && userRole !== "staff" && (
                <AdminDashboard
                  userRole={userRole}
                  members={members}
                  claims={claims}
                  fundStats={fundStats}
                  activities={activities}
                  setActiveTab={setActiveTab}
                  setShowMemberModal={setShowMemberModal}
                  handleBackupDatabase={handleBackupDatabase}
                />
              )}

              {/* TAB: MEMBERS */}
              {activeTab === "members" && userRole !== "staff" && (
                <MemberRegistry
                  members={members}
                  userRole={userRole}
                  setShowMemberModal={setShowMemberModal}
                  onUpdatePrivileges={handleUpdatePrivileges}
                />
              )}

              {/* TAB: CONTRIBUTIONS */}
              {activeTab === "contributions" && (
                <ContributionsLedger
                  userRole={userRole}
                  members={members}
                  contributions={contributions}
                  personalContributions={personalContributions}
                  fundStats={fundStats}
                  schemeConfig={schemeConfig}
                  setShowPaymentModal={setShowPaymentModal}
                />
              )}

              {/* TAB: CLAIMS */}
              {activeTab === "claims" && (
                <ClaimsTracker
                  userRole={userRole}
                  userProfile={userProfile}
                  claims={claims}
                  setShowClaimModal={setShowClaimModal}
                  handleApproveClaim={handleApproveClaim}
                  handleRejectClaim={handleRejectClaim}
                />
              )}

              {/* TAB: LOANS */}
              {activeTab === "loans" && (
                <LoansTracker
                  userRole={userRole}
                  userProfile={userProfile}
                  loans={loans}
                  fundStats={fundStats}
                  setShowLoanModal={setShowLoanModal}
                  handleSettleInstallment={handleSettleInstallment}
                  handleApproveLoan={handleApproveLoan}
                  handleRejectLoan={handleRejectLoan}
                />
              )}

              {/* TAB: REPORTS */}
              {activeTab === "reports" && userRole !== "staff" && (
                <ReportsPanel
                  userRole={userRole}
                  reportsList={reportsList}
                  setShowReportModal={setShowReportModal}
                  handleGenerateReport={handleGenerateReport}
                />
              )}

              {/* TAB: SMS BROADCAST */}
              {activeTab === "sms" && userRole !== "staff" && (
                <SMSPanel
                  userRole={userRole}
                  smsData={smsData}
                  setSmsData={setSmsData}
                  smsHistory={smsHistory}
                  handleSendSMS={handleSendSMS}
                />
              )}

              {/* TAB: AUDIT TRAIL LOG */}
              {activeTab === "audit" && userRole !== "staff" && (
                <AuditLog auditLogs={auditLogs} />
              )}

              {/* TAB: SETTINGS */}
              {activeTab === "settings" && (
                <SettingsPanel
                  userRole={userRole}
                  userProfile={userProfile}
                  schemeConfig={schemeConfig}
                  setSchemeConfig={setSchemeConfig}
                  members={members}
                  showToastMsg={showToastMsg}
                />
              )}

            </main>

            {/* FOOTER */}
            <footer className="bg-white border-t border-border py-6 text-center space-y-2 mt-auto">
              <div className="flex justify-center items-center gap-2 text-text-3 font-semibold">
                <Heart className="h-4 w-4 text-red fill-red" />
                <span>Ho Technical University Staff Welfare Scheme Board Office</span>
              </div>
              <p className="text-[11px] text-text-3 font-bold">
                &copy; 2026 HTU Staff Welfare Scheme. All rights reserved. Registered Administration System.
              </p>
            </footer>

          </div>
        </div>
      )}

      {/* OVERLAY MODALS */}
      <RegisterMemberModal
        show={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        newMember={newMember}
        setNewMember={setNewMember}
        onSubmit={handleRegisterMember}
      />

      <ContributeDuesModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        userRole={userRole}
        userProfile={userProfile}
        schemeConfig={schemeConfig}
        members={members}
        newPayment={newPayment}
        setNewPayment={setNewPayment}
        onSubmitAdmin={handleRecordPayment}
        onSubmitStaff={handleStaffContributeDues}
      />

      <FileBenefitClaimModal
        show={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        userRole={userRole}
        members={members}
        newClaim={newClaim}
        setNewClaim={setNewClaim}
        onSubmit={handleClaimSubmit}
      />

      <RequestEmergencyLoanModal
        show={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        newLoan={newLoan}
        setNewLoan={setNewLoan}
        onSubmit={handleStaffLoanRequest}
      />

      <GenerateReportModal
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleGenerateReport}
      />

      {/* FORCE PASSWORD RESET — shown to staff on first login */}
      {showPasswordReset && (
        <ForcePasswordReset
          userEmail={pendingLoginEmail}
          currentPassword={pendingLoginPassword}
          onSuccess={() => {
            setShowPasswordReset(false);
            setPendingLoginEmail("");
            setPendingLoginPassword("");
            setCurrentView("dashboard");
            showToastMsg("Password updated. Welcome to the portal!");
            fetchPortalData();
          }}
        />
      )}

    </div>
  );
}
