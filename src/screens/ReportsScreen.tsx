import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Route as RouteIcon,
  Clock,
  UserX,
  Notebook,
  Sparkles,
  Users,
  User,
} from "lucide-react";

// --- GÜNCELLENMİŞ VERİ TİPLERİ ---
type SalesRep = {
    id: string;
    name: string;
    avatarUrl?: string; // Opsiyonel
};

type Customer = {
  id: string;
  salesRepId: string; // Hangi temsilciye ait olduğu
  name: string;
  address: string;
  status?: "Planlandı" | "Satış Yapıldı" | "Teklif Verildi" | "Reddedildi" | "Evde Yok" | "Tamamlandı" | "İptal" | string;
  lat?: number;
  lng?: number;
  visitedAt?: string; // ISO
};

// --- YARDIMCI FONKSİYONLAR ---
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

// --- KPICard BİLEŞENİ ---
type KPICardProps = {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
    progress?: number;
    target?: string;
    animationDelay?: string;
};
const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, progress, target, animationDelay }) => {
    const colorVariants = {
        green: { border: "border-green-500", iconBg: "bg-green-100 dark:bg-green-900/50", iconText: "text-green-600 dark:text-green-400", progressBg: "bg-green-500" },
        blue: { border: "border-blue-500", iconBg: "bg-blue-100 dark:bg-blue-900/50", iconText: "text-blue-600 dark:text-blue-400", progressBg: "bg-blue-500" },
        yellow: { border: "border-yellow-500", iconBg: "bg-yellow-100 dark:bg-yellow-900/50", iconText: "text-yellow-600 dark:text-yellow-400", progressBg: "bg-yellow-500" },
        red: { border: "border-red-500", iconBg: "bg-red-100 dark:bg-red-900/50", iconText: "text-red-600 dark:text-red-400", progressBg: "bg-red-500" },
        gray: { border: "border-gray-400", iconBg: "bg-gray-100 dark:bg-gray-700/50", iconText: "text-gray-600 dark:text-gray-400", progressBg: "bg-gray-500" },
    };
    const styles = colorVariants[color];
    return (
        <div className={`animate-fade-in-up bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 flex flex-col justify-between border-l-4 ${styles.border}`} style={{ animationDelay }}>
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
                <div className={`p-2 rounded-lg ${styles.iconBg} ${styles.iconText}`}>{React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}</div>
            </div>
            <div className="mt-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                {progress !== undefined ? (
                    <><div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-2"><div className={`h-full rounded-full transition-all duration-500 ${styles.progressBg}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>{target && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">Hedef: {target}</p>}</>
                ) : (target && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{target}</p>)}
            </div>
        </div>
    );
};

// --- Ekip Performans Tablosu Bileşeni ---
type TeamPerformanceTableProps = {
    teamMembers: SalesRep[];
    customers: Customer[];
    activeRepId: string | null;
    onSelectRep: (repId: string | null) => void;
};
const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({ teamMembers, customers, activeRepId, onSelectRep }) => { /* ... Öncekiyle aynı ... */ };

// --- Raporlar Ana Bileşeni (Metrik Hesaplamaları Geri Eklendi) ---
const ReportsScreen: React.FC<{ customers?: Customer[]; salesRepName?: string; period: 'gunluk' | 'haftalik' | 'aylik' }> = ({ customers = [], salesRepName, period }) => {
    
    // DÜZELTME: EKSİK OLAN METRİK HESAPLAMALARI BURAYA GERİ EKLENDİ
    const inPeriod = useMemo(() => customers.filter(c => c.visitedAt), [customers, period]); // Basitleştirildi, periyot filtresi yukarıda
    const visited = useMemo(() => inPeriod.filter(c => c.status && c.status !== 'Planlandı' && c.status !== 'İptal'), [inPeriod]);
    const salesCount = useMemo(() => visited.filter(c => c.status === 'Satış Yapıldı' || c.status === 'Tamamlandı').length, [visited]);
    const salesRate = useMemo(() => (visited.length ? Math.round((salesCount / visited.length) * 100) : 0), [visited.length, salesCount]);
    const kmStats = useMemo(() => {
        const withGeo = visited.filter(c => typeof c.lat === 'number' && typeof c.lng === 'number').sort((a, b) => (a.visitedAt ? +new Date(a.visitedAt) : 0) - (b.visitedAt ? +new Date(b.visitedAt) : 0));
        if (withGeo.length < 2) return { total: 0, avg: 0 };
        let total = 0;
        for (let i = 1; i < withGeo.length; i++) { total += distanceKm({ lat: withGeo[i - 1].lat!, lng: withGeo[i - 1].lng! }, { lat: withGeo[i].lat!, lng: withGeo[i].lng! }); }
        return { total: Math.round(total * 10) / 10, avg: Math.round((total / (withGeo.length - 1)) * 10) / 10 };
    }, [visited]);
    // Diğer metrikler de eklenebilir.

    const title = salesRepName ? `${salesRepName} Performansı` : "Ekip Performans Raporu";

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{title}</h2>
             <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <KPICard title="Ziyaret Edilen" value={`${visited.length}`} color="blue" icon={<MapPin/>} />
                <KPICard title="Satış Adedi" value={`${salesCount}`} color="green" icon={<CheckCircle/>} />
                <KPICard title="Satış Oranı" value={`%${salesRate}`} color="green" icon={<TrendingUp/>} progress={salesRate} />
                <KPICard title="Toplam Mesafe" value={`${kmStats.total} km`} color="yellow" icon={<RouteIcon/>} />
            </div>
        </div>
    );
};


// --- Demo Veri Setleri ---
const teamMembers: SalesRep[] = [ /* ... */ ];
const teamCustomers: Customer[] = [ /* ... */ ];

// --- ANA GÖSTERGE PANELİ BİLEŞENİ ---
export default function ManagerDashboard() {
    const [viewMode, setViewMode] = useState<'team' | 'individual'>('team');
    const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
    const [period, setPeriod] = useState<'gunluk' | 'haftalik' | 'aylik'>('gunluk');

    const periodStart = useMemo(() => {
        const d = new Date();
        if (period === 'gunluk') d.setHours(0, 0, 0, 0);
        else if (period === 'haftalik') { d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); }
        else { d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); }
        return d.getTime();
    }, [period]);

    const filteredCustomersForPeriod = useMemo(() => {
        return teamCustomers.filter(c => c.visitedAt && +new Date(c.visitedAt) >= periodStart);
    }, [periodStart]);

    const filteredCustomersForRep = useMemo(() => {
        if (viewMode === 'individual') {
            return filteredCustomersForPeriod.filter(c => c.salesRepId === 'rep1'); // Demo: Bireysel modda Ayşe'yi göster
        }
        if (!selectedRepId) { // Ekip modu ve "Tüm Ekip" seçili
            return filteredCustomersForPeriod;
        }
        return filteredCustomersForPeriod.filter(c => c.salesRepId === selectedRepId);
    }, [viewMode, selectedRepId, filteredCustomersForPeriod]);
    
    const selectedRepName = useMemo(() => teamMembers.find(rep => rep.id === selectedRepId)?.name, [selectedRepId]);
    const dateLabel = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
         <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                            {viewMode === 'team' ? 'Ekip Raporları' : 'Bireysel Raporum'}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dateLabel}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                         <div className="inline-flex rounded-lg shadow-sm">
                            {(['gunluk', 'haftalik', 'aylik'] as const).map(p => (
                                <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-sm font-medium transition-colors ${period === p ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'} first:rounded-l-lg last:rounded-r-lg border-y border-slate-200 dark:border-slate-600 ${p === 'gunluk' ? 'border-l' : ''} ${p === 'aylik' ? 'border-r' : 'border-r-0'}`}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="p-1 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center space-x-1">
                            <button onClick={() => setViewMode('individual')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'individual' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Bireysel</button>
                            <button onClick={() => setViewMode('team')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'team' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Ekip</button>
                        </div>
                    </div>
                </header>

                {viewMode === 'team' ? (
                    <div className="space-y-6">
                        <ReportsScreen customers={filteredCustomersForRep} salesRepName={selectedRepName} period={period} />
                        <TeamPerformanceTable teamMembers={teamMembers} customers={filteredCustomersForPeriod} activeRepId={selectedRepId} onSelectRep={setSelectedRepId} />
                    </div>
                ) : (
                    <ReportsScreen customers={filteredCustomersForRep} salesRepName="Bireysel Rapor (Ayşe Yılmaz)" period={period} />
                )}
            </div>
        </div>
    );
}