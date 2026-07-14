"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const WelfareContext = createContext(null);

export function WelfareProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // Roles & Tab States
  const [userRole, setUserRole] = useState("staff");
  const [activeTab, _setActiveTabState] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form input states
  const [searchQuery, setSearchQuery] = useState("");
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

  // Flag to prevent restoreSession from overwriting state right after a fresh login
  const justLoggedInRef = useRef(false);

  const showToastMsg = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // Form registration states
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

  const [newPayment, setNewPayment] = useState({
    memberId: "",
    month: "June 2026",
    amount: "25",
    method: "Mobile Money"
  });

  const [smsData, setSmsData] = useState({
    recipients: "All Members (248)",
    type: "Contribution Reminder",
    message: ""
  });

  const [newClaim, setNewClaim] = useState({
    memberId: "",
    type: "Critical Illness",
    title: "",
    amount: "",
    description: ""
  });

  const [newLoan, setNewLoan] = useState({
    amount: "",
    term: "3 months",
    reason: ""
  });

  // Global Sync States
  const [fundStats, setFundStats] = useState({
    totalFund: 43750,
    totalDisbursed: 38000,
    juneCollections: 6200,
    activeLoans: 18400
  });

  const [schemeConfig, setSchemeConfig] = useState({
    monthlyContribution: 25,
    eligibilityThreshold: 6,
    smsGateway: "Hubtel",
    financialYear: "January – December"
  });

  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    id: "",
    email: "",
    role: "",
    avatarInitials: "",
    roleLabel: "",
    department: "",
    enrolledDate: ""
  });

  // DB Lists
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
  const [notices, setNotices] = useState([]);

  // Modal loading states
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [isSubmittingDues, setIsSubmittingDues] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

  // Derive activeTab from pathname automatically
  useEffect(() => {
    const parts = pathname.split("/");
    const tabName = parts[parts.length - 1];
    
    if (tabName === "dashboard" || parts.length <= 2) {
      _setActiveTabState(userRole === "staff" ? "overview" : "dashboard");
    } else {
      _setActiveTabState(tabName);
    }
  }, [pathname, userRole]);

  // Set active tab and push router
  const setActiveTab = (tab) => {
    _setActiveTabState(tab);
    if (tab === "dashboard" || tab === "overview") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard/${tab}`);
    }
  };

  const fetchPortalData = async () => {
    try {
      const res = await fetch("/api/portal");
      if (res.status === 401) {
        // Redirect to login if unauthorized
        router.push("/login");
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
      setNotices(data.notices || []);
      if (data.fundStats) setFundStats(data.fundStats);
      if (data.schemeConfig) setSchemeConfig(data.schemeConfig);
    } catch (err) {
      console.error("Portal state fetch failed:", err);
    }
  };

  // Restore session
  const restoreSession = async () => {
    // Skip session restore if we just completed a fresh login —
    // handleAuthentication already set the correct role/profile client-side
    if (justLoggedInRef.current) {
      justLoggedInRef.current = false;
      return;
    }

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
            enrolledDate: user.enrolledDate || "—"
          });
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
            enrolledDate: user.enrolledDate || "—"
          });
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
            enrolledDate: user.enrolledDate || "—"
          });
        }
        // Fetch tables
        setTimeout(() => {
          fetchPortalData();
        }, 100);
        
        // If authenticated and visiting landing or login, route to dashboard
        if (pathname === "/" || pathname === "/login") {
          router.push("/dashboard");
        }
      } else {
        // If not authenticated, only redirect if trying to access dashboard
        if (pathname.startsWith("/dashboard")) {
          router.push("/login");
        }
      }
    } catch (err) {
      console.error("Session restore failed:", err);
      if (pathname.startsWith("/dashboard")) {
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    restoreSession();
  }, [pathname]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchPortalData();
    };
    window.addEventListener("portalDataRefresh", handleRefresh);
    return () => {
      window.removeEventListener("portalDataRefresh", handleRefresh);
    };
  }, []);

  // Handlers
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

      if (user.role === "staff" && !user.passwordChanged) {
        setPendingLoginEmail(email.trim());
        setPendingLoginPassword(password);
        setShowPasswordReset(true);
        setUserRole("staff");
        setUserProfile({
          name: user.name,
          id: user.id,
          email: user.email,
          role: "TUTAG Member",
          avatarInitials: user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
          roleLabel: "Staff Member",
          department: user.dept || "Computer Science Department",
          enrolledDate: user.enrolledDate || "—"
        });
        // Navigate to dashboard so the ForcePasswordReset overlay renders
        justLoggedInRef.current = true;
        router.push("/dashboard");
        fetchPortalData();
        return { error: null };
      }

      // Set the justLoggedIn flag so restoreSession doesn't overwrite our state
      justLoggedInRef.current = true;

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
          enrolledDate: user.enrolledDate || "—"
        });
        router.push("/dashboard");
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
          enrolledDate: user.enrolledDate || "—"
        });
        router.push("/dashboard");
        showToastMsg("Authorized audit trail console active.");
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
          enrolledDate: user.enrolledDate || "—"
        });
        router.push("/dashboard");
        showToastMsg(`Welcome back, ${user.name}!`);
      }

      fetchPortalData();
      return { error: null };

    } catch (err) {
      console.error("Auth error:", err);
      return { error: "Unable to connect. Please check your network and try again." };
    }
  };

  const handleRegisterMember = async (e) => {
    e.preventDefault();
    if (!newMember.firstName || !newMember.lastName || !newMember.staffId) return;

    setIsSubmittingMember(true);
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
    } finally {
      setIsSubmittingMember(false);
    }
  };

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

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.memberId) return;

    const member = members.find(m => m.id === newPayment.memberId);
    const memberName = member ? member.name : "Unknown Member";

    setIsSubmittingDues(true);
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
    } finally {
      setIsSubmittingDues(false);
    }
  };

  const handleClaimSubmit = async (e, uploadedDocs = []) => {
    e.preventDefault();
    if (!newClaim.title || !newClaim.amount) {
      console.warn("Claim submission blocked: Missing title/description or amount.", newClaim);
      return;
    }

    const targetMember = userRole === "staff" ? userProfile : (members.find(m => m.id === newClaim.memberId) || userProfile);

    setIsSubmittingClaim(true);
    try {
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

      // Save uploaded document metadata if any
      if (uploadedDocs.length > 0 && data.claimId) {
        await fetch("/api/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "saveClaimDocuments",
            payload: {
              claimId: data.claimId,
              memberId: targetMember.id,
              documents: uploadedDocs
            }
          })
        });
      }

      setNewClaim({ memberId: "", type: "Critical Illness", title: "", amount: "", description: "" });
      setShowClaimModal(false);
      showToastMsg("Claim submitted successfully!");
      fetchPortalData();
    } catch (err) {
      console.error("Claim Submission Error:", err);
      showToastMsg(err.message || "Failed to submit claim. Please try again.", "error");
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleStaffContributeDues = (selectedMonth) => {
    const month = selectedMonth || "July 2026";
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

  const handleStaffLoanRequest = async (e) => {
    e.preventDefault();
    if (!newLoan.amount) return;

    const termMonths = parseInt(newLoan.term, 10);
    const monthlyInstallment = termMonths > 0
      ? Math.ceil(parseFloat(newLoan.amount) / termMonths)
      : parseFloat(newLoan.amount);

    setIsSubmittingLoan(true);
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
    } finally {
      setIsSubmittingLoan(false);
    }
  };

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
      setUserProfile({ name: "Logged out", id: "", email: "" });
      router.push("/login");
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

  const handleCreateNotice = async (category, title, body) => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createNotice",
          payload: { category, title, body }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "Failed to post notice.", "error");
        return;
      }
      showToastMsg("Notice posted successfully!");
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error posting notice.", "error");
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteNotice",
          payload: { noticeId }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "Failed to delete notice.", "error");
        return;
      }
      showToastMsg("Notice removed.");
      fetchPortalData();
    } catch (err) {
      showToastMsg("Error deleting notice.", "error");
    }
  };

  return (
    <WelfareContext.Provider
      value={{
        // Role & Profile
        userRole,
        setUserRole,
        userProfile,
        setUserProfile,
        activeTab,
        setActiveTab,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        searchQuery,
        setSearchQuery,
        isNotifOpen,
        setIsNotifOpen,

        // Modal States
        showMemberModal,
        setShowMemberModal,
        showPaymentModal,
        setShowPaymentModal,
        showClaimModal,
        setShowClaimModal,
        showReportModal,
        setShowReportModal,
        showLoanModal,
        setShowLoanModal,

        // Toast States
        toast,
        showToastMsg,

        // Password Reset States
        showPasswordReset,
        setShowPasswordReset,
        pendingLoginEmail,
        setPendingLoginEmail,
        pendingLoginPassword,
        setPendingLoginPassword,

        // Form Inputs
        newMember,
        setNewMember,
        newPayment,
        setNewPayment,
        smsData,
        setSmsData,
        newClaim,
        setNewClaim,
        newLoan,
        setNewLoan,

        // Config & Stats
        fundStats,
        schemeConfig,
        setSchemeConfig,

        // DB Data
        members,
        contributions,
        personalContributions,
        claims,
        loans,
        notifications,
        activities,
        smsHistory,
        auditLogs,
        reportsList,
        notices,

        // Modal loading states
        isSubmittingMember,
        isSubmittingDues,
        isSubmittingClaim,
        isSubmittingLoan,

        // Actions
        fetchPortalData,
        handleAuthentication,
        handleRegisterMember,
        handleSendSMS,
        handleRecordPayment,
        handleClaimSubmit,
        handleStaffContributeDues,
        handleStaffLoanRequest,
        handleSettleInstallment,
        handleApproveClaim,
        handleRejectClaim,
        handleApproveLoan,
        handleRejectLoan,
        handleGenerateReport,
        handleUpdatePrivileges,
        handleLogout,
        handleBackupDatabase,
        markAllNotifRead,
        handleCreateNotice,
        handleDeleteNotice
      }}
    >
      {children}
    </WelfareContext.Provider>
  );
}

export function useWelfare() {
  const context = useContext(WelfareContext);
  if (!context) {
    throw new Error("useWelfare must be used within a WelfareProvider");
  }
  return context;
}
