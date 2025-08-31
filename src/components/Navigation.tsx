// src/components/Navigation.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Home,
  Route,
  List,
  BarChart3,
  UserCheck,
  Users,
  Bell,
  BellDot,
  MessageSquare, // YENİLİK: İkon import edildi
} from "lucide-react";
import { Role, Screen } from "../types";
import { mockConversations } from '../data/messages'; // YENİLİK: Mesaj verisi import edildi

type Props = {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  agentAvatarUrl?: string;
};

type AppNotification = {
  id: string;
  title: string;
  desc?: string;
  timeAgo: string;
  type: "assignment" | "visit" | "system";
  unread?: boolean;
};

const mockNotifications: AppNotification[] = [
  { id: "n1", title: "3 müşteri Zelal Kaya’ya atandı", desc: "Kadıköy, Üsküdar, Ataşehir", timeAgo: "3 dk önce", type: "assignment", unread: true },
  { id: "n2", title: "Serkan Özkan 2 ziyareti tamamladı", desc: "Tamamlanan oranı %40", timeAgo: "32 dk önce", type: "visit", unread: true },
  { id: "n3", title: "Sistem bakımı 22:00–23:00", timeAgo: "1 saat önce", type: "system", unread: false },
];

const Navigation: React.FC<Props> = ({
  agentName,
  role,
  currentScreen,
  setCurrentScreen,
  agentAvatarUrl,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<AppNotification[]>(mockNotifications);
  const notifUnread = notifItems.filter((n) => n.unread).length;

  // YENİLİK: Okunmamış mesaj sayısını hesapla
  const messageUnreadCount = mockConversations.reduce((total, conversation) => {
    const unread = conversation.messages.filter(msg => msg.senderId !== 'you' && !msg.read).length;
    return total + unread;
  }, 0);

  const notifAnchorRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        notifAnchorRef.current && !notifAnchorRef.current.contains(t) &&
        notifMenuRef.current && !notifMenuRef.current.contains(t)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const markAllRead = () => setNotifItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  const avatarSrc = agentAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName || "Kullanıcı")}&background=0099CB&color=fff`;

  const Btn = ({ onClick, active, children, label }: { onClick: () => void; active: boolean; children: React.ReactNode; label: string; }) => (
    <button
      onClick={onClick}
      className={`relative shrink-0 px-3 sm:px-4 py-2 rounded-lg ${active ? "bg-[#F9C800]" : "hover:bg-gray-100"}`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* SOL: Kullanıcı */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 shrink-0">
            <img src={avatarSrc} alt={agentName || "Kullanıcı"} className="w-full h-full object-cover" />
          </div>
          <div className="truncate">
            <h2 className="font-semibold text-gray-900 truncate">{agentName || "Kullanıcı"}</h2>
            <p className="text-sm text-gray-600 truncate">{role === "manager" ? "Saha Yöneticisi" : "Saha Temsilcisi"}</p>
          </div>
        </div>

        {/* SAĞ: Araç Çubuğu */}
        <div className="relative flex-1 flex items-center justify-end">
          <div className="flex flex-nowrap items-center gap-1 sm:gap-2 overflow-x-auto max-w-full no-scrollbar">
            <Btn onClick={() => setCurrentScreen("dashboard")} active={currentScreen === "dashboard"} label="Dashboard"><Home className="w-5 h-5" /></Btn>
            <Btn onClick={() => setCurrentScreen("routeMap")} active={currentScreen === "routeMap"} label="Rota Haritası"><Route className="w-5 h-5" /></Btn>
            <Btn onClick={() => setCurrentScreen("visitList")} active={currentScreen === "visitList"} label="Ziyaret Listesi"><List className="w-5 h-5" /></Btn>
            <Btn onClick={() => setCurrentScreen("reports")} active={currentScreen === "reports"} label="Raporlar"><BarChart3 className="w-5 h-5" /></Btn>
            {role === "manager" && (
              <>
                <Btn onClick={() => setCurrentScreen("assignment")} active={currentScreen === "assignment"} label="Görev Atama"><UserCheck className="w-5 h-5" /></Btn>
                <Btn onClick={() => setCurrentScreen("teamMap")} active={currentScreen === "teamMap"} label="Ekip Haritası"><Users className="w-5 h-5" /></Btn>
              </>
            )}

            {/* YENİLİK: Mesaj Kutusu Butonu */}
            <Btn 
              onClick={() => setCurrentScreen("messages")} 
              active={currentScreen === "messages"} 
              label="Mesajlar"
            >
              <MessageSquare className="w-5 h-5" />
              {messageUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Btn>

            {/* Bildirimler */}
            <div className="relative shrink-0" ref={notifAnchorRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 relative"
                title="Bildirimler"
                aria-label="Bildirimler"
                aria-expanded={notifOpen}
              >
                {notifUnread > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                {notifUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">
                    {notifUnread}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Bildirim Dropdown */}
          {notifOpen && (
            <div ref={notifMenuRef} className="fixed right-3 top-16 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg">
                {/* ... bildirim içeriği ... */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;