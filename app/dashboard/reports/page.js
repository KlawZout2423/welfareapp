"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import { ReportsPanel } from "@/components/SystemPanels";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReportsPage() {
  const { userRole, reportsList, setShowReportModal, handleGenerateReport } = useWelfare();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "staff") {
      router.push("/dashboard");
    }
  }, [userRole, router]);

  if (userRole === "staff") return null;

  return (
    <ReportsPanel
      userRole={userRole}
      reportsList={reportsList}
      setShowReportModal={setShowReportModal}
      handleGenerateReport={handleGenerateReport}
    />
  );
}
