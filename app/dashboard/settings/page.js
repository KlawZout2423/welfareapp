"use client";

import { useWelfare } from "@/lib/context/WelfareContext";
import { SettingsPanel } from "@/components/SystemPanels";

export default function SettingsPage() {
  const {
    userRole,
    userProfile,
    schemeConfig,
    setSchemeConfig,
    members,
    showToastMsg
  } = useWelfare();

  return (
    <SettingsPanel
      userRole={userRole}
      userProfile={userProfile}
      schemeConfig={schemeConfig}
      setSchemeConfig={setSchemeConfig}
      members={members}
      showToastMsg={showToastMsg}
    />
  );
}
