import React, { useState, useRef, useEffect } from 'react';
import { Hop as Home, Route, List, ChartBar as BarChart3, UserCheck, Users, MapPin, Bell, BellDot, MessageSquare, MapPinPlus, Settings, Shield } from 'lucide-react';
import { Role, Screen } from '../../../shared/types';
import { BRAND_COLORS } from '../../../styles/theme';
import { useNotifications } from './hooks/useNotifications';
import { useMessages } from '../../messages/hooks/useMessages';
import NotificationDropdown from './NotificationDropdown';
import MessageDropdown from './MessageDropdown';

interface NavigationBarProps {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  agentAvatarUrl?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  agentName,
  role,
  currentScreen,
  setCurrentScreen,
  agentAvatarUrl,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [messageMenuOpen, setMessageMenuOpen] = useState(false);
  
  const { notifications, unreadCount: notifUnread } = useNotifications();
  const { conversations, unreadCount: messageUnread } = useMessages();

  const notifAnchorRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  const messageAnchorRef = useRef<HTMLButtonElement | null>(null);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notifAnchorRef.current &&
        !notifAnchorRef.current.contains(target) &&
        notifMenuRef.current &&
        !notifMenuRef.current.contains(target)
      ) {
        setNotifOpen(false);
      }

      if (
        messageAnchorRef.current &&
        !messageAnchorRef.current.contains(target) &&
        messageMenuRef.current &&
        !messageMenuRef.current.contains(target)
      ) {
        setMessageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarSrc = agentAvatarUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName)}&background=0099CB&color=fff`;

  const getNavigationItems = () => {
    const commonItems = [
      { key: 'dashboard', icon: Home, label: 'Dashboard' },
    ];

    const roleSpecificItems: Record<Role, any[]> = {
      sales_rep: [
        { key: 'route', icon: Route, label: 'Rota Haritası' },
        { key: 'visits', icon: List, label: 'Ziyaret Listesi' },
        { key: 'invoiceOcr', icon: MapPinPlus, label: 'Bölge Dışı Ziyaret' },
      ],
      manager: [
        { key: 'reports', icon: BarChart3, label: 'Raporlar' },
        { key: 'assignments', icon: UserCheck, label: 'Görev Atama' },
        { key: 'team', icon: Users, label: 'Ekip Haritası' },
        { key: 'invoiceOcr', icon: MapPinPlus, label: 'Bölgedışı Ziyaret' },
      ],
      admin: [
        { key: 'systemReports', icon: BarChart3, label: 'Sistem Raporları' },
        { key: 'userManagement', icon: Shield, label: 'Kullanıcı Yönetimi' },
        { key: 'systemManagement', icon: Settings, label: 'Sistem Yönetimi' },
      ],
      operations_manager: [
        { key: 'reports', icon: BarChart3, label: 'Raporlar' },
        { key: 'tariffs', icon: List, label: 'Tarifeler' },
        { key: 'fieldOpsMap', icon: MapPin, label: 'Saha Haritası' },
      ],
    };

    return [...commonItems, ...roleSpecificItems[role]];
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6">
      <div className="flex items-center justify-between h-16">
        {/* Profile Section */}
        <div
          className={`flex items-center gap-3 min-w-0 cursor-pointer rounded-lg p-1 -ml-1 transition-all duration-200 ${
            currentScreen === 'profile'
              ? 'ring-2 ring-[#002D72] ring-offset-2'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setCurrentScreen('profile')}
          role="button"
          tabIndex={0}
          title="Profilim"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 shrink-0">
            <img
              src={avatarSrc}
              alt={agentName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="truncate hidden md:block">
            <h2 className="font-semibold text-gray-900 truncate">{agentName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {role === 'manager' ? 'Saha Yöneticisi' :
               role === 'sales_rep' ? 'Saha Temsilcisi' :
               role === 'admin' ? 'Admin' : 'Operasyon Yöneticisi'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="relative flex-1 flex items-center justify-end">
          <div className="flex flex-nowrap items-center gap-1 sm:gap-2 overflow-x-auto max-w-full no-scrollbar pb-1">
            {navigationItems.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setCurrentScreen(key as Screen)}
                className={`relative shrink-0 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300 flex items-center gap-2 ${
                  currentScreen === key
                    ? 'bg-[#F9C800] text-[#002D72] shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={label}
                aria-label={label}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}

            {/* Messages */}
            <button
              ref={messageAnchorRef}
              onClick={() => {
                setNotifOpen(false);
                setMessageMenuOpen(prev => !prev);
              }}
              className={`relative shrink-0 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300 flex items-center gap-2 ${
                currentScreen === 'messages'
                  ? 'bg-[#F9C800] text-[#002D72] shadow-sm'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Mesajlar"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="hidden md:inline">Mesajlar</span>
              {messageUnread > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>

            {/* Notifications */}
            <div className="relative shrink-0" ref={notifAnchorRef}>
              <button
                onClick={() => {
                  setMessageMenuOpen(false);
                  setNotifOpen(prev => !prev);
                }}
                className="px-3 py-2 rounded-lg relative text-gray-600 hover:bg-gray-100"
                title="Bildirimler"
              >
                {notifUnread > 0 ? (
                  <BellDot className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
                {notifUnread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">
                    {notifUnread}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={notifOpen}
                notifications={notifications}
                onClose={() => setNotifOpen(false)}
                menuRef={notifMenuRef}
              />
            </div>
          </div>

          <MessageDropdown
            isOpen={messageMenuOpen}
            conversations={conversations}
            onClose={() => setMessageMenuOpen(false)}
            onNavigateToMessages={() => {
              setCurrentScreen('messages');
              setMessageMenuOpen(false);
            }}
            menuRef={messageMenuRef}
          />
        </div>
      </div>
    </header>
  );
};

export default NavigationBar;