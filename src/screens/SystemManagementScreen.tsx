import React, { useMemo, useState } from "react";
import {
  Settings2,
  Wrench,
  Sparkles,
  Activity,
  Database,
  Server,
  Cloud,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Save,
  AlertTriangle,
  LogOut,
  Shield,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Globe,
  Gauge,
  BarChart3,
  Link2,
  Webhook,
  Mail,
  Cpu,
  FileDown,
  FileUp,
  CheckCircle2,
  XCircle,
  Info,
  SlidersHorizontal,
} from "lucide-react";

/* ====================== Tipler ====================== */
type FeatureFlag = { key: string; label: string; enabled: boolean; description?: string };
type HealthCheck = { name: string; status: "healthy" | "degraded" | "down"; details?: string };
type AuditLog = { id: string; ts: string; actor: string; action: string; target?: string; meta?: Record<string, any> };

/* ====================== Mock ====================== */
const initialFlags: FeatureFlag[] = [
  { key: "invoice_ocr", label: "Fatura OCR", enabled: true, description: "Vision + özet" },
  { key: "route_opt_v2", label: "Rota Optimizasyon v2", enabled: false, description: "OSRM iyileştirme" },
  { key: "sales_assistant", label: "Satış Asistanı", enabled: true, description: "Saha asistanı önerileri" },
];

const initialHealth: HealthCheck[] = [
  { name: "Database", status: "healthy", details: "latency 11ms" },
  { name: "Storage", status: "healthy", details: "ok" },
  { name: "Supabase Functions", status: "degraded", details: "cold start ~1.3s" },
  { name: "Google Vision", status: "healthy", details: "quota ok" },
];

const initialAudit: AuditLog[] = [
  { id: "a1", ts: new Date().toISOString(), actor: "Admin", action: "BAKIM_MODU_AÇ", meta: { reason: "Gece bakımı" } },
  { id: "a2", ts: new Date(Date.now() - 1000 * 60 * 42).toISOString(), actor: "Admin", action: "FLAG_TOGGLE", target: "invoice_ocr", meta: { enabled: true } },
];

/* ====================== Küçük UI yardımcıları ====================== */
const Badge: React.FC<{ tone?: "gray" | "green" | "red" | "yellow" | "blue" }> = ({ tone = "gray", children }) => {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[tone]}`}>{children}</span>;
};

const Section: React.FC<{ title: string; icon?: React.ReactNode; desc?: string }> = ({ title, icon, desc, children }) => (
  <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    {desc && <p className="text-sm text-gray-500 mb-4">{desc}</p>}
    {children}
  </div>
);

const Divider = () => <div className="h-px bg-gray-100 my-4" />;

/* ====================== Ekran ====================== */
const SystemManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"genel" | "guvenlik" | "entegrasyon" | "altyapi" | "loglar">("genel");

  /* Bakım modu */
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("Sistem bakımı yapılıyor. Kısa sürede aktif olunacak.");
  const [maintenanceBanner, setMaintenanceBanner] = useState(true);

  /* Feature flags & sağlık */
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [health, setHealth] = useState<HealthCheck[]>(initialHealth);

  /* SKTT eşikleri */
  const [skttResidential, setSkttResidential] = useState(5000);
  const [skttBiz, setSkttBiz] = useState(15000);

  /* Rate limit & kota */
  const [reqPerMin, setReqPerMin] = useState(600); // istek/dakika
  const [dailyOcrQuota, setDailyOcrQuota] = useState(500); // günlük OCR sayısı
  const [retentionDaysLog, setRetentionDaysLog] = useState(30);
  const [retentionDaysOcr, setRetentionDaysOcr] = useState(7);

  /* Güvenlik */
  const [force2FA, setForce2FA] = useState(false);
  const [sessionTTL, setSessionTTL] = useState(12);
  const [passwordPolicy, setPasswordPolicy] = useState({ minLen: 8, requireUpper: true, requireNumber: true, requireSymbol: false });
  const [ipAllowlist, setIpAllowlist] = useState("10.0.0.0/8, 192.168.0.0/16");

  /* Entegrasyonlar */
  const [supabaseUrl, setSupabaseUrl] = useState("https://<project>.supabase.co");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("sb-***-REDACTED");
  const [visionApiKey, setVisionApiKey] = useState("AIza***-REDACTED");
  const [showKeys, setShowKeys] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://api.example.com/hook/events");
  const [notifEmails, setNotifEmails] = useState("ops@example.com, admin@example.com");

  /* Ortam banner */
  const [envName, setEnvName] = useState<"dev" | "stage" | "prod">("dev");
  const [envTitle, setEnvTitle] = useState("Development");
  const [envColor, setEnvColor] = useState("#3b82f6");

  /* Audit log */
  const [audit, setAudit] = useState<AuditLog[]>(initialAudit);

  /* Handlers (mock) */
  const toggleMaintenance = () => {
    setMaintenanceOn((v) => !v);
    setAudit((a) => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: !maintenanceOn ? "BAKIM_MODU_AÇ" : "BAKIM_MODU_KAPAT" }, ...a]);
  };
  const saveMaintenanceMsg = () =>
    setAudit((a) => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "BAKIM_MESAJ_GÜNCEL", meta: { maintenanceMsg } }, ...a]);
  const toggleFlag = (key: string) => {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
    setAudit((a) => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "FLAG_TOGGLE", target: key }, ...a]);
  };
  const runHealthChecks = () => {
    // burada gerçek health endpointlerine istek atabilirsin
    setHealth((h) => h.map((x) => ({ ...x })));
  };
  const killAllSessions = () => {
    setAudit((a) => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "SESSIONS_KILL_ALL" }, ...a]);
    alert("Tüm oturumlar sonlandırıldı (mock).");
  };
  const clearCaches = () => {
    setAudit((a) => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "CACHE_CLEAR" }, ...a]);
    alert("Önbellek temizlendi (mock).");
  };
  const backupExport = () => {
    setAudit((a) => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "BACKUP_EXPORT" }, ...a]);
    alert("Yedek indirildi (mock).");
  };
  const backupImport = () => {
    setAudit((a) => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "BACKUP_IMPORT" }, ...a]);
    alert("Yedek içe aktarıldı (mock).");
  };
  const testVisionKey = () => {
    // mock test
    const ok = Math.random() > 0.2;
    setAudit((a) => [
      { id: crypto.randomUUID(), ts: new Date().toISOString(), actor: "Admin", action: "VISION_KEY_TEST", meta: { ok } },
      ...a,
    ]);
    alert(ok ? "Vision API anahtarı geçerli görünüyor (mock)." : "Vision API hatası (mock).");
  };

  const TabBtn: React.FC<{ id: typeof activeTab; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
        activeTab === id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="w-6 h-6" /> Sistem Yönetimi
          </h1>
          <p className="text-gray-500">Bakım modu, özellik bayrakları, sağlık, güvenlik, entegrasyonlar ve loglar.</p>
        </div>
        <div className="flex gap-2">
          <TabBtn id="genel" label="Genel" icon={<Settings2 className="w-4 h-4" />} />
          <TabBtn id="guvenlik" label="Güvenlik" icon={<Shield className="w-4 h-4" />} />
          <TabBtn id="entegrasyon" label="Entegrasyonlar" icon={<Link2 className="w-4 h-4" />} />
          <TabBtn id="altyapi" label="Bakım & Altyapı" icon={<Server className="w-4 h-4" />} />
          <TabBtn id="loglar" label="Loglar" icon={<Activity className="w-4 h-4" />} />
        </div>
      </div>

      {/* ENV Banner (opsiyonel) */}
      <div className="mb-6 rounded-xl border p-3 flex items-center justify-between" style={{ borderColor: envColor }}>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" style={{ color: envColor }} />
          <span className="text-sm text-gray-600">Ortam:</span>
          <Badge tone="blue">{envTitle} ({envName})</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <select className="rounded border-gray-300" value={envName} onChange={(e) => setEnvName(e.target.value as any)}>
            <option value="dev">dev</option>
            <option value="stage">stage</option>
            <option value="prod">prod</option>
          </select>
          <input className="rounded border-gray-300" value={envTitle} onChange={(e) => setEnvTitle(e.target.value)} placeholder="Banner başlığı" />
          <input className="rounded border-gray-300 w-28" value={envColor} onChange={(e) => setEnvColor(e.target.value)} type="color" title="Renk" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "genel" && (
          <>
            <Section title="Bakım Modu" icon={<Wrench className="w-5 h-5 text-blue-600" />} desc="Sistemi geçici olarak bakım moduna al.">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {maintenanceOn ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-gray-400" />}
                  <div>
                    <div className="font-medium">{maintenanceOn ? "Bakım modu AÇIK" : "Bakım modu KAPALI"}</div>
                    <p className="text-sm text-gray-500">Son kullanıcılar mesajı görür, kritik mutasyonlar durur.</p>
                  </div>
                </div>
                <button
                  onClick={toggleMaintenance}
                  className={`px-4 py-2 rounded-lg font-medium border transition ${
                    maintenanceOn ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700" : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
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
                  <input type="checkbox" checked={maintenanceBanner} onChange={(e) => setMaintenanceBanner(e.target.checked)} />
                  Oturum açmış kullanıcılara üst banner göster
                </label>
                <button onClick={saveMaintenanceMsg} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  <Save className="w-4 h-4" /> Kaydet
                </button>
              </div>
            </Section>

            <Section title="Özellik Bayrakları" icon={<Sparkles className="w-5 h-5 text-blue-600" />} desc="İsteğe bağlı özellikleri aç/kapat.">
              <div className="grid md:grid-cols-2 gap-3">
                {flags.map((f) => (
                  <div key={f.key} className="flex items-center justify-between p-3 rounded-xl border">
                    <div>
                      <div className="font-medium">{f.label}</div>
                      {f.description && <div className="text-sm text-gray-500">{f.description}</div>}
                    </div>
                    <button
                      onClick={() => toggleFlag(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${f.enabled ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                    >
                      {f.enabled ? "Açık" : "Kapalı"}
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Sağlık Kontrolleri" icon={<Activity className="w-5 h-5 text-blue-600" />} desc="Bağımlılıkların mevcut durumu.">
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                {health.map((h) => (
                  <div key={h.name} className="p-3 rounded-xl border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {h.name.includes("Database") ? <Database className="w-4 h-4 text-gray-500" /> : h.name.includes("Vision") ? <Cloud className="w-4 h-4 text-gray-500" /> : <Server className="w-4 h-4 text-gray-500" />}
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

            <Section title="İş Kuralları" icon={<SlidersHorizontal className="w-5 h-5 text-blue-600" />} desc="SKTT eşiği ve kota/limitler.">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border">
                  <div className="text-sm text-gray-500 mb-1">SKTT Eşiği (Mesken)</div>
                  <input type="number" className="w-full rounded-lg border-gray-300" value={skttResidential} onChange={(e) => setSkttResidential(+e.target.value)} />
                  <div className="text-xs text-gray-500 mt-1">kWh / yıl</div>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="text-sm text-gray-500 mb-1">SKTT Eşiği (Ticarethane & Sanayi)</div>
                  <input type="number" className="w-full rounded-lg border-gray-300" value={skttBiz} onChange={(e) => setSkttBiz(+e.target.value)} />
                  <div className="text-xs text-gray-500 mt-1">kWh / yıl</div>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="text-sm text-gray-500 mb-1">Oran Sınırlayıcı (istek/dakika)</div>
                  <input type="number" className="w-full rounded-lg border-gray-300" value={reqPerMin} onChange={(e) => setReqPerMin(+e.target.value)} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-xl border">
                  <div className="text-sm text-gray-500 mb-1">Günlük OCR Kotası</div>
                  <input type="number" className="w-full rounded-lg border-gray-300" value={dailyOcrQuota} onChange={(e) => setDailyOcrQuota(+e.target.value)} />
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="text-sm text-gray-500 mb-1">Log Saklama (gün)</div>
                  <input type="number" className="w-full rounded-lg border-gray-300" value={retentionDaysLog} onChange={(e) => setRetentionDaysLog(+e.target.value)} />
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="text-sm text-gray-500 mb-1">OCR Metin Saklama (gün)</div>
                  <input type="number" className="w-full rounded-lg border-gray-300" value={retentionDaysOcr} onChange={(e) => setRetentionDaysOcr(+e.target.value)} />
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "guvenlik" && (
          <>
            <Section title="Parola Politikası" icon={<KeyRound className="w-5 h-5 text-blue-600" />} desc="Minimum uzunluk ve karmaşıklık.">
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Minimum Uzunluk</label>
                  <input type="number" min={6} className="w-full rounded-lg border-gray-300" value={passwordPolicy.minLen} onChange={(e) => setPasswordPolicy((p) => ({ ...p, minLen: Number(e.target.value) }))} />
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={passwordPolicy.requireUpper} onChange={(e) => setPasswordPolicy((p) => ({ ...p, requireUpper: e.target.checked }))} />Büyük harf</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={passwordPolicy.requireNumber} onChange={(e) => setPasswordPolicy((p) => ({ ...p, requireNumber: e.target.checked }))} />Rakam</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={passwordPolicy.requireSymbol} onChange={(e) => setPasswordPolicy((p) => ({ ...p, requireSymbol: e.target.checked }))} />Sembol</label>
              </div>
            </Section>

            <Section title="Oturum & 2FA & IP" icon={<ShieldCheck className="w-5 h-5 text-blue-600" />} desc="Güvenlik zorlamaları.">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border flex items-center justify-between">
                  <div>
                    <div className="font-medium">2FA Zorunlu</div>
                    <div className="text-sm text-gray-500">Tüm kullanıcılar için 2 adımlı doğrulama.</div>
                  </div>
                  <button onClick={() => setForce2FA((v) => !v)} className={`px-3 py-1.5 rounded-lg border ${force2FA ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>{force2FA ? "Açık" : "Kapalı"}</button>
                </div>
                <div className="p-4 rounded-xl border flex items-center justify-between">
                  <div>
                    <div className="font-medium">Oturum Süresi</div>
                    <div className="text-sm text-gray-500">Otomatik çıkış için saat cinsinden.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} className="w-24 rounded-lg border-gray-300" value={sessionTTL} onChange={(e) => setSessionTTL(Number(e.target.value))} />
                    <span className="text-sm text-gray-600">saat</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="font-medium mb-1">IP Allowlist (CSV)</div>
                  <textarea className="w-full rounded-lg border-gray-300" rows={1} value={ipAllowlist} onChange={(e) => setIpAllowlist(e.target.value)} />
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "entegrasyon" && (
          <>
            <Section title="Supabase" icon={<Database className="w-5 h-5 text-blue-600" />} desc="Bağlantı bilgileri.">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">URL</div>
                  <input className="w-full rounded-lg border-gray-300" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} />
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Anon Key</div>
                  <div className="flex items-center gap-2">
                    <input className="w-full rounded-lg border-gray-300" value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} type={showKeys ? "text" : "password"} />
                    <button className="p-2 rounded-lg border" onClick={() => setShowKeys((v) => !v)} title="Göster/Gizle">
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Google Vision" icon={<Cloud className="w-5 h-5 text-blue-600" />} desc="OCR yapılandırması.">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600 mb-1">API Key</div>
                  <div className="flex items-center gap-2">
                    <input className="w-full rounded-lg border-gray-300" value={visionApiKey} onChange={(e) => setVisionApiKey(e.target.value)} type={showKeys ? "text" : "password"} />
                    <button className="p-2 rounded-lg border" onClick={() => setShowKeys((v) => !v)} title="Göster/Gizle">
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={testVisionKey} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
                      <Cpu className="w-4 h-4" /> Test Et
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Webhook URL</div>
                  <input className="w-full rounded-lg border-gray-300" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <Divider />
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Bildirim E-postaları (CSV)</div>
                  <input className="w-full rounded-lg border-gray-300" value={notifEmails} onChange={(e) => setNotifEmails(e.target.value)} />
                </div>
                <div className="flex items-end gap-2">
                  <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
                    <Mail className="w-4 h-4" /> Test E-posta
                  </button>
                  <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
                    <Webhook className="w-4 h-4" /> Test Webhook
                  </button>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === "altyapi" && (
          <>
            <Section title="Yedekleme & Geri Yükleme" icon={<FileDown className="w-5 h-5 text-blue-600" />} desc="Tamamı mock; gerçek uçlara bağlayabilirsin.">
              <div className="flex flex-col md:flex-row gap-3">
                <button onClick={backupExport} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border bg-white hover:bg-gray-50">
                  <FileDown className="w-4 h-4" /> Yedek İndir
                </button>
                <button onClick={backupImport} className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border bg-white hover:bg-gray-50">
                  <FileUp className="w-4 h-4" /> Yedekten Yükle
                </button>
              </div>
            </Section>

            <Section title="Tehlikeli Alan" icon={<AlertTriangle className="w-5 h-5 text-rose-600" />} desc="Geri alınamaz olabilir.">
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

        {activeTab === "loglar" && (
          <Section title="Audit Log" icon={<Activity className="w-5 h-5 text-blue-600" />} desc="Önemli aksiyonlar.">
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
                  {audit.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="py-2">{new Date(i.ts).toLocaleString()}</td>
                      <td className="py-2">{i.actor}</td>
                      <td className="py-2">{i.action}</td>
                      <td className="py-2">{i.target ?? "-"}</td>
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

export default SystemManagementScreen;
