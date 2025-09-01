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
    // DÜZELTME: Ana kapsayıcı artık tüm ekranı kaplayan (h-screen)
    // ve içeriği dikey olarak sıralayan (flex-col) bir yapıya sahip.
    // `overflow-hidden` ile tüm sayfanın kayması engelleniyor.
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navigation
        agentName={agentName}
        role={role}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        agentAvatarUrl={agentAvatarUrl}
      />
      
      {/* DÜZELTME: Ana içerik alanı artık kalan tüm alanı kaplıyor (flex-1)
          ve SADECE BU ALAN dikey olarak kaydırılabiliyor (overflow-y-auto). */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
        {children}
      </main>
    </div>
  );
}