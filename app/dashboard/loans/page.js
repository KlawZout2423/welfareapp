"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import LoansTracker from "@/components/LoansTracker";

export default function LoansPage() {
  const {
    userRole,
    userProfile,
    loans,
    fundStats,
    setShowLoanModal,
    handleSettleInstallment,
    handleApproveLoan,
    handleRejectLoan,
    searchQuery
  } = useWelfare();

  return (
    <LoansTracker
      userRole={userRole}
      userProfile={userProfile}
      loans={loans}
      fundStats={fundStats}
      setShowLoanModal={setShowLoanModal}
      handleSettleInstallment={handleSettleInstallment}
      handleApproveLoan={handleApproveLoan}
      handleRejectLoan={handleRejectLoan}
      searchQuery={searchQuery}
    />
  );
}
