import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { mockConversations } from '../data/messages';
import { teamReps } from '../data/team';
import { AppNotification, mockNotifications as defaultNotifications } from '../data/notifications';

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
  const notifUnread = notifItems.filter((n) => n?.unread).length;

  const [messageMenuOpen, setMessageMenuOpen] = useState(false);
  const messageUnreadCount = mockConversations.reduce((total, conversation) => {
    const msgs = Array.isArray(conversation?.messages) ? conversation.messages : [];
    return total + msgs.filter(msg => msg?.senderId !== 'you' && !msg?.read).length;
  }, 0);

  const repsMap = useMemo(() => new Map(teamReps.map(rep => [rep.id, rep])), []);
  const notifAnchorRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  const messageAnchorRef = useRef<HTMLButtonElement | null>(null);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);

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

  const markAllNotificationsRead = () => setNotifItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  const avatarSrc = agentAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName || "Kullanıcı")}&background=0099CB&color=fff`;

  const onProfileClick = () => {
    setMessageMenuOpen(false);
    setNotifOpen(false);
    setCurrentScreen('profile');
  };

  // DÜZELTME: Btn bileşeni güncellendi
  const Btn = ({ onClick, active, children, label, refProp }: { onClick: () => void; active: boolean; children: React.ReactNode; label: string; refProp?: React.Ref<HTMLButtonElement>; }) => (
    <button
      ref={refProp}
      onClick={onClick}
      // Butonun içindeki icon ve yazıyı yan yana getirmek için flex eklendi
      className={`relative shrink-0 px-3 sm:px-4 py-2 rounded-lg transition-colors text-gray-600 flex items-center gap-2 ${
        active ? "bg-[#F9C800] text-gray-900" : "hover:bg-gray-100"
      }`}
      title={label}
      aria-label={label}
    >
      {children}
      {/* Bu span, sadece orta (md) ve daha büyük ekranlarda görünecek */}
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200 px-3 sm:px-6">
      <div className="flex items-center justify-between h-16">
        <div
          className={`flex items-center gap-3 min-w-0 cursor-pointer rounded-lg p-1 -ml-1 ${
            currentScreen === 'profile'
              ? 'ring-2 ring-[#0099CB] ring-offset-2'
              : 'hover:bg-gray-100'
          }`}
          onClick={onProfileClick}
          role="button"
          tabIndex={0}
          title="Profilim"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 shrink-0">
            <img src={avatarSrc} alt={agentName || "Kullanıcı"} className="w-full h-full object-cover" />
          </div>
          <div className="truncate hidden md:block"> {/* Profil ismi de mobil ekranda gizlendi */}
            <h2 className="font-semibold text-gray-900 truncate">{agentName || "Kullanıcı"}</h2>
            <p className="text-sm text-gray-600 truncate">
              {role === "manager" ? "Saha Yöneticisi" : "Saha Temsilcisi"}
            </p>
          </div>
        </div>

        <div className="relative flex-1 flex items-center justify-end">
          <div className="flex flex-nowrap items-center gap-1 sm:gap-2 overflow-x-auto max-w-full no-scrollbar">
            <Btn onClick={() => setCurrentScreen("dashboard")} active={currentScreen === "dashboard"} label="Dashboard"><Home className="w-5 h-5" /></Btn>
            <Btn onClick={() => setCurrentScreen("routeMap")} active={currentScreen === "routeMap"} label="Rota Haritası"><Route className="w-5 h-5" /></Btn>
            <Btn onClick={() => setCurrentScreen("visitList")} active={currentScreen === "visitList"} label="Ziyaret Listesi"><List className="w-5 h-5" /></Btn>
            <Btn onClick={() => setCurrentScreen("reports")} active={currentScreen === "reports"} label="Raporlar"><BarChart3 className="w-5 h-5" /></Btn>
            {role === "manager" && (
              <>
                <Btn onClick={() => setCurrentScreen("assignment")} active={currentScreen === "assignment" || currentScreen === "assignmentMap"} label="Görev Atama"><UserCheck className="w-5 h-5" /></Btn>
                <Btn onClick={() => setCurrentScreen("teamMap")} active={currentScreen === "teamMap"} label="Ekip Haritası"><Users className="w-5 h-5" /></Btn>
              </>
            )}
            
            <Btn
              refProp={messageAnchorRef}
              onClick={() => setMessageMenuOpen((o) => !o)} 
              active={currentScreen === "messages"} 
              label="Mesajlar"
            >
              <MessageSquare className="w-5 h-5" />
              {messageUnreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3"> {/* Bildirim noktası ikon ve yazı varken daha iyi görünsün diye ayarlandı */}
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Btn>
            
            <div className="relative shrink-0">
              <button type="button" onClick={() => setNotifOpen((o) => !o)} className="px-3 py-2 rounded-lg relative text-gray-600 hover:bg-gray-100" title="Bildirimler" aria-expanded={notifOpen}>
                {notifUnread > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                {notifUnread > 0 && ( <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">{notifUnread}</span> )}
              </button>
            </div>
          </div>
          
          {messageMenuOpen && ( <div ref={messageMenuRef} className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg"> {/* ... Mesajlar Menüsü ... */} </div> )}
          {notifOpen && ( <div ref={notifMenuRef} className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg"> {/* ... Bildirimler Menüsü ... */} </div> )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;