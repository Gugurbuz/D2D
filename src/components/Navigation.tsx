import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Home,
  Route,
  List,
  BarChart3,
  UserCheck,
  Users,
  MapPin,
  Bell,
  BellDot,
  MessageSquare,
  ScanLine,
  Settings,
  Shield,
} from "lucide-react";
import { Role, Screen } from "../types";
import { mockConversations } from "../data/messages";
import { teamReps } from "../data/team";
import {
  AppNotification,
  mockNotifications as defaultNotifications,
} from "../data/notifications";

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
  const [notifItems, setNotifItems] =
    useState<AppNotification[]>(defaultNotifications);
  const notifUnread = notifItems.filter((n) => n?.unread).length;

  const [messageMenuOpen, setMessageMenuOpen] = useState(false);
  const messageUnreadCount = mockConversations.reduce(
    (total, conversation) => {
      const msgs = Array.isArray(conversation?.messages)
        ? conversation.messages
        : [];
      return (
        total +
        msgs.filter((msg) => msg?.senderId !== "you" && !msg?.read).length
      );
    },
    0
  );

  const repsMap = useMemo(
    () => new Map(teamReps.map((rep) => [rep.id, rep])),
    []
  );
  const notifAnchorRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  const messageAnchorRef = useRef<HTMLButtonElement | null>(null);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        notifAnchorRef.current &&
        !notifAnchorRef.current.contains(t) &&
        notifMenuRef.current &&
        !notifMenuRef.current.contains(t)
      ) {
        setNotifOpen(false);
      }
      if (
        messageAnchorRef.current &&
        !messageAnchorRef.current.contains(t) &&
        messageMenuRef.current &&
        !messageMenuRef.current.contains(t)
      ) {
        setMessageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const avatarSrc =
    agentAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      agentName || "Kullanıcı"
    )}&background=0099CB&color=fff`;

  const onProfileClick = () => {
    setMessageMenuOpen(false);
    setNotifOpen(false);
    setCurrentScreen("profile");
  };

  const Btn = ({
    onClick,
    active,
    children,
    label,
    refProp,
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
      className={`relative shrink-0 px-3 sm:px-4 py-2 rounded-lg transition-colors text-gray-600 flex items-center gap-2 ${
        active ? "bg-[#F9C800] text-gray-900" : "hover:bg-gray-100"
      }`}
      title={label}
      aria-label={label}
    >
      {children}
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200 px-3 sm:px-6">
      <div className="flex items-center justify-between h-16">
        {/* Profil Alanı */}
        <div
          className={`flex items-center gap-3 min-w-0 cursor-pointer rounded-lg p-1 -ml-1 ${
            currentScreen === "profile"
              ? "ring-2 ring-[#0099CB] ring-offset-2"
              : "hover:bg-gray-100"
          }`}
          onClick={onProfileClick}
          role="button"
          tabIndex={0}
          title="Profilim"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 shrink-0">
            <img
              src={avatarSrc}
              alt={agentName || "Kullanıcı"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="truncate hidden md:block">
            <h2 className="font-semibold text-gray-900 truncate">
              {agentName || "Kullanıcı"}
            </h2>
            <p className="text-sm text-gray-600 truncate">
              {role === "manager"
                ? "Saha Yöneticisi"
                : role === "sales_rep"
                ? "Saha Temsilcisi"
                : role === "admin"
                ? "Admin"
                : "Operasyon Yöneticisi"}
            </p>
          </div>
        </div>

        {/* Menü Butonları */}
        <div className="relative flex-1 flex items-center justify-end">
          <div className="flex flex-nowrap items-center gap-1 sm:gap-2 overflow-x-auto max-w-full no-scrollbar pb-1">
            {/* Ortak Dashboard */}
            <Btn
              onClick={() => setCurrentScreen("dashboard")}
              active={currentScreen === "dashboard"}
              label="Dashboard"
            >
              <Home className="w-5 h-5" />
            </Btn>

            {/* Sales Rep */}
            {role === "sales_rep" && (
              <>
                <Btn
                  onClick={() => setCurrentScreen("route")}
                  active={currentScreen === "route"}
                  label="Rota Haritası"
                >
                  <Route className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("visits")}
                  active={currentScreen === "visits"}
                  label="Ziyaret Listesi"
                >
                  <List className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("invoiceOcr")}
                  active={currentScreen === "invoiceOcr"}
                  label="Bölge Dışı Ziyaret"
                >
                  <MapPinOff  className="w-5 h-5" />
                </Btn>
              </>
            )}

            {/* Manager */}
            {role === "manager" && (
              <>
                <Btn
                  onClick={() => setCurrentScreen("reports")}
                  active={currentScreen === "reports"}
                  label="Raporlar"
                >
                  <BarChart3 className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("assignments")}
                  active={currentScreen === "assignments"}
                  label="Görev Atama"
                >
                  <UserCheck className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("team")}
                  active={currentScreen === "team"}
                  label="Ekip Haritası"
                >
                  <Users className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("invoiceOcr")}
                  active={currentScreen === "invoiceOcr"}
                  label="Bölgedışı Ziyaret"
                >
                  <MapPinOff  className="w-5 h-5" />
                </Btn>
              </>
            )}

            {/* Admin */}
            {role === "admin" && (
              <>
                <Btn
                  onClick={() => setCurrentScreen("reports")}
                  active={currentScreen === "reports"}
                  label="Raporlar"
                >
                  <BarChart3 className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("systemReports")}
                  active={currentScreen === "systemReports"}
                  label="Sistem Raporları"
                >
                  <BarChart3 className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("userManagement")}
                  active={currentScreen === "userManagement"}
                  label="Kullanıcı Yönetimi"
                >
                  <Shield className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("systemSettings")}
                  active={currentScreen === "systemSettings"}
                  label="Sistem Ayarları"
                >
                  <Settings className="w-5 h-5" />
                </Btn>
              </>
            )}

            {/* Operasyon Yöneticisi */}
            {role === "operations_manager" && (
              <>
                <Btn
                  onClick={() => setCurrentScreen("reports")}
                  active={currentScreen === "reports"}
                  label="Raporlar"
                >
                  <BarChart3 className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("tariffs")}
                  active={currentScreen === "tariffs"}
                  label="Tarifeler"
                >
                  <List className="w-5 h-5" />
                </Btn>
                <Btn
                  onClick={() => setCurrentScreen("fieldOpsMap")}
                  active={currentScreen === "fieldOpsMap"}
                  label="Saha Haritası"
                >
                  <MapPin className="w-5 h-5" />
                </Btn>
              </>
            )}

            {/* Mesajlar */}
            <Btn
              onClick={() => {
                setNotifOpen(false);
                setMessageMenuOpen((o) => !o);
              }}
              active={currentScreen === "messages"}
              label="Mesajlar"
              refProp={messageAnchorRef}
            >
              <MessageSquare className="w-5 h-5" />
              {messageUnreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Btn>

            {/* Bildirimler */}
            <div className="relative shrink-0" ref={notifAnchorRef}>
              <button
                type="button"
                onClick={() => {
                  setMessageMenuOpen(false);
                  setNotifOpen((o) => !o);
                }}
                className="px-3 py-2 rounded-lg relative text-gray-600 hover:bg-gray-100"
                title="Bildirimler"
                aria-expanded={notifOpen}
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

              {/* Bildirim popup menüsü */}
              {notifOpen && (
                <div
                  ref={notifMenuRef}
                  className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg animate-fade-in-down"
                >
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="font-semibold text-gray-900">Bildirimler</div>
                    <button
                      onClick={() =>
                        setNotifItems((prev) =>
                          prev.map((n) => ({ ...n, unread: false }))
                        )
                      }
                      className="text-xs text-[#0099CB] hover:underline"
                    >
                      Tümünü okundu işaretle
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-auto">
                    {notifItems.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500 text-center">
                        Bildirim yok
                      </div>
                    ) : (
                      notifItems.map((n) => (
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;  
