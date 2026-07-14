"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import ContributionsLedger from "@/components/ContributionsLedger";

export default function ContributionsPage() {
  const {
    userRole,
    members,
    contributions,
    personalContributions,
    fundStats,
    schemeConfig,
    setShowPaymentModal,
    searchQuery
  } = useWelfare();

  return (
    <ContributionsLedger
      userRole={userRole}
      members={members}
      contributions={contributions}
      personalContributions={personalContributions}
      fundStats={fundStats}
      schemeConfig={schemeConfig}
      setShowPaymentModal={setShowPaymentModal}
      searchQuery={searchQuery}
    />
  );
}
