// src/components/Navigation.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  Route,
  List,
  BarChart3,
  UserCheck,
  Users,
  Bell,
  BellDot,
  MessageSquare,
} from "lucide-react";
import { Role, Screen } from "../types";
import { mockConversations, Message } from '../data/messages';
import { AppNotification, mockNotifications as defaultNotifications } from '../data/notifications';
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
  // Bildirimler için state'ler
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<AppNotification[]>(defaultNotifications);
  const notifUnread = notifItems.filter((n) => n.unread).length;

  // YENİLİK: Mesajlar için state'ler
  const [messageMenuOpen, setMessageMenuOpen] = useState(false);
  const [messageItems, setMessageItems] = useState(mockConversations);
  const messageUnreadCount = messageItems.reduce((total, conversation) => {
    return total + conversation.messages.filter(msg => msg.senderId !== 'you' && !msg.read).length;
  }, 0);

  // Referanslar (ref)
  const notifAnchorRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  // YENİLİK: Mesajlar menüsü için ref'ler
  const messageAnchorRef = useRef<HTMLButtonElement | null>(null);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);

  // Dışarıya tıklandığında menüleri kapatma efekti
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      // Bildirim menüsünü kapat
      if (notifAnchorRef.current && !notifAnchorRef.current.contains(t) && notifMenuRef.current && !notifMenuRef.current.contains(t)) {
        setNotifOpen(false);
      }
      // YENİLİK: Mesaj menüsünü kapat
      if (messageAnchorRef.current && !messageAnchorRef.current.contains(t) && messageMenuRef.current && !messageMenuRef.current.contains(t)) {
        setMessageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const markAllNotificationsRead = () => setNotifItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  const avatarSrc = agentAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName || "Kullanıcı")}&background=0099CB&color=fff`;

  const Btn = ({ onClick, active, children, label, refProp }: { onClick: () => void; active: boolean; children: React.ReactNode; label: string; refProp?: React.Ref<HTMLButtonElement> }) => (
    <button
      ref={refProp}
      onClick={onClick}
      className={`relative shrink-0 px-3 sm:px-4 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 ${
        active ? "bg-[#F9C800] text-gray-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Sol Taraf - Profil */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 shrink-0">
              <img src={avatarSrc} alt={agentName || "Kullanıcı"} className="w-full h-full object-cover" />
            </div>
            <div className="truncate">
              <h2 className="font-semibold text-gray-900 truncate dark:text-gray-100">{agentName || "Kullanıcı"}</h2>
              <p className="text-sm text-gray-600 truncate dark:text-gray-400">{role === "manager" ? "Saha Yöneticisi" : "Saha Temsilcisi"}</p>
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
              
              {/* YENİLİK: MESAJLAR BUTONU ARTIK MENÜ AÇIYOR */}
              <Btn
                refProp={messageAnchorRef}
                onClick={() => setMessageMenuOpen(o => !o)} 
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

              {/* BİLDİRİMLER BUTONU */}
              <div className="relative shrink-0" ref={notifAnchorRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="px-3 sm:px-4 py-2 rounded-lg relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Bildirimler"
                  aria-expanded={notifOpen}
                >
                  {notifUnread > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  {notifUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">{notifUnread}</span>
                  )}
                </button>
              </div>

              <div className="shrink-0">
                <ThemeSwitcher />
              </div>
            </div>
            
            {/* YENİLİK: MESAJLAR AÇILIR MENÜSÜ */}
            {messageMenuOpen && (
              <div ref={messageMenuRef} className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Son Mesajlar</div>
                  <button onClick={() => setCurrentScreen("messages")} className="text-xs text-[#0099CB] hover:underline">Tümünü Gör</button>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {messageItems.filter(c => c.messages.length > 0).map(convo => {
                     const lastMessage = convo.messages[convo.messages.length-1];
                     const unreadCount = convo.messages.filter(m => !m.read && m.senderId !== 'you').length;
                     // TODO: `repsMap` kullanarak `participantB`'nin adını alın
                     const participantName = `Rep ${convo.participantB}`;
                     return (
                        <div key={convo.participantB} onClick={() => { setCurrentScreen("messages"); setMessageMenuOpen(false); }} className={`px-4 py-3 border-b dark:border-gray-700 last:border-b-0 cursor-pointer ${ unreadCount > 0 ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                            <div className="flex items-center justify-between">
                                <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{participantName}</div>
                                <div className="text-xs text-gray-500">{new Date(lastMessage.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{lastMessage.text}</p>
                        </div>
                     )
                  })}
                </div>
              </div>
            )}

            {/* BİLDİRİM AÇILIR MENÜSÜ */}
            {notifOpen && (
              <div ref={notifMenuRef} className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700">
                {/* ... bildirim menüsü içeriği ... */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;