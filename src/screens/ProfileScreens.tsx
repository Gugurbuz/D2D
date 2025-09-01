import React, { useState } from "react";
import { User, CheckCircle2 } from "lucide-react";

// ===== Types =====
export type Role = "sales" | "manager";

export type Notifications = { email: boolean; sms: boolean; push: boolean };
export type WorkDays = { mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean };

export type BaseUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  district?: string; // Kadıköy, Maltepe vb.
  region?: string;   // İstanbul Avrupa / Anadolu vb.
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
  defaultMapZoom?: number; // 8-18
  autoCheckinRadiusMeters?: number; // 50-500m
  idVerified?: boolean; // Test için "kimlik okundu" tiki
  prefersOptimizedRoutes?: boolean;
};

export type ManagerUser = BaseUser & {
  role: "manager";
  teamName?: string;
  teamSize?: number;
  territory?: string; // Anadolu 1. Bölge vb.
  autoAssignMethod?: "equal_count" | "km_optimized";
  preventOverlap?: boolean; // bölgeler kesişmesin
  maxAutoAssignPerRep?: number; // her uzmana üst sınır
  slaDailyVisitTarget?: number; // ekip hedefi
  coverageGoalPct?: number; // % kapsama hedefi
  exportFormat?: "xlsx" | "csv" | "pdf";
  reportTime?: string; // HH:mm günlük rapor saati
};

// ===== Mock Data =====
const defaultBase: BaseUser = {
  id: "",
  name: "",
  email: "",
  language: "tr",
  units: "metric",
  theme: "system",
  notifications: { email: true, sms: false, push: true },
  shareLiveLocation: false,
};

const defaultSales: SalesUser = {
  ...defaultBase,
  id: "u1",
  role: "sales",
  name: "Mehmet Yılmaz",
  email: "mehmet.yilmaz@example.com",
  phone: "+90 555 111 22 33",
  district: "Kadıköy",
  region: "İstanbul Anadolu",
  dailyVisitTarget: 20,
  vehicle: "car",
  workHours: { start: "09:00", end: "18:00" },
  workDays: { mon:true, tue:true, wed:true, thu:true, fri:true, sat:false, sun:false },
  breakTimes: { start: "12:30", end: "13:30" },
  defaultMapZoom: 13,
  autoCheckinRadiusMeters: 100,
  idVerified: false,
  prefersOptimizedRoutes: true,
};

const defaultManager: ManagerUser = {
  ...defaultBase,
  id: "m1",
  role: "manager",
  name: "Ayşe Demir",
  email: "ayse.demir@example.com",
  phone: "+90 555 444 55 66",
  region: "İstanbul Anadolu",
  territory: "Anadolu 1. Bölge",
  teamName: "Kadıköy Ekip",
  teamSize: 8,
  autoAssignMethod: "km_optimized",
  preventOverlap: true,
  maxAutoAssignPerRep: 60,
  slaDailyVisitTarget: 18,
  coverageGoalPct: 80,
  exportFormat: "xlsx",
  reportTime: "18:00",
};

// ===== Minimal UI atoms (app tarzıyla uyumlu) =====
const FieldRow: React.FC<{ label: string; children?: React.ReactNode }>= ({ label, children }) => (
  <label className="block">
    <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">{label}</div>
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={
      "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm outline-none focus:border-[#0099CB] focus:ring-2 focus:ring-[rgba(0,153,203,0.2)] " +
      (props.className ?? "")
    }
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={
      "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:border-[#0099CB] focus:ring-2 focus:ring-[rgba(0,153,203,0.2)] " +
      (props.className ?? "")
    }
  />
);

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; id?: string }> = ({ checked, onChange, id }) => (
  <button
    id={id}
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-[#0099CB]" : "bg-gray-300 dark:bg-gray-600"}`}
    aria-pressed={checked}
    aria-label="switch"
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"}`} />
  </button>
);

const SaveBar: React.FC<{ onSave: () => void; onCancel?: () => void; saving?: boolean }> = ({ onSave, onCancel, saving }) => (
  <div className="sticky bottom-0 z-10 mt-6 flex justify-end gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
    {onCancel && (
      <button onClick={onCancel} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">İptal</button>
    )}
    <button
      onClick={onSave}
      className="inline-flex items-center gap-2 rounded-lg bg-[#0099CB] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
    >
      <CheckCircle2 className="h-4 w-4" /> {saving ? "Kaydediliyor..." : "Kaydet"}
    </button>
  </div>
);

const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
    {children}
  </div>
);

// ===== Shared SideNav =====
const SideNav: React.FC<{
  items: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}> = ({ items, active, onChange }) => {
  return (
    <aside className="md:w-56 w-full">
      <nav className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm mb-1 border ${
              active === it.key
                ? "border-[#0099CB] text-gray-900 bg-[#F9C800]"
                : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

// ===== Sales Profile (with left menu) =====
export const SalesProfile: React.FC<{ user?: Partial<SalesUser> }> = ({ user }) => {
  const [form, setForm] = useState<SalesUser>({ ...defaultSales, ...(user as SalesUser) });
  const [tab, setTab] = useState<string>("personal");
  const set = <K extends keyof SalesUser>(k: K, v: SalesUser[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = () => {
    console.log("Sales profile saved", form);
    alert("Profil kaydedildi (Satış Uzmanı)");
  };

  const toggleDay = (key: keyof WorkDays) => set("workDays", { ...(form.workDays || defaultSales.workDays!), [key]: !form.workDays?.[key] });

  const items = [
    { key: "personal", label: "Kişisel Bilgiler" },
    { key: "work", label: "Çalışma & Zaman" },
    { key: "map", label: "Saha & Harita" },
    { key: "prefs", label: "Uygulama Tercihleri" },
    { key: "notifs", label: "Bildirimler" },
    { key: "privacy", label: "Gizlilik & Güvenlik" },
  ];

  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* Başlık */}
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-100 dark:bg-yellow-900/20"><User className="h-5 w-5 text-[#0099CB]" /></div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profilim — Satış Uzmanı</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sol menüden bölüm seç</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <SideNav items={items} active={tab} onChange={setTab} />
        <main>
          {tab === "personal" && (
            <Section title="Kişisel Bilgiler">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Ad Soyad">
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Adınız Soyadınız" />
                </FieldRow>
                <FieldRow label="E-posta">
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ornek@firma.com" />
                </FieldRow>
                <FieldRow label="Telefon">
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+90..." />
                </FieldRow>
                <FieldRow label="Bölge">
                  <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="İstanbul Anadolu" />
                </FieldRow>
                <FieldRow label="İlçe">
                  <Input value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="Kadıköy" />
                </FieldRow>
              </div>
            </Section>
          )}

          {tab === "work" && (
            <Section title="Çalışma & Zaman">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Başlangıç Saati">
                  <Input type="time" value={form.workHours?.start} onChange={(e) => set("workHours", { ...(form.workHours||{end:""}), start: e.target.value })} />
                </FieldRow>
                <FieldRow label="Bitiş Saati">
                  <Input type="time" value={form.workHours?.end} onChange={(e) => set("workHours", { ...(form.workHours||{start:""}), end: e.target.value })} />
                </FieldRow>
                <FieldRow label="Öğle Arası Başlangıç">
                  <Input type="time" value={form.breakTimes?.start} onChange={(e) => set("breakTimes", { ...(form.breakTimes||{end:""}), start: e.target.value })} />
                </FieldRow>
                <FieldRow label="Öğle Arası Bitiş">
                  <Input type="time" value={form.breakTimes?.end} onChange={(e) => set("breakTimes", { ...(form.breakTimes||{start:""}), end: e.target.value })} />
                </FieldRow>
              </div>
              <div className="mt-3">
                <div className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Çalışma Günleri</div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {[
                    { k: "mon", t: "Pzt" },
                    { k: "tue", t: "Sal" },
                    { k: "wed", t: "Çar" },
                    { k: "thu", t: "Per" },
                    { k: "fri", t: "Cum" },
                    { k: "sat", t: "Cts" },
                    { k: "sun", t: "Paz" },
                  ].map((d) => (
                    <button key={d.k} type="button" onClick={() => toggleDay(d.k as keyof WorkDays)}
                      className={`rounded-lg border px-3 py-1 ${form.workDays?.[d.k as keyof WorkDays] ? "border-[#0099CB] text-[#0099CB]" : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}
                    >{d.t}</button>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {tab === "map" && (
            <Section title="Saha & Harita">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Araç">
                  <Select value={form.vehicle} onChange={(e) => set("vehicle", e.target.value as any)}>
                    <option value="walking">Yaya</option>
                    <option value="bike">Bisiklet</option>
                    <option value="car">Otomobil</option>
                  </Select>
                </FieldRow>
                <FieldRow label="Varsayılan Harita Yakınlığı (8-18)">
                  <Input type="number" min={8} max={18} value={form.defaultMapZoom ?? 13} onChange={(e) => set("defaultMapZoom", Number(e.target.value))} />
                </FieldRow>
                <FieldRow label="Otomatik Check-in Çapı (metre)">
                  <Input type="number" min={50} max={500} step={10} value={form.autoCheckinRadiusMeters ?? 100} onChange={(e) => set("autoCheckinRadiusMeters", Number(e.target.value))} />
                </FieldRow>
                <FieldRow label="Günlük Ziyaret Hedefi">
                  <Input type="number" min={0} value={form.dailyVisitTarget ?? 0} onChange={(e) => set("dailyVisitTarget", Number(e.target.value))} />
                </FieldRow>
                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleLine label="Rota Optimizasyonu" checked={!!form.prefersOptimizedRoutes} onChange={(v) => set("prefersOptimizedRoutes", v)} hint="En kısa mesafeye öncelik" />
                </div>
              </div>
            </Section>
          )}

          {tab === "prefs" && (
            <Section title="Uygulama Tercihleri">
              <div className="grid gap-4 md:grid-cols-3">
                <FieldRow label="Dil">
                  <Select value={form.language} onChange={(e) => set("language", e.target.value as any)}>
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </Select>
                </FieldRow>
                <FieldRow label="Birim">
                  <Select value={form.units} onChange={(e) => set("units", e.target.value as any)}>
                    <option value="metric">Metrik (km, °C)</option>
                    <option value="imperial">Imperial (mi, °F)</option>
                  </Select>
                </FieldRow>
                <FieldRow label="Tema">
                  <Select value={form.theme} onChange={(e) => set("theme", e.target.value as any)}>
                    <option value="system">Sistem</option>
                    <option value="light">Açık</option>
                    <option value="dark">Koyu</option>
                  </Select>
                </FieldRow>
              </div>
            </Section>
          )}

          {tab === "notifs" && (
            <Section title="Bildirimler">
              <div className="grid gap-3 md:grid-cols-3">
                <ToggleLine label="E-posta" checked={!!form.notifications?.email} onChange={(v) => set("notifications", { ...(form.notifications||defaultBase.notifications!), email: v })} compact />
                <ToggleLine label="SMS" checked={!!form.notifications?.sms} onChange={(v) => set("notifications", { ...(form.notifications||defaultBase.notifications!), sms: v })} compact />
                <ToggleLine label="Push" checked={!!form.notifications?.push} onChange={(v) => set("notifications", { ...(form.notifications||defaultBase.notifications!), push: v })} compact />
              </div>
            </Section>
          )}

          {tab === "privacy" && (
            <Section title="Gizlilik & Güvenlik">
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleLine label="Canlı Konumu Paylaş" checked={!!form.shareLiveLocation} onChange={(v) => set("shareLiveLocation", v)} />
                <ToggleLine label="Kimlik Doğrulandı (Test)" checked={!!form.idVerified} onChange={(v) => set("idVerified", v)} hint="Tiki açınca kimlik okundu say" />
              </div>
              <div className="mt-4">
                <button className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Şifreyi Değiştir</button>
              </div>
            </Section>
          )}
        </main>
      </div>

      <SaveBar onSave={onSave} />
    </div>
  );
};

// ===== Manager Profile (with left menu) =====
export const ManagerProfile: React.FC<{ user?: Partial<ManagerUser> }> = ({ user }) => {
  const [form, setForm] = useState<ManagerUser>({ ...defaultManager, ...(user as ManagerUser) });
  const [tab, setTab] = useState<string>("personal");
  const set = <K extends keyof ManagerUser>(k: K, v: ManagerUser[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = () => {
    console.log("Manager profile saved", form);
    alert("Profil kaydedildi (Saha Yöneticisi)");
  };

  const items = [
    { key: "personal", label: "Kişisel Bilgiler" },
    { key: "assign", label: "Atama Politikaları" },
    { key: "team", label: "Ekip Hedefleri" },
    { key: "prefs", label: "Uygulama Tercihleri" },
    { key: "notifs", label: "Bildirimler" },
    { key: "reports", label: "Rapor & Dışa Aktarım" },
  ];

  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* Başlık */}
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-100 dark:bg-yellow-900/20"><User className="h-5 w-5 text-[#0099CB]" /></div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profilim — Saha Yöneticisi</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sol menüden bölüm seç</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <SideNav items={items} active={tab} onChange={setTab} />
        <main>
          {tab === "personal" && (
            <Section title="Kişisel Bilgiler">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Ad Soyad">
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                </FieldRow>
                <FieldRow label="E-posta">
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </FieldRow>
                <FieldRow label="Telefon">
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </FieldRow>
                <FieldRow label="Bölge">
                  <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="İstanbul Anadolu" />
                </FieldRow>
                <FieldRow label="Sorumlu Bölge">
                  <Input value={form.territory} onChange={(e) => set("territory", e.target.value)} placeholder="Anadolu 1. Bölge" />
                </FieldRow>
                <FieldRow label="Ekip Adı">
                  <Input value={form.teamName} onChange={(e) => set("teamName", e.target.value)} />
                </FieldRow>
                <FieldRow label="Ekip Büyüklüğü">
                  <Input type="number" min={0} value={form.teamSize ?? 0} onChange={(e) => set("teamSize", Number(e.target.value))} />
                </FieldRow>
              </div>
            </Section>
          )}

          {tab === "assign" && (
            <Section title="Atama Politikaları">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Otomatik Atama Yöntemi">
                  <Select value={form.autoAssignMethod} onChange={(e) => set("autoAssignMethod", e.target.value as any)}>
                    <option value="equal_count">Uzman başına eşit müşteri</option>
                    <option value="km_optimized">Toplam km en düşük</option>
                  </Select>
                </FieldRow>
                <FieldRow label="Uzman Başına Üst Sınır">
                  <Input type="number" min={0} value={form.maxAutoAssignPerRep ?? 0} onChange={(e) => set("maxAutoAssignPerRep", Number(e.target.value))} />
                </FieldRow>
                <div className="md:col-span-2">
                  <ToggleLine label="Bölgeler Kesişmesin" checked={!!form.preventOverlap} onChange={(v) => set("preventOverlap", v)} hint="Atanan poligonlar üst üste gelmesin" />
                </div>
              </div>
            </Section>
          )}

          {tab === "team" && (
            <Section title="Ekip Hedefleri">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldRow label="Günlük Ziyaret (SLA)">
                  <Input type="number" min={0} value={form.slaDailyVisitTarget ?? 0} onChange={(e) => set("slaDailyVisitTarget", Number(e.target.value))} />
                </FieldRow>
                <FieldRow label="Kapsama Hedefi (%)">
                  <Input type="number" min={0} max={100} value={form.coverageGoalPct ?? 0} onChange={(e) => set("coverageGoalPct", Number(e.target.value))} />
                </FieldRow>
              </div>
            </Section>
          )}

          {tab === "prefs" && (
            <Section title="Uygulama Tercihleri">
              <div className="grid gap-4 md:grid-cols-3">
                <FieldRow label="Dil">
                  <Select value={form.language} onChange={(e) => set("language", e.target.value as any)}>
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </Select>
                </FieldRow>
                <FieldRow label="Birim">
                  <Select value={form.units} onChange={(e) => set("units", e.target.value as any)}>
                    <option value="metric">Metrik (km, °C)</option>
                    <option value="imperial">Imperial (mi, °F)</option>
                  </Select>
                </FieldRow>
                <FieldRow label="Tema">
                  <Select value={form.theme} onChange={(e) => set("theme", e.target.value as any)}>
                    <option value="system">Sistem</option>
                    <option value="light">Açık</option>
                    <option value="dark">Koyu</option>
                  </Select>
                </FieldRow>
              </div>
            </Section>
          )}

          {tab === "notifs" && (
            <Section title="Bildirimler">
              <div className="grid gap-3 md:grid-cols-3">
                <ToggleLine label="E-posta" checked={!!form.notifications?.email} onChange={(v) => set("notifications", { ...(form.notifications||defaultBase.notifications!), email: v })} compact />
                <ToggleLine label="SMS" checked={!!form.notifications?.sms} onChange={(v) => set("notifications", { ...(form.notifications||defaultBase.notifications!), sms: v })} compact />
                <ToggleLine label="Push" checked={!!form.notifications?.push} onChange={(v) => set("notifications", { ...(form.notifications||defaultBase.notifications!), push: v })} compact />
              </div>
            </Section>
          )}

          {tab === "reports" && (
            <Section title="Rapor & Dışa Aktarım">
              <div className="grid gap-4 md:grid-cols-3">
                <FieldRow label="Format">
                  <Select value={form.exportFormat} onChange={(e) => set("exportFormat", e.target.value as any)}>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                  </Select>
                </FieldRow>
                <FieldRow label="Günlük Rapor Saati">
                  <Input type="time" value={form.reportTime || "18:00"} onChange={(e) => set("reportTime", e.target.value)} />
                </FieldRow>
              </div>
            </Section>
          )}
        </main>
      </div>

      <SaveBar onSave={onSave} />
    </div>
  );
};

const ToggleLine: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; compact?: boolean }> = ({ label, checked, onChange, hint, compact }) => (
  <div className={`flex items-center justify-between ${compact ? "" : "rounded-lg border border-gray-200 dark:border-gray-700 p-3"}`}>
    <div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
      {hint && <div className="text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
    </div>
    <Switch checked={checked} onChange={onChange} />
  </div>
);

// ===== Wrapper =====
const ProfileScreens: React.FC<{ role: Role; salesUser?: Partial<SalesUser>; managerUser?: Partial<ManagerUser> }> = ({ role, salesUser, managerUser }) => {
  return role === "sales" ? <SalesProfile user={salesUser} /> : <ManagerProfile user={managerUser} />;
};

export default ProfileScreens;


/*
====================================
INTEGRASYON NOTU — Sol üst profil ikonundan ProfileScreens açma
====================================
Aşağıdaki küçük yamalarla profil ekranını Navigation’daki sol üst profil ikonuna bağlayın.

1) src/types.ts — Screen union’a “profile” ekleyin
-------------------------------------------------
export type Screen =
  | 'login'
  | 'roleSelect'
  | 'dashboard'
  | 'routeMap'
  | 'visitList'
  | 'visitDetail'
  | 'visitFlow'
  | 'reports'
  | 'assignment'
  | 'assignmentMap'
  | 'teamMap'
  | 'messages'
  | 'profile'; // 👈 eklendi

2) src/components/Navigation.tsx — Avatar alanını tıklanabilir yapın
--------------------------------------------------------------------
Orijinal:
<div className="flex items-center gap-3 min-w-0">
  ... avatar + isim ...
</div>

Değiştirin:
<div
  className="flex items-center gap-3 min-w-0 cursor-pointer rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
  onClick={() => setCurrentScreen('profile')}
  title="Profilim"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setCurrentScreen('profile')}
>
  ... avatar + isim ...
</div>

İsteğe bağlı (aktifken görsel vurgu):
- Dış sarmalayıcıya şunu ekleyebilirsiniz: 
  {currentScreen === 'profile' ? 'ring-2 ring-[#0099CB] ring-offset-2 dark:ring-offset-gray-800' : ''}
- Avatar img için mevcut ring kalabilir.

3) src/App.tsx — Route ekleyin
-------------------------------
import ProfileScreens from './screens/ProfileScreens';

// ... <AppLayout> içindeki children alanında:
{currentScreen === 'profile' && (
  <ProfileScreens role={role === 'manager' ? 'manager' : 'sales'} />
)}

Notlar
-----
- ProfileScreens bu dosyada export default. Konumunuza göre import yolunu güncelleyin (örn. './screens/ProfileScreens').
- App’inizde Role tipi 'rep' | 'manager' olduğundan 'rep' durumunu 'sales' rolüne map’liyoruz.
- Dark mode ve vurgu renkleri Navigation ile aynı (brand: #0099CB, accent: #F9C800).
*/
