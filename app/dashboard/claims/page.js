"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import ClaimsTracker from "@/components/ClaimsTracker";

export default function ClaimsPage() {
  const {
    userRole,
    userProfile,
    claims,
    setShowClaimModal,
    handleApproveClaim,
    handleRejectClaim,
    searchQuery
  } = useWelfare();

  return (
    <ClaimsTracker
      userRole={userRole}
      userProfile={userProfile}
      claims={claims}
      setShowClaimModal={setShowClaimModal}
      handleApproveClaim={handleApproveClaim}
      handleRejectClaim={handleRejectClaim}
      searchQuery={searchQuery}
    />
  );
}
