"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ForcePasswordReset from "@/components/ForcePasswordReset";
import { Sparkles, Heart } from "lucide-react";
import {
  RegisterMemberModal,
  ContributeDuesModal,
  FileBenefitClaimModal,
  RequestEmergencyLoanModal,
  GenerateReportModal
} from "@/components/Modals";

export default function DashboardLayout({ children }) {
  const {
    userRole,
    userProfile,
    activeTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    searchQuery,
    setSearchQuery,
    notifications,
    isNotifOpen,
    setIsNotifOpen,
    markAllNotifRead,
    handleLogout,
    toast,
    
    // Modals
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
    
    // Form values
    newMember,
    setNewMember,
    handleRegisterMember,
    newPayment,
    setNewPayment,
    handleRecordPayment,
    handleStaffContributeDues,
    newClaim,
    setNewClaim,
    handleClaimSubmit,
    newLoan,
    setNewLoan,
    handleStaffLoanRequest,
    handleGenerateReport,
    schemeConfig,
    members,
    loans,
    claims,
    
    // Password reset
    showPasswordReset,
    setShowPasswordReset,
    pendingLoginEmail,
    setPendingLoginEmail,
    pendingLoginPassword,
    setPendingLoginPassword,
    fetchPortalData,
    showToastMsg,
    isSubmittingMember,
    isSubmittingDues,
    isSubmittingClaim,
    isSubmittingLoan
  } = useWelfare();

  // If session is still loading (userProfile has not resolved yet)
  if (userProfile.name === "Loading...") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-navy font-semibold text-sm">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-screen bg-cream overflow-x-hidden">
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

      <Sidebar
        userRole={userRole}
        userProfile={userProfile}
        activeTab={activeTab}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isMobileMenuOpen={isMobileMenuOpen}
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
          {children}
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-border py-6 text-center space-y-2 mt-auto px-4">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-1.5 text-text-3 font-semibold text-xs">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-red fill-red shrink-0" />
              <span>Ho Technical University Staff Welfare Scheme Board Office</span>
            </div>
          </div>
          <p className="text-[10px] text-text-3 font-bold leading-normal">
            &copy; 2026 HTU Staff Welfare Scheme. All rights reserved. Registered Administration System.
          </p>
        </footer>
      </div>

      {/* OVERLAY MODALS */}
       <RegisterMemberModal
        show={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        newMember={newMember}
        setNewMember={setNewMember}
        onSubmit={handleRegisterMember}
        isSubmitting={isSubmittingMember}
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
        isSubmitting={isSubmittingDues}
      />

      <FileBenefitClaimModal
        show={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        userRole={userRole}
        members={members}
        newClaim={newClaim}
        setNewClaim={setNewClaim}
        onSubmit={handleClaimSubmit}
        isSubmitting={isSubmittingClaim}
      />

      <RequestEmergencyLoanModal
        show={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        newLoan={newLoan}
        setNewLoan={setNewLoan}
        onSubmit={handleStaffLoanRequest}
        isSubmitting={isSubmittingLoan}
        loans={loans}
        userProfile={userProfile}
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
            showToastMsg("Password updated. Welcome to the portal!");
            fetchPortalData();
          }}
        />
      )}
    </div>
  );
}
