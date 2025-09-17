import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Route as RouteIcon,
  Clock,
  Target,
  UserX,
  Notebook,
  Sparkles,
} from "lucide-react";

// Basit Customer tipi (değişiklik yok)
type Customer = {
  id: string;
  name: string;
  address: string;
  status?: "Planlandı" | "Satış Yapıldı" | "Teklif Verildi" | "Reddedildi" | "Evde Yok" | "Tamamlandı" | "İptal" | string;
  lat?: number;
  lng?: number;
  visitedAt?: string; // ISO
};

// --- Yardımcı Fonksiyonlar (değişiklik yok) ---
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) { /* ... */ }
function fmtDuration(minutes: number) { /* ... */ }


// --- YENİ: Geliştirilmiş KPICard Bileşeni ---
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
        green: {
            border: "border-green-500",
            iconBg: "bg-green-100 dark:bg-green-900/50",
            iconText: "text-green-600 dark:text-green-400",
            progressBg: "bg-green-500",
        },
        blue: {
            border: "border-blue-500",
            iconBg: "bg-blue-100 dark:bg-blue-900/50",
            iconText: "text-blue-600 dark:text-blue-400",
            progressBg: "bg-blue-500",
        },
        yellow: {
            border: "border-yellow-500",
            iconBg: "bg-yellow-100 dark:bg-yellow-900/50",
            iconText: "text-yellow-600 dark:text-yellow-400",
            progressBg: "bg-yellow-500",
        },
        red: {
            border: "border-red-500",
            iconBg: "bg-red-100 dark:bg-red-900/50",
            iconText: "text-red-600 dark:text-red-400",
            progressBg: "bg-red-500",
        },
        gray: {
            border: "border-gray-400",
            iconBg: "bg-gray-100 dark:bg-gray-700/50",
            iconText: "text-gray-600 dark:text-gray-400",
            progressBg: "bg-gray-500",
        },
    };

    const styles = colorVariants[color];

    return (
        <div className={`animate-fade-in-up bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 flex flex-col justify-between border-l-4 ${styles.border}`} style={{ animationDelay }}>
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
                <div className={`p-2 rounded-lg ${styles.iconBg} ${styles.iconText}`}>
                    {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
                </div>
            </div>
            <div className="mt-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                {progress !== undefined ? (
                    <>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                            <div className={`h-full rounded-full transition-all duration-500 ${styles.progressBg}`}
                                 style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                        </div>
                        {target && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">Hedef: {target}</p>}
                    </>
                ) : (
                    target && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{target}</p>
                )}
            </div>
        </div>
    );
};


// --- Raporlar Bileşeni (Yeniden Tasarlandı) ---
const ReportsScreen: React.FC<{ customers: Customer[] }> = ({ customers }) => {
  const [period, setPeriod] = useState<'gunluk' | 'haftalik' | 'aylik'>('gunluk');
  const [showMoreKPIs, setShowMoreKPIs] = useState(false);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dayNotes, setDayNotes] = useState(localStorage.getItem(`dayNote:${todayKey}`) || "");

  // --- Tüm useMemo hesaplamaları (değişiklik yok) ---
  const periodStart = useMemo(() => { /* ... */ }, [period]);
  const inPeriod = useMemo(() => { /* ... */ }, [customers, periodStart]);
  const visited = useMemo(() => { /* ... */ }, [inPeriod]);
  const salesCount = useMemo(() => { /* ... */ }, [visited]);
  const salesRate = useMemo(() => (visited.length ? Math.round((salesCount / visited.length) * 100) : 0), [visited.length, salesCount]);
  const kmStats = useMemo(() => { /* ... */ }, [visited]);
  const rejectedRate = useMemo(() => (visited.length ? Math.round((visited.filter(c => c.status === 'Reddedildi').length / visited.length) * 100) : 0), [visited]);
  const noAnswerRate = useMemo(() => (visited.length ? Math.round((visited.filter(c => c.status === 'Evde Yok').length / visited.length) * 100) : 0), [visited]);
  const timeStats = useMemo(() => { /* ... */ }, [visited]);

  // --- YENİ: Motivasyon için Örnek Hedefler ---
  const dailySalesTarget = 5;
  const dailyVisitTarget = 10;

  // Günlük hedefe göre ilerleme (sadece günlük periyotta anlamlı)
  const salesProgress = period === 'gunluk' ? Math.round((salesCount / dailySalesTarget) * 100) : undefined;
  const visitProgress = period === 'gunluk' ? Math.round((visited.length / dailyVisitTarget) * 100) : undefined;

  // Notları kaydetme
  useEffect(() => {
    localStorage.setItem(`dayNote:${todayKey}`, dayNotes);
  }, [dayNotes, todayKey]);
  
  const dateLabel = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Başlık ve Kontrol Paneli */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Performans Raporu</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dateLabel}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <div className="inline-flex rounded-lg shadow-sm">
                    {(['gunluk', 'haftalik', 'aylik'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm font-medium transition-colors 
                                ${period === p ? 'bg-yellow-400 text-black' : 'bg-white dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'} 
                                first:rounded-l-lg last:rounded-r-lg border-y border-slate-200 dark:border-slate-600 
                                ${p === 'gunluk' ? 'border-l' : ''} ${p === 'aylik' ? 'border-r' : 'border-r-0'}`}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </header>

        <main>
            {/* Ana KPI'lar */}
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <KPICard title="Ziyaret Edilen" value={`${visited.length}`} color="blue" icon={<MapPin/>} progress={visitProgress} target={`${dailyVisitTarget} Ziyaret`} animationDelay="0ms" />
                <KPICard title="Satış Adedi" value={`${salesCount}`} color="green" icon={<CheckCircle/>} progress={salesProgress} target={`${dailySalesTarget} Satış`} animationDelay="100ms" />
                <KPICard title="Satış Oranı" value={`%${salesRate}`} color="green" icon={<TrendingUp/>} progress={salesRate} target="Dönüşüm Yüzdesi" animationDelay="200ms" />
                <KPICard title="Toplam Mesafe" value={`${kmStats.total} km`} color="yellow" icon={<RouteIcon/>} target="Günlük Kat Edilen" animationDelay="300ms" />
            </div>

            {/* Detay/İkincil KPI'lar */}
            <div className="mb-6">
                <button onClick={() => setShowMoreKPIs(s => !s)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mb-3">
                    {showMoreKPIs ? 'Daha Az Göster' : 'Tüm Metrikleri Göster'}
                </button>
                {showMoreKPIs && (
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
                        <KPICard title="Reddedilme Oranı" value={`%${rejectedRate}`} color="red" icon={<AlertCircle/>} target="Müşteri Ret Yüzdesi" />
                        <KPICard title="Ulaşılamayan Oranı" value={`%${noAnswerRate}`} color="gray" icon={<UserX/>} target="Adreste Bulunamayan" />
                        <KPICard title="Aktif Süre" value={fmtDuration(timeStats.minutes)} color="yellow" icon={<Clock/>} target="İlk ve Son Ziyaret Arası" />
                        <KPICard title="Ziyaret / Saat" value={`${timeStats.visitsPerHour}/sa`} color="blue" icon={<Sparkles/>} target="Verimlilik Puanı" />
                    </div>
                )}
            </div>

            {/* Gün Sonu Notları */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border-t-4 border-yellow-400">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg text-yellow-600 dark:text-yellow-400">
                        <Notebook className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Günün Özeti ve Notlar</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Önemli gözlemleri ve sonraki adımları buraya ekleyin.</p>
                    </div>
                </div>
                <textarea
                    rows={5}
                    placeholder="Bugünkü ziyaretlerde öne çıkanlar, karşılaşılan zorluklar, pazarla ilgili gözlemler..."
                    className="w-full border rounded-xl p-3 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:placeholder-slate-500"
                    value={dayNotes}
                    onChange={(e) => setDayNotes(e.target.value)}
                />
            </div>
        </main>
      </div>
    </div>
  );
};


// --- Demo Veri ve Test Başlatıcı ---
// ... (DemoReports, baselineCustomers vb. aynı kalacak) ...
export default function DemoReports() {
    // ...
}