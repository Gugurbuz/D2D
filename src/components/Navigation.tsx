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
              <Btn onClick