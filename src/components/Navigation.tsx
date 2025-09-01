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
import { mockConversations as convs } from '../data/messages';
import { AppNotification, mockNotifications as notifSeed } from '../data/notifications';


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
  // Güvenli başlangıç verileri
  const initialConversations = Array.isArray(convs) ? convs : [];
  const initialNotifs: AppNotification[] = Array.isArray(notifSeed) ? notifSeed : [];

  // Bildirimler
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<AppNotification[]>(initialNotifs);
  const notifUnread = Array.isArray(notifItems) ? notifItems.filter((n) => n?.unread).length : 0;

  // Mesajlar
  const [messageMenuOpen, setMessageMenuOpen] = useState(false);
  const [messageItems, setMessageItems] = useState(initialConversations);
  const messageUnreadCount = Array.isArray(messageItems)
    ? messageItems.reduce((total, conversation) => {
        const msgs = Array.isArray(conversation?.messages) ? conversation.messages : [];
        return total + msgs.filter(msg => msg?.senderId !== 'you' && !msg?.read).length;
      }, 0)
    : 0;

  // Refs
  const notifAnchorRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  const messageAnchorRef = useRef<HTMLButtonElement | null>(null);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);

  // Dışarı tıklayınca menüleri kapat
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifAnchorRef.current && !notifAnchorRef.current.contains(t) && notifMenuRef.current && !notifMenuRef.current.contains(t)) {
        setNotifOpen(false);
      }
      if (messageAnchorRef.current && !messageAnchorRef.current.contains(t) && messageMenuRef.current && !messageMenuRef.current.contains(t)) {
        setMessageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const markAllNotificationsRead = () =>
    setNotifItems((prev) => (Array.isArray(prev) ? prev.map((n) => ({ ...n, unread: false })) : []));

  const avatarSrc =
    agentAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName || "Kullanıcı")}&background=0099CB&color=fff`;

  const onProfileClick = () => {
    setMessageMenuOpen(false);
    setNotifOpen(false);
    setCurrentScreen('profile'); // types.ts içinde 'profile' olduğundan emin ol
  };

  const Btn = ({
    onClick, active, children, label, refProp,
  }: {
    onClick: () => void;
    active: boolean;
    children: React.ReactNode;
    label: string;
    refProp?: React.Ref<HTMLButtonElement>;
  }) => (
    <button
      ref={refProp}
      onClick={onClick}
      className={`relative shrink-0 px-3 sm:px-4 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 ${
        active ? "bg-[#F9C800] text-gray-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      title={label}
      aria-label={label}
      aria-pressed={active}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Sol: Profil (tıklanabilir) */}
          <div
            className={`flex items-center gap-3 min-w-0 cursor-pointer rounded-lg px-2 py-1 ${
              currentScreen === 'profile'
                ? 'ring-2 ring-[#0099CB] ring-offset-2 dark:ring-offset-gray-800'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={onProfileClick}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onProfileClick()}
            role="button"
            tabIndex={0}
            title="Profilim"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 shrink-0">
              <img src={avatarSrc} alt={agentName || "Kullanıcı"} className="w-full h-full object-cover" />
            </div>
            <div className="truncate">
              <h2 className="font-semibold text-gray-900 truncate dark:text-gray-100">{agentName || "Kullanıcı"}</h2>
              <p className="text-sm text-gray-600 truncate dark:text-gray-400">
                {role === "manager" ? "Saha Yöneticisi" : "Saha Temsilcisi"}
              </p>
            </div>
          </div>

          {/* Sağ: Araç Çubuğu */}
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

              {/* Mesajlar */}
              <Btn
                refProp={messageAnchorRef}
                onClick={() => setMessageMenuOpen((o) => !o)}
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
                  className="px-3 sm:px-4 py-2 rounded-lg relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Bildirimler"
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

              <div className="shrink-0">
           
              </div>
            </div>

            {/* Mesajlar açılır menüsü */}
            {messageMenuOpen && (
              <div
                ref={messageMenuRef}
                className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Son Mesajlar</div>
                  <button onClick={() => setCurrentScreen("messages")} className="text-xs text-[#0099CB] hover:underline">Tümünü Gör</button>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {(Array.isArray(messageItems) ? messageItems : []).filter(c => Array.isArray(c?.messages) && c.messages.length > 0).map(convo => {
                    const msgs = convo.messages!;
                    const lastMessage = msgs[msgs.length - 1];
                    const unreadCount = msgs.filter(m => !m?.read && m?.senderId !== 'you').length;
                    const participantName = `Rep ${convo.participantB}`;
                    return (
                      <div
                        key={convo.participantB}
                        onClick={() => { setCurrentScreen("messages"); setMessageMenuOpen(false); }}
                        className={`px-4 py-3 border-b dark:border-gray-700 last:border-b-0 cursor-pointer ${
                          unreadCount > 0 ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm text-gray-800 dark:text-gray-200">{participantName}</div>
                          <div className="text-xs text-gray-500">
                            {lastMessage?.timestamp ? new Date(lastMessage.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ""}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{lastMessage?.text || ""}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bildirim açılır menüsü */}
            {notifOpen && (
              <div
                ref={notifMenuRef}
                className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Bildirimler</div>
                  <button onClick={markAllNotificationsRead} className="text-xs text-[#0099CB] hover:underline">
                    Tümünü okundu işaretle
                  </button>
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {(Array.isArray(notifItems) ? notifItems : []).map((n, i) => (
                    <div key={i} className="px-4 py-3 border-b dark:border-gray-700 last:border-b-0">
                      <div className="text-sm text-gray-800 dark:text-gray-200">{n?.title || 'Bildirim'}</div>
                      {n?.body && <p className="text-xs text-gray-600 dark:text-gray-400">{n.body}</p>}
                    </div>
                  ))}
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
