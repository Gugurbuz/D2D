// src/layouts/AppLayout.tsx

import React from "react";
import NavigationBar from "../features/navigation/components/NavigationBar";
import { Role, Screen } from "../shared/types";

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
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <NavigationBar
        agentName={agentName}
        role={role}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        agentAvatarUrl={agentAvatarUrl}
      />
      
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
        {children}
      </main>
    </div>
  );
}