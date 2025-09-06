import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Route as RouteIcon,
  Clock,
} from "lucide-react";

// Basit Customer tipi (self-contained)
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

// --- Haversine (km) ---
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

// --- Raporlar Bileşeni (Günlük/Haftalık/Aylık) ---
const ReportsScreen: React.FC<{ customers: Customer[] }> = ({ customers }) => {
  const [period, setPeriod] = useState<'gunluk' | 'haftalik' | 'aylik'>('gunluk');
  const [showMoreKPIs, setShowMoreKPIs] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dayNotes, setDayNotes] = useState("");

  // Tablet için sade başlangıç (XL ve üstünde tam görünüm)
  useEffect(() => {
    const isXL = window.innerWidth >= 1280; // ~tablet landscape altı => sade
    setShowMoreKPIs(isXL);
    setShowNotes(isXL);
  }, []);

  // Dönem başlangıcı
  const periodStart = useMemo(() => {
    const d = new Date();
    if (period === 'gunluk') {
      d.setHours(0, 0, 0, 0);
    } else if (period === 'haftalik') {
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
    } else {
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
    }
    return d.getTime();
  }, [period]);

  // Dönem filtresi (visitedAt >= periodStart)
  const inPeriod = useMemo(
    () =>
      customers.filter((c) => {
        if (!c.visitedAt) return false;
        const t = +new Date(c.visitedAt);
        return t >= periodStart;
      }),
    [customers, periodStart]
  );

  const visited = useMemo(
    () =>
      inPeriod.filter(
        (c) => c.status && c.status !== 'Planlandı' && c.status !== 'İptal'
      ),
    [inPeriod]
  );

  const salesCount = useMemo(
    () => visited.filter((c) => (c.status || '') === 'Satış Yapıldı' || (c.status || '') === 'Tamamlandı').length,
    [visited]
  );

  const offersGiven = useMemo(
    () => visited.filter((c) => (c.status || '') === 'Teklif Verildi').length,
    [visited]
  );

  const rejected = useMemo(
    () => visited.filter((c) => (c.status || '') === 'Reddedildi').length,
    [visited]
  );

  const noAnswer = useMemo(
    () => visited.filter((c) => (c.status || '') === 'Evde Yok').length,
    [visited]
  );

  const salesRate = useMemo(
    () => (visited.length ? Math.round((salesCount / visited.length) * 100) : 0),
    [visited.length, salesCount]
  );

  // KM istatistikleri (otomatik, manuel giriş yok)
  const kmStats = useMemo(() => {
    const withGeo = visited
      .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number')
      .sort((a, b) => {
        const ta = a.visitedAt ? +new Date(a.visitedAt) : 0;
        const tb = b.visitedAt ? +new Date(b.visitedAt) : 0;
        return ta - tb;
      });
    if (withGeo.length < 2) return { total: 0, legs: 0, avg: 0 };
    let total = 0;
    for (let i = 1; i < withGeo.length; i++) {
      total += distanceKm(
        { lat: withGeo[i - 1].lat!, lng: withGeo[i - 1].lng! },
        { lat: withGeo[i].lat!, lng: withGeo[i].lng! }
      );
    }
    const totalRounded = Math.round(total * 10) / 10;
    const avgRounded = Math.round((total / (withGeo.length - 1)) * 10) / 10;
    return { total: totalRounded, legs: withGeo.length - 1, avg: avgRounded };
  }, [visited]);

  // Zaman istatistikleri
  const timeStats = useMemo(() => {
    const withTime = visited.filter((c) => !!c.visitedAt);
    if (withTime.length < 2) return { minutes: 0, visitsPerHour: 0 };
    const times = withTime.map((c) => +new Date(c.visitedAt!)).sort((a, b) => a - b);
    const minutes = (times[times.length - 1] - times[0]) / 60000;
    const vph = minutes > 0 ? +(withTime.length / (minutes / 60)).toFixed(1) : 0;
    return { minutes, visitsPerHour: vph };
  }, [visited]);

  const rejectedRate = useMemo(
    () => (visited.length ? Math.round((rejected / visited.length) * 100) : 0),
    [visited.length, rejected]
  );
  const noAnswerRate = useMemo(
    () => (visited.length ? Math.round((noAnswer / visited.length) * 100) : 0),
    [visited.length, noAnswer]
  );
  const offerToSale = useMemo(
    () => (offersGiven ? Math.round((salesCount / Math.max(offersGiven, 1)) * 100) : 0),
    [offersGiven, salesCount]
  );

  // Not saklama (günlük anahtarla, UI basitliği için)
  useEffect(() => {
    const saved = localStorage.getItem(`dayClose:${todayKey}`);
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        setDayNotes(obj.notes ?? "");
      } catch {}
    }
  }, [todayKey]);

  useEffect(() => {
    const payload = JSON.stringify({ notes: dayNotes });
    localStorage.setItem(`dayClose:${todayKey}`, payload);
  }, [dayNotes, todayKey]);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  const periodLabel = period === 'gunluk' ? 'Günlük' : period === 'haftalik' ? 'Haftalık' : 'Aylık';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Başlık & Dönem Seçimi */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Raporlar</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="inline-flex rounded-xl overflow-hidden border">
            <button
              onClick={() => setPeriod('gunluk')}
              className={`px-3 md:px-4 py-2 text-sm ${period === 'gunluk' ? 'bg-[#F9C800] text-black' : 'bg-white hover:bg-gray-50'}`}
            >Günlük</button>
            <button
              onClick={() => setPeriod('haftalik')}
              className={`px-3 md:px-4 py-2 text-sm ${period === 'haftalik' ? 'bg-[#F9C800] text-black' : 'bg-white hover:bg-gray-50'}`}
            >Haftalık</button>
            <button
              onClick={() => setPeriod('aylik')}
              className={`px-3 md:px-4 py-2 text-sm ${period === 'aylik' ? 'bg-[#F9C800] text-black' : 'bg-white hover:bg-gray-50'}`}
            >Aylık</button>
          </div>
          <button
            onClick={() => setShowMoreKPIs((s) => !s)}
            className="px-3 py-2 text-sm border rounded-xl bg-white hover:bg-gray-50"
            title="KPI görünümünü genişlet/daralt"
          >{showMoreKPIs ? 'Basit KPI' : 'Tüm KPI'}</button>
          <button
            onClick={() => setShowNotes((s) => !s)}
            className="px-3 py-2 text-sm border rounded-xl bg-white hover:bg-gray-50"
          >{showNotes ? 'Notları Gizle' : 'Notları Göster'}</button>
          <div className="hidden md:block text-sm text-gray-600">{dateLabel}</div>
        </div>
      </div>

      {/* KPI Kartları – ÖNEMLİLER */}
      <div className="grid gap-4 md:gap-6 mb-4 md:mb-6 grid-cols-2 md:grid-cols-4">
        <SummaryCard title={`${periodLabel} Toplam Ziyaret`} value={String(inPeriod.length)} icon={<MapPin className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
        <SummaryCard title={`${periodLabel} Ziyaret Edilen`} value={String(visited.length)} icon={<MapPin className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
        <SummaryCard title="Satış" value={String(salesCount)} icon={<CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
        <SummaryCard title="Satış Oranı" value={`%${salesRate}`} icon={<TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-[#F9C800]" />} valueClass="text-[#F9C800]" />
      </div>

      {/* KPI Kartları – EK (isteğe bağlı açılır) */}
      {showMoreKPIs && (
        <div className="grid gap-4 md:gap-6 mb-4 md:mb-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCard title="Teklif" value={String(offersGiven)} icon={<AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
          <SummaryCard title="Toplam KM" value={`${kmStats.total} km`} icon={<RouteIcon className="w-7 h-7 md:w-8 md:h-8 text-[#F9C800]" />} />
          <SummaryCard title="Ort. KM/Geçiş" value={`${kmStats.avg} km`} icon={<RouteIcon className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
          <SummaryCard title="Reddedilme Oranı" value={`%${rejectedRate}`} icon={<AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-red-500" />} valueClass="text-red-600" />
          <SummaryCard title="Evde Yok Oranı" value={`%${noAnswerRate}`} icon={<AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-gray-500" />} valueClass="text-gray-700" />
          <SummaryCard title="Teklif→Satış" value={`%${offerToSale}`} icon={<TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
          <SummaryCard title="Ziyaret / Saat" value={`${timeStats.visitsPerHour}/s`} icon={<MapPin className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
          <SummaryCard title="Aktif Süre" value={fmtDuration(timeStats.minutes)} icon={<Clock className="w-7 h-7 md:w-8 md:h-8 text-[#0099CB]" />} />
        </div>
      )}

      {/* Notlar (isteğe bağlı) */}
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

      {/* Alt bilgi */}
      <div className="px-4 md:px-6 py-4 text-sm text-gray-500">
        Bu rapor 2 Eylül 2025 Salı tarihinde otomatik oluşturulmuştur.
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; valueClass?: string }> = ({ title, value, icon, valueClass }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-gray-100">
    <div className="flex justify-between">
      <div>
        <p className="text-xs md:text-sm text-gray-600">{title}</p>
        <p className={`text-xl md:text-2xl font-bold text-[#0099CB] ${valueClass || ''}`}>{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

// --- Demo veri ve Test Kümeleri ---
const baselineCustomers: Customer[] = [
  { id: '1', name: 'Mehmet Yılmaz', address: 'Kadıköy – Bahariye Cd.', status: 'Satış Yapıldı', lat: 40.989, lng: 29.027, visitedAt: new Date().toISOString() },
  { id: '2', name: 'Ayşe Demir', address: 'Kadıköy – Moda Sahil', status: 'Teklif Verildi', lat: 40.983, lng: 29.032, visitedAt: new Date(Date.now() - 60*60*1000).toISOString() },
  { id: '3', name: 'Ali Kaya', address: 'Kadıköy – Fikirtepe', status: 'Reddedildi', lat: 40.995, lng: 29.055, visitedAt: new Date(Date.now() - 2*60*60*1000).toISOString() },
  { id: '4', name: 'Zeynep Koç', address: 'Kadıköy – Suadiye', status: 'Evde Yok' },
  { id: '5', name: 'Elif Çetin', address: 'Kadıköy – Kozyatağı', status: 'Tamamlandı', lat: 40.977, lng: 29.092, visitedAt: new Date(Date.now() - 3*60*60*1000).toISOString() },
  { id: '6', name: 'Mert Öz', address: 'Kadıköy – Erenköy', status: 'Planlandı' },
  { id: '7', name: 'Gizem Sarı', address: 'Kadıköy – Bostancı', status: 'Teklif Verildi', lat: 40.967, lng: 29.120, visitedAt: new Date(Date.now() - 4*60*60*1000).toISOString() },
  { id: '8', name: 'Oğuz Yalçın', address: 'Kadıköy – Caddebostan', status: 'Satış Yapıldı', lat: 40.971, lng: 29.075, visitedAt: new Date(Date.now() - 5*60*60*1000).toISOString() },
  { id: '9', name: 'Büşra Ak', address: 'Kadıköy – Göztepe', status: 'İptal' },
  { id: '10', name: 'Can Kurt', address: 'Kadıköy – Hasanpaşa', status: 'Reddedildi', lat: 41.005, lng: 29.036, visitedAt: new Date(Date.now() - 6*60*60*1000).toISOString() },
];

// Test Case #1: Sadece Planlandı (ziyaret yok) → tüm oranlar 0, KM 0
const onlyPlanned: Customer[] = [
  { id: '1', name: 'Müşteri A', address: 'Adres 1', status: 'Planlandı' },
  { id: '2', name: 'Müşteri B', address: 'Adres 2', status: 'Planlandı' },
];

// Test Case #2: Ziyaret var ama konum yok → KM 0, diğer metrikler hesaplanır
const noGeoVisited: Customer[] = [
  { id: '1', name: 'Müşteri C', address: 'Adres 3', status: 'Satış Yapıldı', visitedAt: new Date().toISOString() },
  { id: '2', name: 'Müşteri D', address: 'Adres 4', status: 'Teklif Verildi', visitedAt: new Date(Date.now() - 30*60*1000).toISOString() },
];

// Test Case #3: 7 güne yayılan haftalık veri, karışık durumlar
const weeklyMixed: Customer[] = Array.from({ length: 8 }).map((_, i) => ({
  id: String(i + 1),
  name: `Hafta Müşteri ${i + 1}`,
  address: `Adres ${i + 1}`,
  status: i % 3 === 0 ? 'Satış Yapıldı' : i % 3 === 1 ? 'Teklif Verildi' : 'Reddedildi',
  lat: 40.95 + i * 0.01,
  lng: 29.03 + i * 0.01,
  visitedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
}));

// Test Case #4: Aylık yoğun veri (konumlu) – KM ve oranlar anlamlı olmalı
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
  // Küçük bir test/küme seçici – üretimde gizleyebilirsin
  const [caseKey, setCaseKey] = useState<'baseline' | 'onlyPlanned' | 'noGeoVisited' | 'weeklyMixed' | 'monthlyGeo'>('baseline');
  const dataMap: Record<string, Customer[]> = {
    baseline: baselineCustomers,
    onlyPlanned,
    noGeoVisited,
    weeklyMixed,
    monthlyGeo,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">Test Datası:</span>
        {(['baseline','onlyPlanned','noGeoVisited','weeklyMixed','monthlyGeo'] as const).map(k => (
          <button
            key={k}
            onClick={() => setCaseKey(k)}
            className={`px-3 py-1.5 rounded-lg border ${caseKey === k ? 'bg-[#F9C800] text-black' : 'bg-white hover:bg-gray-50'}`}
          >{k}</button>
        ))}
      </div>
      <ReportsScreen customers={dataMap[caseKey]} />
    </div>
  );
}
