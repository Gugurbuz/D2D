// src/components/Navigation.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  Map,
  Users,
  CheckSquare,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  BellDot,
  Home,
  Route,
  List,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { Role, Screen } from '../types';
import { mockConversations } from '../data/messages'; 
import { mockNotifications as defaultNotifications, AppNotification } from '../data/notifications'; // Bildirimleri ayrı bir dosyadan alalım
import ThemeSwitcher from './ThemeSwitcher'; 
type Props = {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  agentAvatarUrl?: string;
};

const Navigation: React.FC<Props> = ({
  agentName,
  role,
  currentScreen,
  setCurrentScreen,
  agentAvatarUrl,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<AppNotification[]>(defaultNotifications);
  const notifUnread = notifItems.filter((n) => n.unread).length;
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
    // YENİLİK: Bu satırdaki `sticky top-0 z-20` sınıfları navigasyon barını sabitler
    <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Sol Taraf - Profil */}
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
                  <Btn onClick={() => setCurrentScreen("assignmentMap")} active={currentScreen === "assignmentMap"} label="Görev Atama"><UserCheck className="w-5 h-5" /></Btn>
                  <Btn onClick={() => setCurrentScreen("teamMap")} active={currentScreen === "teamMap"} label="Ekip Haritası"><Users className="w-5 h-5" /></Btn>
                </>
              )}
              <Btn onClick={() => setCurrentScreen("messages")} active={currentScreen === "messages"} label="Mesajlar">
                <MessageSquare className="w-5 h-5" />
                {messageUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </Btn>
              <div className="relative shrink-0" ref={notifAnchorRef}>
                <button type="button" onClick={() => setNotifOpen((o) => !o)} className="px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 relative" title="Bildirimler" aria-label="Bildirimler" aria-expanded={notifOpen}>
                  {notifUnread > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  {notifUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">{notifUnread}</span>
                  )}
                </button>
              </div>
            </div>
            {notifOpen && (
              <div ref={notifMenuRef} className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="font-semibold text-gray-900">Bildirimler</div>
                  <button onClick={markAllRead} className="text-xs text-[#0099CB] hover:underline">Tümünü okundu işaretle</button>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {notifItems.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">Bildirim yok</div>
                  ) : (
                    notifItems.map((n) => (
                      <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 ${n.unread ? "bg-[#0099CB]/5" : ""}`}>
                        {/* ... bildirim içeriği ... */}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;