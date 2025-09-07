// src/screens/SystemSettingsScreen.tsx
import React, { useMemo, useState } from "react";
import {
  Shield,
  Wrench,
  Users,
  UserPlus,
  KeyRound,
  Save,
  Trash2,
  LockReset,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Settings2,
  Activity,
  ToggleLeft,
  ToggleRight,
  Search,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  Bell,
  Sparkles,
  Database,
} from "lucide-react";

/* ===================== Yardımcı Tipler ===================== */
type Role = "admin" | "manager" | "rep" | "viewer";

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastLogin?: string;
};

type FeatureFlag = {
  key: string;
  label: string;
  enabled: boolean;
  description?: string;
};

type HealthCheck = {
  name: string;
  status: "healthy" | "degraded" | "down";
  details?: string;
};

type AuditLog = {
  id: string;
  ts: string; // ISO datetime
  actor: string;
  action: string;
  target?: string;
  meta?: Record<string, any>;
};

/* ===================== Mock Data (yerine API bağla) ===================== */
const initialUsers: AppUser[] = [
  { id: "u1", name: "Gürkan Gürbüz", email: "gurkan@example.com", role: "admin", active: true, lastLogin: "2025-09-07T18:30:00Z" },
  { id: "u2", name: "Serkan Özkan", email: "serkan@example.com", role: "manager", active: true, lastLogin: "2025-09-07T10:12:00Z" },
  { id: "u3", name: "Zelal Toprak", email: "zelal@example.com", role: "rep", active: true, lastLogin: "2025-09-06T08:44:00Z" },
  { id: "u4", name: "Şöhret Hantal", email: "sohret@example.com", role: "viewer", active: false },
];

const initialFlags: FeatureFlag[] = [
  { key: "invoice_ocr", label: "Fatura OCR", enabled: true, description: "Google Vision + özet" },
  { key: "route_opt_v2", label: "Rota Optimizasyon v2", enabled: false, description: "Daha hızlı OSRM" },
  { key: "satış_gpt", label: "SatışGPT Asistan", enabled: true, description: "C4C/CRM entegrasyonlu" },
];

const initialAudit: AuditLog[] = [
  { id: "a1", ts: new Date().toISOString(), actor: "Gürkan", action: "BAKIM_MODU_AÇ", meta: { message: "Gece bakımı" } },
  { id: "a2", ts: new Date(Date.now() - 1000*60*50).toISOString(), actor: "Serkan", action: "KULLANICI_OLUŞTUR", target: "zelal@example.com", meta: { role: "rep" } },
];

/* ===================== Küçük Yardımcı Bileşenler ===================== */
function Badge({ children, tone = "gray" as "gray"|"green"|"red"|"yellow"|"blue" }) {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[tone]}`}>{children}</span>;
}

function Section({ title, icon, children, desc }: { title: string; icon?: React.ReactNode; children: React.ReactNode; desc?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {desc && <p className="text-sm text-gray-500 mb-4">{desc}</p>}
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 my-4" />;
}

/* ===================== Ana Ekran ===================== */
const SystemSettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"genel"|"kullanicilar"|"guvenlik"|"loglar">("genel");

  // Bakım modu
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("Sistem bakımı yapılıyor. Kısa sürede tekrar aktif olacağız.");
  const [maintenanceBanner, setMaintenanceBanner] = useState(true);

  // Kullanıcılar
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const filteredUsers = useMemo(
    () => users.filter(u =>
      [u.name, u.email, u.role].join(" ").toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [newUser, setNewUser] = useState<Partial<AppUser>>({ name: "", email: "", role: "viewer", active: true });

  // Feature flags
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);

  // Sağlık kontrolleri (mock)
  const [health, setHealth] = useState<HealthCheck[]>([
    { name: "Database", status: "healthy", details: "Latency 12ms" },
    { name: "Storage", status: "healthy" },
    { name: "Supabase Functions", status: "degraded", details: "Cold start: 1.2s" },
    { name: "Google Vision", status: "healthy" },
  ]);

  // Güvenlik
  const [force2FA, setForce2FA] = useState(false);
  const [sessionTTL, setSessionTTL] = useState(12); // saat
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLen: 8,
    requireUpper: true,
    requireNumber: true,
    requireSymbol: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("sk-live-***-REDACTED");

  // Audit
  const [audit, setAudit] = useState<AuditLog[]>(initialAudit);

  /* ===================== Olaylar (mock; API'ye bağla) ===================== */
  const toggleMaintenance = () => {
    // TODO: backend'e PATCH gönder
    setMaintenanceOn((v) => !v);
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: !maintenanceOn ? "BAKIM_MODU_AÇ" : "BAKIM_MODU_KAPAT" }, ...a]);
  };

  const saveMaintenanceMsg = () => {
    // TODO: backend'e kaydet
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "BAKIM_MESAJ_GÜNCEL", meta: { maintenanceMsg } }, ...a]);
  };

  const addUser = () => {
    if (!newUser.name?.trim() || !newUser.email?.trim()) return;
    const u: AppUser = {
      id: crypto.randomUUID(),
      name: newUser.name!,
      email: newUser.email!,
      role: (newUser.role as Role) ?? "viewer",
      active: newUser.active ?? true,
    };
    // TODO: POST /users
    setUsers(prev => [u, ...prev]);
    setNewUser({ name: "", email: "", role: "viewer", active: true });
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "KULLANICI_OLUŞTUR", target: u.email, meta: { role: u.role } }, ...a]);
  };

  const updateUser = () => {
    if (!editingUser) return;
    // TODO: PUT /users/:id
    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "KULLANICI_GÜNCELLE", target: editingUser.email }, ...a]);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    const victim = users.find(u => u.id === id);
    // TODO: DELETE /users/:id
    setUsers(prev => prev.filter(u => u.id !== id));
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "KULLANICI_SİL", target: victim?.email }, ...a]);
  };

  const resetPassword = (id: string) => {
    const u = users.find(x => x.id === id);
    // TODO: POST /users/:id/reset-password
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "ŞİFRE_SIFIRLA", target: u?.email }, ...a]);
    alert(`Şifre sıfırlama linki ${u?.email} adresine gönderildi (mock).`);
  };

  const toggleFlag = (key: string) => {
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "FLAG_TOGGLE", target: key }, ...a]);
  };

  const runHealthChecks = () => {
    // TODO: gerçek sağlık kontrolü
    setHealth(h => h.map(x => ({ ...x, status: x.status })));
  };

  const rotateApiKey = () => {
    // TODO: rotate key on backend
    const newKey = "sk-live-" + Math.random().toString(36).slice(2, 10) + "-REDACTED";
    setApiKey(newKey);
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "API_KEY_ROTATE" }, ...a]);
  };

  const killAllSessions = () => {
    // TODO: tüm oturumları öldür
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "SESSIONS_KILL_ALL" }, ...a]);
    alert("Tüm oturumlar sonlandırıldı (mock).");
  };

  const clearCaches = () => {
    // TODO: cache clear
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "CACHE_CLEAR" }, ...a]);
    alert("Önbellek temizlendi (mock).");
  };

  /* ===================== UI ===================== */
  const TabBtn = ({ id, label, icon }: { id: typeof activeTab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition
      ${activeTab === id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
    >
      {icon}<span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="p-6">
      {/* Sayfa Başlığı */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6" /> Sistem Ayarları
          </h1>
          <p className="text-gray-500">Bakım modu, kullanıcı yönetimi, güvenlik ve loglar.</p>
        </div>
        <div className="flex gap-2">
          <TabBtn id="genel" label="Genel" icon={<Wrench className="w-4 h-4" />} />
          <TabBtn id="kullanicilar" label="Kullanıcılar" icon={<Users className="w-4 h-4" />} />
          <TabBtn id="guvenlik" label="Güvenlik" icon={<Shield className="w-4 h-4" />} />
          <TabBtn id="loglar" label="Loglar" icon={<Activity className="w-4 h-4" />} />
        </div>
      </div>

      {/* Bakım Banner'ı (isteğe bağlı) */}
      {maintenanceBanner && maintenanceOn && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge tone="yellow">Bakım Modu Aktif</Badge>
              <span className="text-sm text-amber-800">{maintenanceMsg}</span>
            </div>
          </div>
          <button className="text-amber-700 text-sm hover:underline" onClick={() => setMaintenanceBanner(false)}>Gizle</button>
        </div>
      )}

      {/* İçerik */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === "genel" && (
          <>
            <Section
              title="Bakım Modu"
              icon={<Wrench className="w-5 h-5 text-blue-600" />}
              desc="Sistemi geçici olarak bakım moduna alabilir, mesajı düzenleyebilirsin."
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {maintenanceOn ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-gray-400" />}
                  <div>
                    <div className="font-medium">{maintenanceOn ? "Bakım modu AÇIK" : "Bakım modu KAPALI"}</div>
                    <p className="text-sm text-gray-500">Son kullanıcılar bakım mesajını görür ve kritik işlemler durdurulur.</p>
                  </div>
                </div>
                <button
                  onClick={toggleMaintenance}
                  className={`px-4 py-2 rounded-lg font-medium border transition ${
                    maintenanceOn
                      ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {maintenanceOn ? "Bakım Modunu Kapat" : "Bakım Modunu Aç"}
                </button>
              </div>
              <Divider />
              <label className="block text-sm font-medium text-gray-700 mb-1">Bakım Mesajı</label>
              <textarea
                value={maintenanceMsg}
                onChange={(e) => setMaintenanceMsg(e.target.value)}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={maintenanceBanner} onChange={(e)=>setMaintenanceBanner(e.target.checked)} />
                  Oturum açmış kullanıcılara üst banner göster
                </label>
                <button onClick={saveMaintenanceMsg} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  <Save className="w-4 h-4" /> Kaydet
                </button>
              </div>
            </Section>

            <Section
              title="Özellik Bayrakları"
              icon={<Sparkles className="w-5 h-5 text-blue-600" />}
              desc="İsteğe bağlı özellikleri aç/kapat."
            >
              <div className="grid md:grid-cols-2 gap-3">
                {flags.map(f => (
                  <div key={f.key} className="flex items-center justify-between p-3 rounded-xl border">
                    <div>
                      <div className="font-medium">{f.label}</div>
                      {f.description && <div className="text-sm text-gray-500">{f.description}</div>}
                    </div>
                    <button
                      onClick={() => toggleFlag(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        f.enabled ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {f.enabled ? "Açık" : "Kapalı"}
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Sağlık Kontrolleri"
              icon={<Activity className="w-5 h-5 text-blue-600" />}
              desc="Bağımlılıkların mevcut durumu."
            >
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {health.map(h => (
                  <div key={h.name} className="p-3 rounded-xl border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{h.name}</div>
                        {h.details && <div className="text-xs text-gray-500">{h.details}</div>}
                      </div>
                    </div>
                    {h.status === "healthy" && <Badge tone="green">Sağlıklı</Badge>}
                    {h.status === "degraded" && <Badge tone="yellow">Kısmi</Badge>}
                    {h.status === "down" && <Badge tone="red">KAPALI</Badge>}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button onClick={runHealthChecks} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" /> Yenile
                </button>
              </div>
            </Section>

            <Section
              title="Tehlikeli Alan"
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              desc="Bu işlemler geri alınamaz olabilir."
            >
              <div className="flex flex-col md:flex-row gap-3">
                <button onClick={killAllSessions} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50">
                  <LogOut className="w-4 h-4" /> Tüm Oturumları Sonlandır
                </button>
                <button onClick={clearCaches} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50">
                  <RefreshCw className="w-4 h-4" /> Önbelleği Temizle
                </button>
              </div>
            </Section>
          </>
        )}

        {activeTab === "kullanicilar" && (
          <>
            <Section
              title="Kullanıcı Ekle"
              icon={<UserPlus className="w-5 h-5 text-blue-600" />}
              desc="Yeni kullanıcı oluştur ve rol ata."
            >
              <div className="grid md:grid-cols-5 gap-3">
                <input
                  placeholder="Ad Soyad"
                  className="md:col-span-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.name ?? ""}
                  onChange={(e)=>setNewUser(s=>({ ...s, name: e.target.value }))}
                />
                <input
                  placeholder="E-posta"
                  className="md:col-span-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={newUser.email ?? ""}
                  onChange={(e)=>setNewUser(s=>({ ...s, email: e.target.value }))}
                />
                <select
                  className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={(newUser.role as Role) ?? "viewer"}
                  onChange={(e)=>setNewUser(s=>({ ...s, role: e.target.value as Role }))}
                >
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="rep">rep</option>
                  <option value="viewer">viewer</option>
                </select>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={newUser.active ?? true} onChange={(e)=>setNewUser(s=>({ ...s, active: e.target.checked }))} />
                    Aktif
                  </label>
                  <button onClick={addUser} className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                    <Save className="w-4 h-4" /> Oluştur
                  </button>
                </div>
              </div>
            </Section>

            <Section
              title="Kullanıcılar"
              icon={<Users className="w-5 h-5 text-blue-600" />}
              desc="Ara, düzenle, şifre sıfırla."
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="İsim, e-posta veya rol ara…"
                    className="w-full pl-9 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    value={search}
                    onChange={(e)=>setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2">Kullanıcı</th>
                      <th className="py-2">E-posta</th>
                      <th className="py-2">Rol</th>
                      <th className="py-2">Durum</th>
                      <th className="py-2">Son Giriş</th>
                      <th className="py-2 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-t">
                        <td className="py-2 font-medium">{u.name}</td>
                        <td className="py-2">{u.email}</td>
                        <td className="py-2">
                          <select
                            value={u.role}
                            onChange={(e)=>{
                              const role = e.target.value as Role;
                              setUsers(prev => prev.map(x => x.id===u.id ? { ...x, role } : x));
                              setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "ROL_DEĞİŞTİR", target: u.email, meta: { role } }, ...a]);
                            }}
                            className="rounded border-gray-300"
                          >
                            <option value="admin">admin</option>
                            <option value="manager">manager</option>
                            <option value="rep">rep</option>
                            <option value="viewer">viewer</option>
                          </select>
                        </td>
                        <td className="py-2">
                          {u.active ? <Badge tone="green">Aktif</Badge> : <Badge tone="gray">Pasif</Badge>}
                        </td>
                        <td className="py-2 text-gray-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "-"}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={()=>setEditingUser(u)}
                              className="px-2 py-1 rounded-lg border hover:bg-gray-50"
                              title="Düzenle"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={()=>resetPassword(u.id)}
                              className="px-2 py-1 rounded-lg border hover:bg-gray-50"
                              title="Şifre Sıfırla"
                            >
                              <LockReset className="w-4 h-4" />
                            </button>
                            <button
                              onClick={()=>deleteUser(u.id)}
                              className="px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">Sonuç yok.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Düzenleme Modalı */}
              {editingUser && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-xl">
                    <h3 className="text-lg font-semibold mb-3">Kullanıcıyı Düzenle</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600">Ad Soyad</label>
                        <input className="w-full rounded-lg border-gray-300" value={editingUser.name} onChange={(e)=>setEditingUser({...editingUser, name: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600">E-posta</label>
                        <input className="w-full rounded-lg border-gray-300" value={editingUser.email} onChange={(e)=>setEditingUser({...editingUser, email: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Rol</label>
                        <select className="w-full rounded-lg border-gray-300" value={editingUser.role} onChange={(e)=>setEditingUser({...editingUser, role: e.target.value as Role})}>
                          <option value="admin">admin</option>
                          <option value="manager">manager</option>
                          <option value="rep">rep</option>
                          <option value="viewer">viewer</option>
                        </select>
                      </div>
                      <div className="flex items-end justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input type="checkbox" checked={editingUser.active} onChange={(e)=>setEditingUser({...editingUser, active: e.target.checked})} />
                          Aktif
                        </label>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-end gap-2">
                      <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={()=>setEditingUser(null)}>Vazgeç</button>
                      <button className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={updateUser}>
                        <Save className="w-4 h-4 inline-block mr-1" /> Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Section>
          </>
        )}

        {activeTab === "guvenlik" && (
          <>
            <Section
              title="Parola Politikası"
              icon={<KeyRound className="w-5 h-5 text-blue-600" />}
              desc="Minimum uzunluk ve karmaşıklık gereksinimlerini belirle."
            >
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Minimum Uzunluk</label>
                  <input
                    type="number"
                    min={6}
                    className="w-full rounded-lg border-gray-300"
                    value={passwordPolicy.minLen}
                    onChange={(e)=>setPasswordPolicy(p=>({ ...p, minLen: Number(e.target.value) }))}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={passwordPolicy.requireUpper} onChange={(e)=>setPasswordPolicy(p=>({ ...p, requireUpper: e.target.checked }))} />
                  Büyük harf
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={passwordPolicy.requireNumber} onChange={(e)=>setPasswordPolicy(p=>({ ...p, requireNumber: e.target.checked }))} />
                  Rakam
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={passwordPolicy.requireSymbol} onChange={(e)=>setPasswordPolicy(p=>({ ...p, requireSymbol: e.target.checked }))} />
                  Sembol
                </label>
              </div>
              <div className="mt-3 flex items-center justify-end">
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  <Save className="w-4 h-4" /> Kaydet
                </button>
              </div>
            </Section>

            <Section
              title="Oturum & 2FA"
              icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
            >
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">2FA Zorunlu</div>
                      <div className="text-sm text-gray-500">Tüm kullanıcılar için iki adımlı doğrulama.</div>
                    </div>
                    <button onClick={()=>setForce2FA(v=>!v)} className={`px-3 py-1.5 rounded-lg border ${force2FA ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                      {force2FA ? "Açık" : "Kapalı"}
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Oturum Süresi</div>
                      <div className="text-sm text-gray-500">Otomatik çıkış için saat cinsinden.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} className="w-24 rounded-lg border-gray-300" value={sessionTTL} onChange={(e)=>setSessionTTL(Number(e.target.value))} />
                      <span className="text-sm text-gray-600">saat</span>
                    </div>
                  </div>
                </div>
              </div>
              <Divider />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">API Anahtarı</div>
                  <div className="text-sm text-gray-500">Hassas. Paylaşma.</div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 rounded bg-gray-50 border">{showApiKey ? apiKey : "•••••••••••••••"}</code>
                  <button className="p-2 rounded-lg border" onClick={()=>setShowApiKey(v=>!v)} title="Göster/Gizle">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button className="p-2 rounded-lg border" onClick={rotateApiKey} title="Yenile">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "loglar" && (
          <Section
            title="Audit Log"
            icon={<Activity className="w-5 h-5 text-blue-600" />}
            desc="Sistem üzerinde gerçekleşen önemli aksiyonlar."
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">Zaman</th>
                    <th className="py-2">Kullanıcı</th>
                    <th className="py-2">Aksiyon</th>
                    <th className="py-2">Hedef</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map(item => (
                    <tr key={item.id} className="border-t">
                      <td className="py-2">{new Date(item.ts).toLocaleString()}</td>
                      <td className="py-2">{item.actor}</td>
                      <td className="py-2">{item.action}</td>
                      <td className="py-2">{item.target ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default SystemSettingsScreen;
