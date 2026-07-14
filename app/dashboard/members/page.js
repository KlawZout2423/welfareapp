"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import MemberRegistry from "@/components/MemberRegistry";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MembersPage() {
  const { members, userRole, setShowMemberModal, handleUpdatePrivileges, searchQuery } = useWelfare();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "staff") {
      router.push("/dashboard");
    }
  }, [userRole, router]);

  if (userRole === "staff") return null;

  return (
    <MemberRegistry
      members={members}
      userRole={userRole}
      setShowMemberModal={setShowMemberModal}
      onUpdatePrivileges={handleUpdatePrivileges}
      searchQuery={searchQuery}
    />
  );
}
