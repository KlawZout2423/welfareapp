"use client";

import LoginView from "@/components/LoginView";
import { useWelfare } from "@/lib/context/WelfareContext";

export default function LoginPage() {
  const { handleAuthentication } = useWelfare();

  return (
    <LoginView onLogin={handleAuthentication} />
  );
}
