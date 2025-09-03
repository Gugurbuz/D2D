import React from "react";
import { Role, Screen } from "../types";
import {
  LayoutDashboard,
  Map,
  ListChecks,
  BarChart3,
  Users,
  Camera,
  MessageSquareMore,
  UserCircle2,
} from "lucide-react";

type Props = {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  agentAvatarUrl?: string;
};

const C_NAVY = "var(--brand-navy, #002D72)";
const C_YELLOW = "var(--brand-yellow, #F9C800)";

export default function Navigation({
  agentName,
  role,
  currentScreen,
  setCurrentScreen,
  agentAvatarUrl,
}: Props) {
  // Menü öğeleri
  const commonItems: Array<{ key: Screen; label: string; icon: React.ReactNode }> = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { key: "routeMap", label: "Rota Haritası", icon: <Map className="h-5 w-5" /> },
    { key: "visitList", label: "Ziyaret Listesi", icon: <ListChecks className="h-5 w-5" /> },
    { key: "reports", label: "Raporlar", icon: <BarChart3 className="h-5 w-5" /> },
    // ✅ YENİ: Router kullanmadan, ayrı bir ekran olarak Rakip Fatura
    { key: "competitorBill", label: "Rakip Fatura", icon: <Camera className="h-5 w-5" /> },
    { key: "messages", label: "Mesajlar", icon: <MessageSquareMore className="h-5 w-5" /> },
  ];

  const managerOnly: Array<{ key: Screen; label: string; icon: React.ReactNode }> = [
    { key: "teamMap", label: "Ekip Haritası", icon: <Users className="h-5 w-5" /> },
    { key: "assignmentMap", label: "Görev Atama", icon: <Map className="h-5 w-5" /> },
  ];

  const items =
    role === "manager" ? [...commonItems.slice(0, 4), ...managerOnly, ...commonItems.slice(4)] : commonItems;

  return (
    <header
      className="w-full border-b bg-white"
      style={{ borderColor: "rgba(0,0,0,0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Sol: Kullanıcı */}
        <div className="flex items-center gap-3">
          {agentAvatarUrl ? (
            <img
              src={agentAvatarUrl}
              alt={agentName}
              className="h-9 w-9 rounded-full object-cover ring-2"
              style={{ ringColor: C_YELLOW as any }}
            />
          ) : (
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ background: C_NAVY }}
              title={agentName}
            >
              {agentName?.[0]?.toUpperCase() || "A"}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-sm font-semibold" style={{ color: C_NAVY }}>
              {agentName || "Kullanıcı"}
            </div>
            <div className="text-xs text-gray-500">{role === "manager" ? "Saha Yöneticisi" : "Satış Uzmanı"}</div>
          </div>
        </div>

        {/* Orta: Menü */}
        <nav className="hidden md:flex items-center gap-6">
          {items.map((it) => {
            const active = currentScreen === it.key;
            return (
              <button
                key={it.key}
                onClick={() => setCurrentScreen(it.key)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md transition-all
                  ${active ? "text-white" : "text-[inherit] border"}
                `}
                style={
                  active
                    ? { background: C_NAVY }
                    : { borderColor: C_NAVY, color: C_NAVY }
                }
              >
                {it.icon}
                <span className="text-sm">{it.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sağ: Profil kısayolu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentScreen("profile")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-white"
            style={{ background: C_NAVY }}
            title="Profil"
          >
            <UserCircle2 className="h-5 w-5" />
            <span className="text-sm">Profil</span>
          </button>
        </div>
      </div>

      {/* Mobil menü (istenirse basit yatay kaydırmalı) */}
      <div className="md:hidden overflow-x-auto px-3 pb-3 flex gap-3">
        {items.map((it) => {
          const active = currentScreen === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setCurrentScreen(it.key)}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                active ? "text-white" : ""
              }`}
              style={
                active
                  ? { background: C_NAVY }
                  : { border: `1px solid ${C_NAVY}`, color: C_NAVY }
              }
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
