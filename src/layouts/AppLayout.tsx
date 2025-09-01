// src/layouts/AppLayout.tsx

import React from "react";
import Navigation from "../components/Navigation";
import { Role, Screen } from "../types";

type Props = {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  agentAvatarUrl?: string;
  children: React.ReactNode;
};

export default function AppLayout({
  agentName,
  role,
  currentScreen,
  setCurrentScreen,
  agentAvatarUrl,
  children,
}: Props) {
  return (
    // DÜZELTME: `overflow-x-hidden` sınıfı `sticky` özelliğini bozduğu için kaldırıldı.
    <div className="min-h-screen bg-gray-50">
      <Navigation
        agentName={agentName}
        role={role}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        agentAvatarUrl={agentAvatarUrl}
      />
      <main className="px-3 sm:px-6 py-4">{children}</main>
    </div>
  );
}