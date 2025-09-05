import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Route as RouteIcon,
  Clock,
} from "lucide-react";

/* =========================
   Tipler & Yardımcılar
   ========================= */
type Customer = {
  id: string;
  name: string;
  address: string;
  status?:
    | "Planlandı"
    | "Satış Yapıldı"
    | "Teklif Verildi"
    | "Reddedildi"
    | "Evde Yok"
    | "Tamamlandı"
    | "İptal"
    | string;
  lat?: number;
  lng?: number;
  visitedAt?: string; // ISO
};

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDlat = Math.sin(dLat / 2);
  const sinDlon = Math.sin(dLon / 2);
  const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}
function fmtDuration(minutes: number) {
  if (!minutes || minutes <= 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m} dk`;
  return `${h} sa ${m} dk`;
}
const isVisited = (s?: string) => !!s && !["Planlandı", "İptal"].includes(s);
const isSale = (s?: string) => s === "Satış Yapıldı" || s === "Tamamlandı";
function startOfMonth(d: Date) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function endOfMonth(d: Date)   { const x = new Date(d); x.setMonth(x.getMonth()+1,0); x.setHours(23,59,59,999); return x; }
const TR_MONTHS_SHORT = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

/* =========================
   Ekran
   ========================= */
const ReportsScreen: React.FC<{ customers: Customer[] }> = ({ customers }) => {
  const [period, setPeriod] = useState<'gunluk' | 'haftalik' | 'aylik'>('gunluk');
  const [showMoreKPIs, setShowMoreKPIs] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dayNotes, setDayNotes] = useState("");

  useEffect(() => {
    const isXL = window.innerWidth >= 1280;
    setShowMoreKPIs(isXL);
    setShowNotes(isXL);
  }, []);

  // Dönem başlangıcı
  const periodStart = useMemo(() => {
    const d = new Date();
    if (period === 'gunluk')      d.setHours(0, 0, 0, 0);
    else if (period === 'haftalik'){ d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); }
    else                          { d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); }
    return d.getTime();
  }, [period]);

  const inPeriod = useMemo(
    () => customers.filter(c => c.visitedAt && +new Date(c.visitedAt) >= periodStart),
    [customers, periodStart]
  );
  const visited = useMemo(() => inPeriod.filter(c => isVisited(c.status)), [inPeriod]);
  const salesCount = useMemo(() => visited.filter(c => isSale(c.status)).length, [visited]);
  const offersGiven = useMemo(() => visited.filter(c => (c.status||"")==="Teklif Verildi").length, [visited]);
  const rejected = useMemo(() => visited.filter(c => (c.status||"")==="Reddedildi").length, [visited]);
  const noAnswer = useMemo(() => visited.filter(c => (c.status||"")==="Evde Yok").length, [visited]);
  const salesRate = useMemo(() => visited.length ? Math.round((salesCount/visited.length)*100) : 0, [visited.length, salesCount]);

  // KM & Zaman
  const kmStats = useMemo(() => {
    const withGeo = visited.filter(c => typeof c.lat==='number' && typeof c.lng==='number')
      .sort((a,b)=> (+new Date(a.visitedAt || 0)) - (+new Date(b.visitedAt || 0)));
    if (withGeo.length < 2) return { total:0, legs:0, avg:0 };
    let total = 0;
    for (let i=1;i<withGeo.length;i++){
      total += distanceKm({lat:withGeo[i-1].lat!,lng:withGeo[i-1].lng!},{lat:withGeo[i].lat!,lng:withGeo[i].lng!});
    }
    return { total: +(total.toFixed(1)), legs: withGeo.length-1, avg: +((total/(withGeo.length-1)).toFixed(1)) };
  }, [visited]);

  const timeStats = useMemo(()=>{
    const withTime = visited.filter(c=>!!c.visitedAt);
    if (withTime.length<2) return { minutes:0, visitsPerHour:0 };
    const times = withTime.map(c=>+new Date(c.visitedAt!)).sort((a,b)=>a-b);
    const minutes = (times.at(-1)! - times[0]) / 60000;
    const vph = minutes>0 ? +(withTime.length/(minutes/60)).toFixed(1) : 0;
    return { minutes, visitsPerHour: vph };
  },[visited]);

  const rejectedRate = useMemo(()=> visited.length ? Math.round((rejected/visited.length)*100) : 0,[visited.length,rejected]);
  const noAnswerRate = useMemo(()=> visited.length ? Math.round((noAnswer/visited.length)*100) : 0,[visited.length,noAnswer]);
  const offerToSale = useMemo(()=> offersGiven ? Math.round((salesCount/Math.max(offersGiven,1))*100) : 0,[offersGiven,salesCount]);

  // Notlar
  useEffect(()=>{ const s = localStorage.getItem(`dayClose:${todayKey}`); if(s){ try{ setDayNotes(JSON.parse(s)?.notes??""); }catch{} }},[todayKey]);
  useEffect(()=>{ localStorage.setItem(`dayClose:${todayKey}`, JSON.stringify({notes:dayNotes})); },[dayNotes,todayKey]);

  const dateLabel = useMemo(()=> new Date().toLocaleDateString('tr-TR',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),[]);
  const periodLabel = period==='gunluk'?'Günlük':period==='haftalik'?'Haftalık':'Aylık';

  /* ========= Grafik verileri ========= */

  // Aylık stacked (ziyaret & satış) + yüzde
  const monthlyBars = useMemo(() => {
    const now = new Date();
    return Array.from({length:6}).map((_,i)=>{
      const d = new Date(now.getFullYear(), now.getMonth()-(5-i), 1);
      const label = `${TR_MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      const start = +startOfMonth(d);
      const end   = +endOfMonth(d);
      const monthItems = customers.filter(c => c.visitedAt && (+new Date(c.visitedAt) >= start && +new Date(c.visitedAt) <= end));
      const visitedCount = monthItems.filter(c=>isVisited(c.status)).length;
      const sales = monthItems.filter(c=>isSale(c.status)).length;
      const rate = visitedCount ? Math.round((sales/visitedCount)*100) : 0;
      return { label, visited: visitedCount, sales, rate };
    });
  }, [customers]);

  // Dağılım (seçili dönem)
  const statusRows = useMemo(()=>{
    const counts: Record<string, number> = {};
    visited.forEach(c=>{
      const key = c.status || "Diğer";
      counts[key] = (counts[key]||0) + 1;
    });
    const order = ["Teklif Verildi","Satış Yapıldı","Tamamlandı","Reddedildi","Evde Yok"];
    const keys = Array.from(new Set([...order, ...Object.keys(counts)]));
    const total = Object.values(counts).reduce((a,b)=>a+b,0) || 1;
    return keys.map(k=>({ key:k, value: counts[k]||0, pct: Math.round(((counts[k]||0)/total)*100) }))
               .filter(r=>r.value>0);
  },[visited]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Başlık & Dönem */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Raporlar</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="inline-flex rounded-xl overflow-hidden border">
            {(["gunluk","haftalik","aylik"] as const).map(p=>(
              <button key={p} onClick={()=>setPeriod(p)}
                className={`px-3 md:px-4 py-2 text-sm transition ${period===p?'bg-[#F9C800] text-black':'bg-white hover:bg-gray-50'}`}>
                {p==="gunluk"?"Günlük":p==="haftalik"?"Haftalık":"Aylık"}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowMoreKPIs(s=>!s)} className="px-3 py-2 text-sm border rounded-xl bg-white hover:bg-gray-50" title="KPI görünümünü genişlet/daralt">
            {showMoreKPIs ? 'Basit KPI' : 'Tüm KPI'}
          </button>
          <button onClick={()=>setShowNotes(s=>!s)} className="px-3 py-2 text-sm border rounded-xl bg-white hover:bg-gray-50">
            {showNotes ? 'Notları Gizle' : 'Notları Göster'}
          </button>
          <div className="hidden md:block text-sm text-gray-600">{dateLabel}</div>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid gap-4 md:gap-6 mb-4 md:mb-6 grid-cols-2 md:grid-cols-4">
        <SummaryCard title={`${periodLabel} Toplam Ziyaret`} value={String(inPeriod.length)} icon={<MapPin className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
        <SummaryCard title={`${periodLabel} Ziyaret Edilen`} value={String(visited.length)} icon={<MapPin className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
        <SummaryCard title="Satış" value={String(salesCount)} icon={<CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-[#10B981]" />} />
        <SummaryCard title="Satış Oranı" value={`%${salesRate}`} icon={<TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-[#F9C800]" />} valueClass="text-[#111827]" />
      </div>

      {showMoreKPIs && (
        <div className="grid gap-4 md:gap-6 mb-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCard title="Teklif" value={String(offersGiven)} icon={<AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
          <SummaryCard title="Toplam KM" value={`${kmStats.total} km`} icon={<Route as any className="w-7 h-7 md:w-8 md:h-8 text-[#F9C800]" />} />
          <SummaryCard title="Ort. KM/Geçiş" value={`${kmStats.avg} km`} icon={<RouteIcon className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
          <SummaryCard title="Reddedilme Oranı" value={`%${rejectedRate}`} icon={<AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-red-500" />} valueClass="text-red-600" />
          <SummaryCard title="Evde Yok Oranı" value={`%${noAnswerRate}`} icon={<AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-gray-500" />} valueClass="text-gray-700" />
          <SummaryCard title="Teklif→Satış" value={`%${offerToSale}`} icon={<TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
          <SummaryCard title="Ziyaret / Saat" value={`${timeStats.visitsPerHour}/s`} icon={<MapPin className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
          <SummaryCard title="Aktif Süre" value={fmtDuration(timeStats.minutes)} icon={<Clock className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
        </div>
      )}

      {/* === Modern Grafikler === */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Aylık Dönüşüm (Son 6 Ay)</h2>
            <span className="text-xs text-gray-500">Satış / Ziyaret</span>
          </div>
          <MonthlyStackedBars data={monthlyBars} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Teklif Durum Dağılımı ({periodLabel})</h2>
          </div>
          <StatusDonut rows={statusRows} />
        </div>
      </div>

      {showNotes && (
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-[#F9C800]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Notlar</h2>
            </div>
            <textarea
              rows={4}
              placeholder="Önemli gözlemler, kampanya geri bildirimleri, sorun/aksiyonlar..."
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F9C800]"
              value={dayNotes}
              onChange={(e) => setDayNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 py-4 text-sm text-gray-500">
        Bu rapor {new Date().toLocaleDateString('tr-TR',{year:'numeric',month:'long',day:'numeric',weekday:'long'})} tarihinde otomatik oluşturulmuştur.
      </div>
    </div>
  );
};

/* =========================
   Özet Kartı
   ========================= */
const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; valueClass?: string }> = ({ title, value, icon, valueClass }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-gray-100">
    <div className="flex justify-between">
      <div>
        <p className="text-xs md:text-sm text-gray-600">{title}</p>
        <p className={`text-xl md:text-2xl font-bold ${valueClass || 'text-[#111827]'}`}>{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

/* =========================
   Chart 1: Modern Stacked Bars
   ========================= */
const MonthlyStackedBars: React.FC<{
  data: { label: string; visited: number; sales: number; rate: number }[];
}> = ({ data }) => {
  const width = 620;
  const height = 280;
  const pad = { top: 18, right: 18, bottom: 56, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const barGap = 18;
  const barW = Math.max(16, Math.floor((innerW - barGap * (data.length - 1)) / data.length));
  const maxVisited = Math.max(1, ...data.map(d => d.visited));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72" role="img" aria-label="Aylık stacked dönüşüm grafiği">
        <defs>
          <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BFEAF6" />
            <stop offset="100%" stopColor="#E8F6FB" />
          </linearGradient>
          <linearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#28B5E1" />
            <stop offset="100%" stopColor="#0FA9E6" />
          </linearGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* y grid */}
        {[0,25,50,75,100].map(v=>{
          const y = pad.top + innerH - (v/100)*innerH;
          return (
            <g key={v}>
              <line x1={pad.left} x2={pad.left+innerW} y1={y} y2={y} stroke="#EEF2F7" strokeWidth={1} />
              <text x={8} y={y-2} fontSize={10} fill="#94A3B8">%{v}</text>
            </g>
          );
        })}

        {/* bars */}
        {data.map((d,i)=>{
          const x = pad.left + i*(barW+barGap);
          const baseH = (d.visited/maxVisited)*innerH;
          const topH  = d.visited ? (d.sales/d.visited)*baseH : 0;
          const baseY = pad.top + innerH - baseH;
          const topY  = baseY + (baseH - topH);

          return (
            <g key={d.label} filter="url(#soft)">
              {/* base (visited) */}
              <rect x={x} y={baseY} width={barW} height={baseH} rx={10} ry={10} fill="url(#gradBase)">
                <title>{`${d.label}\nZiyaret: ${d.visited}`}</title>
              </rect>
              {/* top (sales) */}
              <rect x={x} y={topY} width={barW} height={Math.max(0, topH)} rx={10} ry={10} fill="url(#gradTop)">
                <title>{`${d.label}\nSatış: ${d.sales}`}</title>
              </rect>

              {/* yüzde etiketi */}
              <text x={x + barW/2} y={topY-6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0F172A">
                %{d.rate}
              </text>

              {/* alt etiketler */}
              <text x={x + barW/2} y={pad.top + innerH + 18} textAnchor="middle" fontSize={11} fill="#64748B">{d.label}</text>
              <text x={x + barW/2} y={pad.top + innerH + 34} textAnchor="middle" fontSize={10} fill="#94A3B8">
                {d.sales}/{d.visited}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
          <span className="inline-block w-3 h-3 rounded-sm" style={{background:'#BFEAF6'}} />
          Ziyaret
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
          <span className="inline-block w-3 h-3 rounded-sm" style={{background:'#0FA9E6'}} />
          Satış
        </span>
      </div>
    </div>
  );
};

/* =========================
   Chart 2: Donut (Status)
   ========================= */
const StatusDonut: React.FC<{
  rows: { key: string; value: number; pct: number }[];
}> = ({ rows }) => {
  const total = rows.reduce((a,b)=>a+b.value,0) || 1;

  // renk paleti (enerjisa uyumlu, modern)
  const colorMap: Record<string,string> = {
    "Teklif Verildi":"#0FA9E6",
    "Satış Yapıldı":"#10B981",
    "Tamamlandı":"#34D399",
    "Reddedildi":"#EF4444",
    "Evde Yok":"#9CA3AF",
    "Diğer":"#F59E0B",
  };

  const width = 320, height = 320, cx = width/2, cy = height/2;
  const outerR = 120, innerR = 78;
  const gap = 0.02; // küçük boşluk
  const circumference = 2*Math.PI*outerR;
  const sum = rows.reduce((a,b)=>a+b.value,0) || 1;

  let acc = 0;
  const arcs = rows.map(r=>{
    const frac = r.value/sum;
    const len = (circumference*(frac - gap));
    const dash = `${Math.max(0,len)} ${circumference}`;
    const rot = (acc + gap/2) * 360;
    acc += frac;
    return {...r, dash, rot};
  });

  const top = rows.slice().sort((a,b)=>b.value-a.value)[0];

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-sm">
        <defs>
          <filter id="soft2" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* arka halka */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#F1F5F9" strokeWidth={outerR - innerR} />

        {/* dilimler */}
        {arcs.map(a=>(
          <circle key={a.key}
            cx={cx} cy={cy} r={outerR}
            fill="none"
            stroke={colorMap[a.key] || "#F59E0B"}
            strokeWidth={outerR - innerR}
            strokeDasharray={a.dash}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy}) rotate(${a.rot} ${cx} ${cy})`}
            filter="url(#soft2)"
          >
            <title>{`${a.key}: ${a.value} (${a.pct}%)`}</title>
          </circle>
        ))}

        {/* merkez metin */}
        <text x={cx} y={cy-4} textAnchor="middle" fontSize={28} fontWeight={800} fill="#0F172A">
          {total}
        </text>
        <text x={cx} y={cy+18} textAnchor="middle" fontSize={12} fill="#64748B">
          Toplam
        </text>
        {top && (
          <text x={cx} y={cy+40} textAnchor="middle" fontSize={12} fill="#94A3B8">
            En çok: {top.key} ({top.pct}%)
          </text>
        )}
      </svg>

      {/* Legend pills */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map(r=>(
          <span key={r.key}
            className="inline-flex items-center gap-2 text-xs text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-full">
            <span className="w-3 h-3 rounded-sm" style={{background: colorMap[r.key] || "#F59E0B"}} />
            {r.key} • {r.value} ({r.pct}%)
          </span>
        ))}
      </div>
    </div>
  );
};

/* =========================
   Demo Datası & Wrapper
   ========================= */
const baselineCustomers: Customer[] = [
  { id: '1',  name: 'Mehmet Yılmaz', address: 'Kadıköy – Bahariye Cd.', status: 'Satış Yapıldı',  lat: 40.989, lng: 29.027, visitedAt: new Date().toISOString() },
  { id: '2',  name: 'Ayşe Demir',   address: 'Kadıköy – Moda Sahil',   status: 'Teklif Verildi', lat: 40.983, lng: 29.032, visitedAt: new Date(Date.now() - 60*60*1000).toISOString() },
  { id: '3',  name: 'Ali Kaya',     address: 'Kadıköy – Fikirtepe',    status: 'Reddedildi',     lat: 40.995, lng: 29.055, visitedAt: new Date(Date.now() - 2*60*60*1000).toISOString() },
  { id: '4',  name: 'Zeynep Koç',   address: 'Kadıköy – Suadiye',      status: 'Evde Yok' },
  { id: '5',  name: 'Elif Çetin',   address: 'Kadıköy – Kozyatağı',    status: 'Tamamlandı',     lat: 40.977, lng: 29.092, visitedAt: new Date(Date.now() - 3*60*60*1000).toISOString() },
  { id: '6',  name: 'Mert Öz',      address: 'Kadıköy – Erenköy',      status: 'Planlandı' },
  { id: '7',  name: 'Gizem Sarı',   address: 'Kadıköy – Bostancı',     status: 'Teklif Verildi', lat: 40.967, lng: 29.120, visitedAt: new Date(Date.now() - 4*60*60*1000).toISOString() },
  { id: '8',  name: 'Oğuz Yalçın',  address: 'Kadıköy – Caddebostan',  status: 'Satış Yapıldı',  lat: 40.971, lng: 29.075, visitedAt: new Date(Date.now() - 5*60*60*1000).toISOString() },
  { id: '9',  name: 'Büşra Ak',     address: 'Kadıköy – Göztepe',      status: 'İptal' },
  { id: '10', name: 'Can Kurt',     address: 'Kadıköy – Hasanpaşa',    status: 'Reddedildi',     lat: 41.005, lng: 29.036, visitedAt: new Date(Date.now() - 6*60*60*1000).toISOString() },
];

const onlyPlanned: Customer[] = [
  { id: '1', name: 'Müşteri A', address: 'Adres 1', status: 'Planlandı' },
  { id: '2', name: 'Müşteri B', address: 'Adres 2', status: 'Planlandı' },
];

const noGeoVisited: Customer[] = [
  { id: '1', name: 'Müşteri C', address: 'Adres 3', status: 'Satış Yapıldı',   visitedAt: new Date().toISOString() },
  { id: '2', name: 'Müşteri D', address: 'Adres 4', status: 'Teklif Verildi',  visitedAt: new Date(Date.now() - 30*60*1000).toISOString() },
];

const weeklyMixed: Customer[] = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  name: `Hafta Müşteri ${i + 1}`,
  address: `Adres ${i + 1}`,
  status: i % 3 === 0 ? 'Satış Yapıldı' : i % 3 === 1 ? 'Teklif Verildi' : 'Reddedildi',
  lat: 40.95 + i * 0.01,
  lng: 29.03 + i * 0.01,
  visitedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
}));

const monthlyGeo: Customer[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `m-${i + 1}`,
  name: `Aylık Müşteri ${i + 1}`,
  address: `Aylık Adres ${i + 1}`,
  status: i % 4 === 0 ? 'Evde Yok' : i % 4 === 1 ? 'Tamamlandı' : i % 4 === 2 ? 'Teklif Verildi' : 'Reddedildi',
  lat: 40.90 + (i % 5) * 0.02,
  lng: 29.00 + (i % 5) * 0.02,
  visitedAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
}));

export default function DemoReports() {
  const [caseKey, setCaseKey] = useState<'baseline' | 'onlyPlanned' | 'noGeoVisited' | 'weeklyMixed' | 'monthlyGeo'>('baseline');
  const dataMap: Record<string, Customer[]> = { baseline: baselineCustomers, onlyPlanned, noGeoVisited, weeklyMixed, monthlyGeo };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">Test Datası:</span>
        {(['baseline','onlyPlanned','noGeoVisited','weeklyMixed','monthlyGeo'] as const).map(k => (
          <button
            key={k}
            onClick={() => setCaseKey(k)}
            className={`px-3 py-1.5 rounded-lg border transition ${caseKey === k ? 'bg-[#F9C800] text-black' : 'bg-white hover:bg-gray-50'}`}
          >{k}</button>
        ))}
      </div>
      <ReportsScreen customers={dataMap[caseKey]} />
    </div>
  );
}
