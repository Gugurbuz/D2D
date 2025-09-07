import React, { useMemo, useState } from "react";
import {
  Shield,
  Wrench,
  Users,
  UserPlus,
  KeyRound,
  Save,
  Trash2,
  RotateCcw, // ✅ Şifre sıfırlama için bu ikon
  AlertTriangle,
  Activity,
  ToggleLeft,
  ToggleRight,
  Search,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Database,
  Settings2,
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
const SystemManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [newUser, setNewUser] = useState<Partial<AppUser>>({ name: "", email: "", role: "viewer", active: true });
  const [audit, setAudit] = useState<AuditLog[]>(initialAudit);

  const filteredUsers = useMemo(
    () => users.filter(u =>
      [u.name, u.email, u.role].join(" ").toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  const resetPassword = (id: string) => {
    const u = users.find(x => x.id === id);
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "ŞİFRE_SIFIRLA", target: u?.email }, ...a]);
    alert(`Şifre sıfırlama linki ${u?.email} adresine gönderildi (mock).`);
  };

  const deleteUser = (id: string) => {
    const victim = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    setAudit(a => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "KULLANICI_SİL", target: victim?.email }, ...a]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Wrench className="w-6 h-6" /> Sistem Yönetimi
      </h1>
      <p className="text-gray-500 mb-6">Admin işlemleri: kullanıcı yönetimi, güvenlik, loglar.</p>

      <Section title="Kullanıcılar" icon={<Users className="w-5 h-5 text-blue-600" />}>
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
                  <td className="py-2">{u.role}</td>
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
                        <RotateCcw className="w-4 h-4" /> {/* ✅ ikon güncellendi */}
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
      </Section>
    </div>
  );
};

export default SystemManagementScreen;
