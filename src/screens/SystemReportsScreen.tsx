import React, { useMemo, useState } from "react";
import { CalendarDays, Download, Filter, Gauge, LineChart as LineIcon, PieChart as PieIcon, BarChart as BarIcon, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

/* ==== Mock veri – yerine gerçek API bağla ==== */
const now = Date.now();
const day = 1000 * 60 * 60 * 24;

const requestsDaily = Array.from({ length: 14 }).map((_, i) => ({
  day: new Date(now - (13 - i) * day).toLocaleDateString(),
  total: Math.floor(1200 + Math.random() * 900),
  errors: Math.floor(20 + Math.random() * 30),
}));

const latencyRouteMs = Array.from({ length: 14 }).map((_, i) => ({
  day: new Date(now - (13 - i) * day).toLocaleDateString(),
  p50: Math.floor(220 + Math.random() * 40),
  p95: Math.floor(480 + Math.random() * 80),
}));

const ocrThroughput = Array.from({ length: 14 }).map((_, i) => ({
  day: new Date(now - (13 - i) * day).toLocaleDateString(),
  processed: Math.floor(50 + Math.random() * 40),
}));

const activeUsersByRole = [
  { role: "admin", count: 3 },
  { role: "manager", count: 8 },
  { role: "rep", count: 41 },
  { role: "viewer", count: 6 },
];

const featureAdoption = [
  { key: "Fatura OCR", value: 68 },
  { key: "Rota Optimizasyon v2", value: 41 },
  { key: "SatışGPT Asistan", value: 55 },
];

const recentErrors = Array.from({ length: 12 }).map((_, i) => ({
  ts: new Date(now - i * 3600_000).toLocaleString(),
  area: i % 3 === 0 ? "OCR" : i % 3 === 1 ? "OSRM" : "Supabase",
  message: i % 3 === 0 ? "Vision API 429" : i % 3 === 1 ? "Route service timeout" : "Function cold start",
  count: 1 + (i % 4),
}));

/* ==== Yardımcılar ==== */
const Card: React.FC<{title?:string; subtitle?:string; right?:React.ReactNode;}> = ({ title, subtitle, right, children }) => (
  <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
    <div className="flex items-start justify-between mb-3">
      <div>
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Kpi: React.FC<{label:string; value:string; trend?:string;}> = ({ label, value, trend }) => (
  <div className="p-4 rounded-xl border">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
    {trend && <div className="text-xs text-gray-500 mt-1">{trend}</div>}
  </div>
);

/* ==== CSV Export ==== */
function exportCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ==== Ekran ==== */
const SystemReportsScreen: React.FC = () => {
  const [range, setRange] = useState<"7d"|"14d"|"30d"|"custom">("14d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const filteredRequests = useMemo(() => {
    if (range!=="custom") return requestsDaily;
    const start = customStart ? new Date(customStart).getTime() : -Infinity;
    const end = customEnd ? new Date(customEnd).getTime() : Infinity;
    return requestsDaily.filter(d => {
      const t = new Date(d.day).getTime();
      return t >= start && t <= end;
    });
  }, [range, customStart, customEnd]);

  const totalReq = filteredRequests.reduce((a,b)=>a+b.total,0);
  const totalErr = filteredRequests.reduce((a,b)=>a+b.errors,0);
  const errRate = totalReq ? (100 * totalErr / totalReq) : 0;

  const latestLatency = latencyRouteMs[latencyRouteMs.length-1];
  const latestOCR = ocrThroughput[ocrThroughput.length-1];

  return (
    <div className="p-6">
      {/* Başlık & Filtre */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📊 Sistem Raporları
          </h1>
          <p className="text-gray-600">KPI’lar, kullanım, hatalar ve performans metrikleri.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 p-2 rounded-xl border bg-white">
            <Filter className="w-4 h-4 text-gray-500" />
            <select className="border-0 focus:ring-0" value={range} onChange={(e)=>setRange(e.target.value as any)}>
              <option value="7d">Son 7 gün</option>
              <option value="14d">Son 14 gün</option>
              <option value="30d">Son 30 gün</option>
              <option value="custom">Özel</option>
            </select>
            {range==="custom" && (
              <>
                <CalendarDays className="w-4 h-4 text-gray-500" />
                <input type="date" className="border rounded px-2 py-1" value={customStart} onChange={(e)=>setCustomStart(e.target.value)} />
                <span className="text-gray-400">—</span>
                <input type="date" className="border rounded px-2 py-1" value={customEnd} onChange={(e)=>setCustomEnd(e.target.value)} />
              </>
            )}
          </div>
          <button onClick={()=>window.location.reload()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Yenile
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Toplam İstek (seçili aralık)" value={totalReq.toLocaleString()} trend={`Hata oranı ${errRate.toFixed(2)}%`} />
        <Kpi label="Route p95 (ms)" value={`${latestLatency.p95}`} trend={`p50: ${latestLatency.p50} ms`} />
        <Kpi label="OCR İşlenen (günlük)" value={`${latestOCR.processed}`} trend="Yaklaşık throughput" />
        <Kpi label="Aktif Kullanıcı (rol)" value={activeUsersByRole.reduce((a,b)=>a+b.count,0).toString()} trend="admin/manager/rep/viewer" />
      </div>

      {/* Grafikler */}
      <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6">
        <Card title="Günlük İstekler" subtitle="Toplam ve hata sayısı" right={<LineIcon className="w-4 h-4 text-gray-400" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredRequests}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" /><YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="errors" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm text-gray-500">Toplam: {totalReq.toLocaleString()} • Hata: {totalErr.toLocaleString()} • Oran: {errRate.toFixed(2)}%</div>
        </Card>

        <Card title="Rota Hesaplama Gecikmesi" subtitle="p50 / p95 (ms)" right={<Gauge className="w-4 h-4 text-gray-400" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyRouteMs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" /><YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="p50" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="OCR Throughput" subtitle="Günlük işlenen fatura sayısı" right={<BarIcon className="w-4 h-4 text-gray-400" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ocrThroughput}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" /><YAxis />
                <Tooltip />
                <Bar dataKey="processed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Aktif Kullanıcılar (Role Göre)" subtitle="Son 24s" right={<BarIcon className="w-4 h-4 text-gray-400" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeUsersByRole}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" /><YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Özellik Benimsenmesi" subtitle="Son 7g kullanım oranı" right={<PieIcon className="w-4 h-4 text-gray-400" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={featureAdoption} dataKey="value" nameKey="key" outerRadius={90} label>
                  {featureAdoption.map((_, idx) => <Cell key={idx} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Hata Günlüğü (Son 12 Kayıt)" subtitle="Alan bazlı toplu görünüm" right={
          <button onClick={()=>exportCsv("recent_errors.csv", recentErrors)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
            <Download className="w-4 h-4" /> CSV
          </button>
        }>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Zaman</th><th className="py-2">Alan</th><th className="py-2">Mesaj</th><th className="py-2">Adet</th>
                </tr>
              </thead>
              <tbody>
                {recentErrors.map((e, i)=>(
                  <tr key={i} className="border-t">
                    <td className="py-2">{e.ts}</td><td className="py-2">{e.area}</td><td className="py-2">{e.message}</td><td className="py-2">{e.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemReportsScreen;
