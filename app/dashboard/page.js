"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import AdminDashboard from "@/components/AdminDashboard";
import StaffOverview from "@/components/StaffOverview";

export default function DashboardOverviewPage() {
  const {
    userRole,
    members,
    claims,
    fundStats,
    activities,
    setActiveTab,
    setShowMemberModal,
    handleBackupDatabase,
    userProfile,
    personalContributions,
    loans,
    schemeConfig,
    setShowPaymentModal,
    setShowClaimModal,
    setShowLoanModal,
    handleSettleInstallment,
    notices,
    handleCreateNotice,
    handleDeleteNotice
  } = useWelfare();

  if (userRole === "staff") {
    return (
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
        notices={notices}
        userRole={userRole}
      />
    );
  }

  return (
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
  );
}
