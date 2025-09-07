import React, { useState, useEffect } from "react";
import { User, CheckCircle2, LogOut, Pencil, X, FileEdit } from "lucide-react";

// ===== Types =====
export type Role = "sales" | "manager";
export type Notifications = { email: boolean; sms: boolean; push: boolean };
export type WorkDays = { mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean };

export type BaseUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  district?: string;
  region?: string;
  avatarUrl?: string;
  language?: "tr" | "en";
  units?: "metric" | "imperial";
  theme?: "system" | "light" | "dark";
  notifications?: Notifications;
  shareLiveLocation?: boolean;
};

export type SalesUser = BaseUser & {
  role: "sales";
  dailyVisitTarget?: number;
  vehicle?: "walking" | "bike" | "car";
  workHours?: { start: string; end: string };
  workDays?: WorkDays;
  breakTimes?: { start: string; end: string };
  defaultMapZoom?: number;
  autoCheckinRadiusMeters?: number;
  idVerified?: boolean;
  prefersOptimizedRoutes?: boolean;
};

export type ManagerUser = BaseUser & {
  role: "manager";
  teamName?: string;
  teamSize?: number;
  territory?: string;
  autoAssignMethod?: "equal_count" | "km_optimized";
  preventOverlap?: boolean;
  maxAutoAssignPerRep?: number;
  slaDailyVisitTarget?: number;
  coverageGoalPct?: number;
  exportFormat?: "xlsx" | "csv" | "pdf";
  reportTime?: string;
};

// ===== Mock Data =====
const defaultBase: BaseUser = { id: "", name: "", email: "", avatarUrl: "", language: "tr", units: "metric", theme: "system", notifications: { email: true, sms: false, push: true }, shareLiveLocation: false };
const defaultSales: SalesUser = { ...defaultBase, id: "u1", role: "sales", name: "Mehmet Yılmaz", email: "mehmet.yilmaz@example.com", avatarUrl: "https://avatar.iran.liara.run/public/boy", phone: "+90 555 111 22 33", district: "Kadıköy", region: "İstanbul Anadolu", dailyVisitTarget: 20, vehicle: "car", workHours: { start: "09:00", end: "18:00" }, workDays: { mon:true, tue:true, wed:true, thu:true, fri:true, sat:false, sun:false }, breakTimes: { start: "12:30", end: "13:30" }, defaultMapZoom: 13, autoCheckinRadiusMeters: 100, idVerified: false, prefersOptimizedRoutes: true };
const defaultManager: ManagerUser = { ...defaultBase, id: "m1", role: "manager", name: "Ayşe Demir", email: "ayse.demir@example.com", avatarUrl: "https://avatar.iran.liara.run/public/girl", phone: "+90 555 444 55 66", region: "İstanbul Anadolu", territory: "Anadolu 1. Bölge", teamName: "Kadıköy Ekip", teamSize: 8, autoAssignMethod: "km_optimized", preventOverlap: true, maxAutoAssignPerRep: 60, slaDailyVisitTarget: 18, coverageGoalPct: 80, exportFormat: "xlsx", reportTime: "18:00" };

const AVATAR_OPTIONS = [
    "https://avatar.iran.liara.run/public/1",
    "https://avatar.iran.liara.run/public/2",
    "https://avatar.iran.liara.run/public/3",
    "https://avatar.iran.liara.run/public/4",
    "https://avatar.iran.liara.run/public/5",
    "https://avatar.iran.liara.run/public/6",
];

// ===== UI Atoms =====

const AvatarSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative rounded-xl bg-white p-6 shadow-lg w-full max-w-md transition-transform duration-300 scale-95 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Avatar Seç</h3>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X className="h-5 w-5" />
        </button>
        <div className="grid grid-cols-3 gap-4">
          {AVATAR_OPTIONS.map((url) => (
            <button
              key={url}
              onClick={() => handleSelect(url)}
              className="rounded-full overflow-hidden border-2 border-transparent hover:border-[#0099CB] focus:border-[#0099CB] focus:outline-none transition-all duration-200"
            >
              <img src={url} alt="Avatar Seçeneği" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">Gelecekte kendi resminizi yükleyebileceksiniz.</p>
      </div>
    </div>
  );
};

const Toast: React.FC<{ message: string; show: boolean; onDismiss: () => void }> = ({ message, show, onDismiss }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onDismiss(), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  return (
    <div
      className={`fixed top-5 right-5 z-50 rounded-lg bg-green-600 text-white px-4 py-3 shadow-lg transition-transform duration-300 ease-in-out ${
        show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      {message}
    </div>
  );
};

const FieldRow: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <div className="mb-1 text-xs font-medium text-gray-600">{label}</div>
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={
      "w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 text-sm outline-none " +
      "focus:border-[#0099CB] focus:ring-2 focus:ring-[rgba(0,153,203,0.2)] " +
      "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 " +
      "transition-colors duration-200 " +
      (props.className ?? "")
    }
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={
      "w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm outline-none " +
      "focus:border-[#0099CB] focus:ring-2 focus:ring-[rgba(0,153,203,0.2)] " +
      "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 " +
      "transition-colors duration-200 " +
      (props.className ?? "")
    }
  />
);

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; id?: string, disabled?: boolean }> = ({ checked, onChange, id, disabled }) => (
  <button
    id={id}
    type="button"
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-[#0099CB]" : "bg-gray-300"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    aria-pressed={checked}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"}`} />
  </button>
);

const FooterBar: React.FC<{
  onSave: () => void;
  onCancel: () => void;
  onLogout: () => void;
  saving?: boolean;
  isSaveDisabled?: boolean;
  isEditing: boolean;
}> = ({ onSave, onCancel, onLogout, saving, isSaveDisabled, isEditing }) => (
  <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white">
    <div className="container mx-auto flex items-center justify-between gap-3 p-3">
      <div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>

      {isEditing && (
        <div className="flex items-center gap-3">
          <button onClick={onCancel} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            İptal
          </button>
          <button
            onClick={onSave}
            disabled={isSaveDisabled || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0099CB] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" /> {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      )}
    </div>
  </div>
);

const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
    <div className="text-sm font-semibold text-gray-900">{title}</div>
    {children}
  </div>
);

const SideNav: React.FC<{
  items: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}> = ({ items, active, onChange }) => {
  return (
    <aside className="md:w-56 w-full">
      <nav className="rounded-xl border border-gray-200 bg-white p-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm mb-1 border transition-colors duration-200 ${
              active === it.key
                ? "border-[#0099CB] text-black bg-[#F9C800]"
                : "border-transparent text-gray-700 hover:bg-gray-50"
            }`}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

const ToggleLine: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; compact?: boolean; disabled?: boolean; }> = ({ label, checked, onChange, hint, compact, disabled }) => (
    <div className={`flex items-center justify-between ${compact ? "" : "rounded-lg border border-gray-200 p-3"}`}>
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
);

// ===== Sales Profile =====
export const SalesProfile: React.FC<{ user?: Partial<SalesUser> }> = ({ user }) => {
  const [initialForm, setInitialForm] = useState<SalesUser>({ ...defaultSales, ...(user as SalesUser) });
  const [form, setForm] = useState<SalesUser>(initialForm);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [tab, setTab] = useState<string>("personal");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    setIsDirty(JSON.stringify(form) !== JSON.stringify(initialForm));
  }, [form, initialForm]);
  
  const set = <K extends keyof SalesUser>(k: K, v: SalesUser[K]) => setForm((f) => ({ ...f, [k]: v }));
  
  const handleSave = () => {
    setSaving(true);
    console.log("Saving sales data:", form);
    setTimeout(() => {
      setInitialForm(form);
      setSaving(false);
      setIsEditing(false);
      setToast({ show: true, message: "Profil başarıyla güncellendi!" });
    }, 1000);
  };
  
  const handleCancel = () => {
    setForm(initialForm);
    setIsEditing(false);
  };
  
  const handleLogout = () => {
    console.log("Çıkış yapılıyor... (Yönlendirme bu ortamda devre dışı bırakıldı)");
  };

  const setWorkHours = (part: "start" | "end", value: string) => {
    const current = form.workHours ?? { start: "09:00", end: "18:00" };
    set("workHours", { ...current, [part]: value });
  };
  const setBreakTimes = (part: "start" | "end", value: string) => {
    const current = form.breakTimes ?? { start: "12:30", end: "13:30" };
    set("breakTimes", { ...current, [part]: value });
  };
  const handleNotificationChange = (key: keyof Notifications, value: boolean) => {
    const current = form.notifications ?? defaultBase.notifications;
    set("notifications", { ...current!, [key]: value });
  };
  const toggleDay = (key: keyof WorkDays) => {
    const current = form.workDays ?? defaultSales.workDays;
    set("workDays", { ...current!, [key]: !current![key] });
  };

  const items = [
    { key: "personal", label: "Kişisel Bilgiler" },
    { key: "work", label: "Çalışma & Zaman" },
    { key: "map", label: "Saha & Harita" },
    { key: "prefs", label: "Uygulama Tercihleri" },
    { key: "notifs", label: "Bildirimler" },
    { key: "privacy", label: "Gizlilik & Güvenlik" },
  ];
  
  const avatarSrc = form.avatarUrl || "https://avatar.iran.liara.run/public";

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 pb-24">
      <AvatarSelectionModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onSelect={(url) => set("avatarUrl", url)} />
      <Toast message={toast.message} show={toast.show} onDismiss={() => setToast({ ...toast, show: false })} />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
            <div className="relative">
                <img src={avatarSrc} alt="Profil Resmi" className="rounded-full w-12 h-12 object-cover" />
                {isEditing && (
                    <button 
                      onClick={() => setIsAvatarModalOpen(true)} 
                      className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                      aria-label="Profil resmini değiştir"
                    >
                        <Pencil className="h-3 w-3 text-gray-600" />
                    </button>
                )}
            </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Profilim — Satış Uzmanı</h2>
            <p className="text-xs text-gray-500">{isEditing ? "Profil bilgilerinizi güncelleyebilirsiniz." : "Bilgileri değiştirmek için Düzenle'ye tıkla."}</p>
          </div>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <FileEdit className="h-4 w-4" />
            Düzenle
          </button>
        )}
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-[14rem_1fr]">
        <SideNav items={items} active={tab} onChange={setTab} />
        <main>
          {tab === "personal" && (
            <Section title="Kişisel Bilgiler">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Ad Soyad"><Input disabled={!isEditing} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Adınız Soyadınız" /></FieldRow>
                <FieldRow label="E-posta"><Input disabled={!isEditing} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ornek@firma.com" /></FieldRow>
                <FieldRow label="Telefon"><Input disabled={!isEditing} value={form.phone ?? ''} onChange={(e) => set("phone", e.target.value)} placeholder="+90..." /></FieldRow>
                <FieldRow label="Bölge"><Input disabled={!isEditing} value={form.region ?? ''} onChange={(e) => set("region", e.target.value)} placeholder="İstanbul Anadolu" /></FieldRow>
                <FieldRow label="İlçe"><Input disabled={!isEditing} value={form.district ?? ''} onChange={(e) => set("district", e.target.value)} placeholder="Kadıköy" /></FieldRow>
              </div>
            </Section>
          )}
        {tab === "work" && (
            <Section title="Çalışma & Zaman">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Başlangıç Saati"><Input disabled={!isEditing} type="time" value={form.workHours?.start} onChange={(e) => setWorkHours("start", e.target.value)} /></FieldRow>
                <FieldRow label="Bitiş Saati"><Input disabled={!isEditing} type="time" value={form.workHours?.end} onChange={(e) => setWorkHours("end", e.target.value)} /></FieldRow>
                <FieldRow label="Öğle Arası Başlangıç"><Input disabled={!isEditing} type="time" value={form.breakTimes?.start} onChange={(e) => setBreakTimes("start", e.target.value)} /></FieldRow>
                <FieldRow label="Öğle Arası Bitiş"><Input disabled={!isEditing} type="time" value={form.breakTimes?.end} onChange={(e) => setBreakTimes("end", e.target.value)} /></FieldRow>
              </div>
              <div className="mt-3">
                <div className="mb-1 text-xs font-medium text-gray-600">Çalışma Günleri</div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {[{ k: "mon", t: "Pzt" }, { k: "tue", t: "Sal" }, { k: "wed", t: "Çar" }, { k: "thu", t: "Per" }, { k: "fri", t: "Cum" }, { k: "sat", t: "Cts" }, { k: "sun", t: "Paz" }].map((d) => (
                    <button key={d.k} type="button" onClick={() => toggleDay(d.k as keyof WorkDays)} disabled={!isEditing}
                      className={`rounded-lg border px-3 py-1 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${form.workDays?.[d.k as keyof WorkDays] ? "border-[#0099CB] text-[#0099CB] bg-blue-50" : "border-gray-300 text-gray-600"}`}
                    >{d.t}</button>
                  ))}
                </div>
              </div>
            </Section>
          )}
          {tab === "map" && (
            <Section title="Saha & Harita">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Araç"><Select disabled={!isEditing} value={form.vehicle} onChange={(e) => set("vehicle", e.target.value as any)}><option value="walking">Yaya</option><option value="bike">Bisiklet</option><option value="car">Otomobil</option></Select></FieldRow>
                <FieldRow label="Varsayılan Harita Yakınlığı (8-18)"><Input disabled={!isEditing} type="number" min={8} max={18} value={form.defaultMapZoom ?? 13} onChange={(e) => set("defaultMapZoom", Number(e.target.value))} /></FieldRow>
                <FieldRow label="Otomatik Check-in Çapı (metre)"><Input disabled={!isEditing} type="number" min={50} max={500} step={10} value={form.autoCheckinRadiusMeters ?? 100} onChange={(e) => set("autoCheckinRadiusMeters", Number(e.target.value))} /></FieldRow>
                <FieldRow label="Günlük Ziyaret Hedefi"><Input disabled={!isEditing} type="number" min={0} value={form.dailyVisitTarget ?? 0} onChange={(e) => set("dailyVisitTarget", Number(e.target.value))} /></FieldRow>
                <div className="md:col-span-2">
                  <ToggleLine label="Rota Optimizasyonu" checked={!!form.prefersOptimizedRoutes} onChange={(v) => set("prefersOptimizedRoutes", v)} hint="En kısa mesafeye öncelik" disabled={!isEditing} />
                </div>
              </div>
            </Section>
          )}
          {tab === "prefs" && (
            <Section title="Uygulama Tercihleri">
              <div className="grid gap-4 md:grid-cols-3">
                <FieldRow label="Dil"><Select disabled={!isEditing} value={form.language} onChange={(e) => set("language", e.target.value as any)}><option value="tr">Türkçe</option><option value="en">English</option></Select></FieldRow>
                <FieldRow label="Birim"><Select disabled={!isEditing} value={form.units} onChange={(e) => set("units", e.target.value as any)}><option value="metric">Metrik (km, °C)</option><option value="imperial">Imperial (mi, °F)</option></Select></FieldRow>
                <FieldRow label="Tema"><Select disabled={!isEditing} value={form.theme} onChange={(e) => set("theme", e.target.value as any)}><option value="system">Sistem</option><option value="light">Açık</option><option value="dark">Koyu</option></Select></FieldRow>
              </div>
            </Section>
          )}
          {tab === "notifs" && (
            <Section title="Bildirimler">
              <div className="grid gap-3 md:grid-cols-3">
                <ToggleLine label="E-posta" checked={!!form.notifications?.email} onChange={(v) => handleNotificationChange('email', v)} compact disabled={!isEditing} />
                <ToggleLine label="SMS" checked={!!form.notifications?.sms} onChange={(v) => handleNotificationChange('sms', v)} compact disabled={!isEditing} />
                <ToggleLine label="Push" checked={!!form.notifications?.push} onChange={(v) => handleNotificationChange('push', v)} compact disabled={!isEditing} />
              </div>
            </Section>
          )}
          {tab === "privacy" && (
            <Section title="Gizlilik & Güvenlik">
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleLine label="Canlı Konumu Paylaş" checked={!!form.shareLiveLocation} onChange={(v) => set("shareLiveLocation", v)} disabled={!isEditing} />
                <ToggleLine label="Kimlik Doğrulandı (Test)" checked={!!form.idVerified} onChange={(v) => set("idVerified", v)} hint="Tiki açınca kimlik okundu say" disabled={!isEditing} />
              </div>
              <div className="mt-4">
                <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200" disabled={!isEditing}>Şifreyi Değiştir</button>
              </div>
            </Section>
          )}
        </main>
      </div>
      <FooterBar
        onSave={handleSave}
        onLogout={handleLogout}
        onCancel={handleCancel}
        isSaveDisabled={!isDirty}
        saving={saving}
        isEditing={isEditing}
      />
    </div>
  );
};

// ===== Manager Profile (Aynı iyileştirmeler uygulandı) =====
export const ManagerProfile: React.FC<{ user?: Partial<ManagerUser> }> = ({ user }) => {
  const [initialForm, setInitialForm] = useState<ManagerUser>({ ...defaultManager, ...(user as ManagerUser) });
  const [form, setForm] = useState<ManagerUser>(initialForm);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [tab, setTab] = useState<string>("personal");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setIsDirty(JSON.stringify(form) !== JSON.stringify(initialForm));
  }, [form, initialForm]);
  
  const set = <K extends keyof ManagerUser>(k: K, v: ManagerUser[K]) => setForm((f) => ({ ...f, [k]: v }));
  
  const handleSave = () => {
    setSaving(true);
    console.log("Saving manager data:", form);
    setTimeout(() => {
      setInitialForm(form);
      setSaving(false);
      setIsEditing(false);
      setToast({ show: true, message: "Profil başarıyla güncellendi!" });
    }, 1000);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setIsEditing(false);
  };

  const handleLogout = () => {
    console.log("Çıkış yapılıyor... (Yönlendirme bu ortamda devre dışı bırakıldı)");
  };

  const handleNotificationChange = (key: keyof Notifications, value: boolean) => {
    const currentNotifications = form.notifications ?? defaultBase.notifications;
    set("notifications", { ...currentNotifications!, [key]: value, });
  };

  const items = [
    { key: "personal", label: "Kişisel Bilgiler" },
    { key: "assign", label: "Atama Politikaları" },
    { key: "team", label: "Ekip Hedefleri" },
    { key: "prefs", label: "Uygulama Tercihleri" },
    { key: "notifs", label: "Bildirimler" },
    { key: "reports", label: "Rapor & Dışa Aktarım" },
  ];

  const avatarSrc = form.avatarUrl || "https://avatar.iran.liara.run/public";

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 pb-24">
      <AvatarSelectionModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onSelect={(url) => set("avatarUrl", url)} />
      <Toast message={toast.message} show={toast.show} onDismiss={() => setToast({ ...toast, show: false })} />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
            <div className="relative">
                <img src={avatarSrc} alt="Profil Resmi" className="rounded-full w-12 h-12 object-cover" />
                {isEditing && (
                    <button 
                      onClick={() => setIsAvatarModalOpen(true)} 
                      className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                      aria-label="Profil resmini değiştir"
                    >
                        <Pencil className="h-3 w-3 text-gray-600" />
                    </button>
                )}
            </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Profilim — Saha Yöneticisi</h2>
            <p className="text-xs text-gray-500">{isEditing ? "Profil bilgilerinizi güncelleyebilirsiniz." : "Bilgileri değiştirmek için Düzenle'ye tıkla."}</p>
          </div>
        </div>
        {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 transition-colors"
            >
              <FileEdit className="h-4 w-4" />
              Düzenle
            </button>
        )}
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-[14rem_1fr]">
        <SideNav items={items} active={tab} onChange={setTab} />
        <main>
          {tab === "personal" && (
            <Section title="Kişisel Bilgiler">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Ad Soyad"><Input disabled={!isEditing} value={form.name} onChange={(e) => set("name", e.target.value)} /></FieldRow>
                <FieldRow label="E-posta"><Input disabled={!isEditing} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></FieldRow>
                <FieldRow label="Telefon"><Input disabled={!isEditing} value={form.phone ?? ''} onChange={(e) => set("phone", e.target.value)} /></FieldRow>
                <FieldRow label="Bölge"><Input disabled={!isEditing} value={form.region ?? ''} onChange={(e) => set("region", e.target.value)} placeholder="İstanbul Anadolu" /></FieldRow>
                <FieldRow label="Sorumlu Bölge"><Input disabled={!isEditing} value={form.territory ?? ''} onChange={(e) => set("territory", e.target.value)} placeholder="Anadolu 1. Bölge" /></FieldRow>
                <FieldRow label="Ekip Adı"><Input disabled={!isEditing} value={form.teamName ?? ''} onChange={(e) => set("teamName", e.target.value)} /></FieldRow>
                <FieldRow label="Ekip Büyüklüğü"><Input disabled={!isEditing} type="number" min={0} value={form.teamSize ?? 0} onChange={(e) => set("teamSize", Number(e.target.value))} /></FieldRow>
              </div>
            </Section>
          )}
          {tab === "assign" && (
            <Section title="Atama Politikaları">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Otomatik Atama Yöntemi"><Select disabled={!isEditing} value={form.autoAssignMethod} onChange={(e) => set("autoAssignMethod", e.target.value as any)}><option value="equal_count">Uzman başına eşit müşteri</option><option value="km_optimized">Toplam km en düşük</option></Select></FieldRow>
                <FieldRow label="Uzman Başına Üst Sınır"><Input disabled={!isEditing} type="number" min={0} value={form.maxAutoAssignPerRep ?? 0} onChange={(e) => set("maxAutoAssignPerRep", Number(e.target.value))} /></FieldRow>
                <div className="md:col-span-2">
                  <ToggleLine label="Bölgeler Kesişmesin" checked={!!form.preventOverlap} onChange={(v) => set("preventOverlap", v)} hint="Atanan poligonlar üst üste gelmesin" disabled={!isEditing} />
                </div>
              </div>
            </Section>
          )}
          
          {tab === "team" && ( 
            <Section title="Ekip Hedefleri">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Günlük Ziyaret Hedefi (SLA)"><Input disabled={!isEditing} type="number" min={0} value={form.slaDailyVisitTarget ?? 0} onChange={(e) => set("slaDailyVisitTarget", Number(e.target.value))} /></FieldRow>
                <FieldRow label="Kapsama Alanı Hedefi (%)"><Input disabled={!isEditing} type="number" min={0} max={100} value={form.coverageGoalPct ?? 0} onChange={(e) => set("coverageGoalPct", Number(e.target.value))} /></FieldRow>
              </div>
            </Section> 
          )}

          {tab === "prefs" && ( 
            <Section title="Uygulama Tercihleri">
              <div className="grid gap-4 md:grid-cols-3">
                <FieldRow label="Dil"><Select disabled={!isEditing} value={form.language} onChange={(e) => set("language", e.target.value as any)}><option value="tr">Türkçe</option><option value="en">English</option></Select></FieldRow>
                <FieldRow label="Birim"><Select disabled={!isEditing} value={form.units} onChange={(e) => set("units", e.target.value as any)}><option value="metric">Metrik (km, °C)</option><option value="imperial">Imperial (mi, °F)</option></Select></FieldRow>
                <FieldRow label="Tema"><Select disabled={!isEditing} value={form.theme} onChange={(e) => set("theme", e.target.value as any)}><option value="system">Sistem</option><option value="light">Açık</option><option value="dark">Koyu</option></Select></FieldRow>
              </div>
            </Section> 
          )}

          {tab === "notifs" && ( 
            <Section title="Bildirimler">
              <div className="grid gap-3 md:grid-cols-3">
                <ToggleLine label="E-posta" checked={!!form.notifications?.email} onChange={(v) => handleNotificationChange('email', v)} compact disabled={!isEditing} />
                <ToggleLine label="SMS" checked={!!form.notifications?.sms} onChange={(v) => handleNotificationChange('sms', v)} compact disabled={!isEditing} />
                <ToggleLine label="Push" checked={!!form.notifications?.push} onChange={(v) => handleNotificationChange('push', v)} compact disabled={!isEditing} />
              </div>
            </Section> 
          )}

          {tab === "reports" && ( 
            <Section title="Rapor & Dışa Aktarım">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Dışa Aktarma Formatı"><Select disabled={!isEditing} value={form.exportFormat} onChange={(e) => set("exportFormat", e.target.value as any)}><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option><option value="pdf">PDF (.pdf)</option></Select></FieldRow>
                <FieldRow label="Günlük Rapor Saati"><Input disabled={!isEditing} type="time" value={form.reportTime} onChange={(e) => set("reportTime", e.target.value)} /></FieldRow>
              </div>
            </Section> 
          )}
        </main>
      </div>

      <FooterBar
        onSave={handleSave}
        onLogout={handleLogout}
        onCancel={handleCancel}
        isSaveDisabled={!isDirty}
        saving={saving}
        isEditing={isEditing}
      />
    </div>
  );
};

// ===== Wrapper =====
const ProfileScreens: React.FC<{ role: Role; salesUser?: Partial<SalesUser>; managerUser?: Partial<ManagerUser> }> = ({ role, salesUser, managerUser }) => {
  return role === "sales" ? <SalesProfile user={salesUser} /> : <ManagerProfile user={managerUser} />;
};

export default ProfileScreens;

