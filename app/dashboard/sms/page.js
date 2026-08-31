"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import { SMSPanel } from "@/components/SystemPanels";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SMSPage() {
  const { userRole, members, smsData, setSmsData, smsHistory, handleSendSMS, isSubmittingSMS } = useWelfare();
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
      members={members}
      smsData={smsData}
      setSmsData={setSmsData}
      smsHistory={smsHistory}
      handleSendSMS={handleSendSMS}
      isSubmittingSMS={isSubmittingSMS}
    />
  );
}
