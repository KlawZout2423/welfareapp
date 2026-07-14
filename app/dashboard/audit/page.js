"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import { AuditLog } from "@/components/SystemPanels";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuditPage() {
  const { userRole, auditLogs, searchQuery } = useWelfare();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "staff") {
      router.push("/dashboard");
    }
  }, [userRole, router]);

  if (userRole === "staff") return null;

  return (
    <AuditLog auditLogs={auditLogs} searchQuery={searchQuery} />
  );
}
