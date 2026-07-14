"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import { SMSPanel } from "@/components/SystemPanels";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SMSPage() {
  const { userRole, smsData, setSmsData, smsHistory, handleSendSMS } = useWelfare();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "staff" || userRole === "auditor") {
      router.push("/dashboard");
    }
  }, [userRole, router]);

  if (userRole === "staff" || userRole === "auditor") return null;

  return (
    <SMSPanel
      userRole={userRole}
      smsData={smsData}
      setSmsData={setSmsData}
      smsHistory={smsHistory}
      handleSendSMS={handleSendSMS}
    />
  );
}
