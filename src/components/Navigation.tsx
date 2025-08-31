// src/components/Navigation.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  Route as RouteIcon,
  List,
  BarChart3,
  UserCheck,
  Users,
  Bell,
  BellDot,
} from "lucide-react";
import { Role, Screen } from "../types";
import { mockNotifications, AppNotification } from "../data/notifications";

type Props = {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  agentAvatarUrl?: string; // YENİ: foto url (opsiyonel)
};

const Navigation: React.FC<Props> = ({
  agentName,
  role,
  currentScreen,
  setCurrentScreen,
  agentAvatarUrl,
}) => {
  // Bildirim açılır menü state
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(mockNotifications);
  const unread = items.filter((n) => n.unread).length;
  const popRef = useRef<HTMLDivElement | null>(null);

  // Dışarı tıkla → kapat
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  const avatarSrc =
    agentAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      agentName || "Kullanıcı"
    )}&background=0099CB&color=fff`;

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Sol: Kullanıcı */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 shrink-0">
            <img
              src={avatarSrc}
              alt={agentName || "Kullanıcı"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="truncate">
            <h2 className="font-semibold text-gray-900 truncate">
              {agentName || "Kullanıcı"}
            </h2>
            <p className="text-sm text-gray-600 truncate">
              {role === "manager" ? "Saha Yöneticisi" : "Saha Temsilcisi"}
            </p>
          </div>
        </div>

        {/* Sağ: Nav butonları */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentScreen("dashboard")}
            className={`px-3 sm:px-4 py-2 rounded-lg ${
              currentScreen === "dashboard" ? "bg-[#F9C800]" : "hover:bg-gray-100"
            }`}
            title="Gösterge Paneli"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentScreen("routeMap")}
            className={`px-3 sm:px-4 py-2 rounded-lg ${
              currentScreen === "routeMap" ? "bg-[#F9C800]" : "hover:bg-gray-100"
            }`}
            title="Rota Haritası"
          >
            <RouteIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentScreen("visitList")}
            className={`px-3 sm:px-4 py-2 rounded-lg ${
              currentScreen === "visitList" ? "bg-[#F9C800]" : "hover:bg-gray-100"
            }`}
            title="Ziyaret Listesi"
          >
            <List className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentScreen("reports")}
            className={`px-3 sm:px-4 py-2 rounded-lg ${
              currentScreen === "reports" ? "bg-[#F9C800]" : "hover:bg-gray-100"
            }`}
            title="Raporlar"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {role === "manager" && (
            <>
              <button
                onClick={() => setCurrentScreen("assignment")}
                className={`px-3 sm:px-4 py-2 rounded-lg ${
                  currentScreen === "assignment"
                    ? "bg-[#F9C800]"
                    : "hover:bg-gray-100"
                }`}
                title="Atama"
                aria-label="Atama"
              >
                <UserCheck className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentScreen("teamMap")}
                className={`px-3 sm:px-4 py-2 rounded-lg ${
                  currentScreen === "teamMap" ? "bg-[#F9C800]" : "hover:bg-gray-100"
                }`}
                title="Ekip Haritası"
                aria-label="Ekip Haritası"
              >
                <Users className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Bildirimler */}
          <div className="relative" ref={popRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className={`px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 relative`}
              title="Bildirimler"
              aria-label="Bildirimler"
            >
              {unread > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">
                  {unread}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="font-semibold text-gray-900">Bildirimler</div>
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#0099CB] hover:underline"
                  >
                    Tümünü okundu işaretle
                  </button>
                </div>

                <div className="max-h-[300px] overflow-auto">
                  {items.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">
                      Bildirim yok
                    </div>
                  ) : (
                    items.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b last:border-b-0 ${
                          n.unread ? "bg-[#0099CB]/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 inline-block w-2 h-2 rounded-full ${
                              n.type === "assignment"
                                ? "bg-amber-500"
                                : n.type === "visit"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {n.title}
                            </div>
                            {n.desc && (
                              <div className="text-xs text-gray-600 truncate">
                                {n.desc}
                              </div>
                            )}
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {n.timeAgo}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* /Bildirimler */}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
