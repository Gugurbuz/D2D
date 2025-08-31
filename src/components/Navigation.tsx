// import'lar aynı

const Navigation: React.FC<Props> = ({ agentName, role, currentScreen, setCurrentScreen, agentAvatarUrl }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(mockNotifications);
  const unread = items.filter(n => n.unread).length;

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      // buton + menü dışına tıklandıysa kapat
      if (
        anchorRef.current &&
        !anchorRef.current.contains(t) &&
        menuRef.current &&
        !menuRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, unread: false })));

  const avatarSrc =
    agentAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName || "Kullanıcı")}&background=0099CB&color=fff`;

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Sol: kullanıcı */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white bg-gray-200 shrink-0">
            <img src={avatarSrc} alt={agentName || "Kullanıcı"} className="w-full h-full object-cover" />
          </div>
          <div className="truncate">
            <h2 className="font-semibold text-gray-900 truncate">{agentName || "Kullanıcı"}</h2>
            <p className="text-sm text-gray-600 truncate">{role === "manager" ? "Saha Yöneticisi" : "Saha Temsilcisi"}</p>
          </div>
        </div>

        {/* Sağ: butonlar */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {/* ... diğer ekran butonların aynı ... */}

          {/* Bildirimler */}
          <div className="relative" ref={anchorRef}>
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100 relative"
              title="Bildirimler"
              aria-label="Bildirimler"
              aria-expanded={open}
            >
              {unread > 0 ? <BellDot className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center px-1">
                  {unread}
                </span>
              )}
            </button>
          </div>

          {/* DROPDOWN (fixed + yüksek z-index) */}
          {open && (
            <div
              ref={menuRef}
              className="fixed right-3 top-16 z-[9999] w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg"
              role="dialog"
              aria-label="Bildirimler listesi"
            >
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="font-semibold text-gray-900">Bildirimler</div>
                <button onClick={markAllRead} className="text-xs text-[#0099CB] hover:underline">
                  Tümünü okundu işaretle
                </button>
              </div>
              <div className="max-h-[300px] overflow-auto">
                {items.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500 text-center">Bildirim yok</div>
                ) : (
                  items.map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 ${n.unread ? "bg-[#0099CB]/5" : ""}`}>
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 inline-block w-2 h-2 rounded-full ${
                            n.type === "assignment" ? "bg-amber-500" : n.type === "visit" ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{n.title}</div>
                          {n.desc && <div className="text-xs text-gray-600 truncate">{n.desc}</div>}
                          <div className="text-[11px] text-gray-500 mt-0.5">{n.timeAgo}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* /DROPDOWN */}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
