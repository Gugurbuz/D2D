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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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