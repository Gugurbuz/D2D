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

// --- YARDIMCI FONKSİYONLAR (Değişiklik yok) ---
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) { /* ... */ }
function fmtDuration(minutes: number) { /* ... */ }

// --- KPICard BİLEŞENİ (Değişiklik yok) ---
type KPICardProps = { /* ... */ };
const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, progress, target, animationDelay }) => { /* ... */ };

// --- YENİ: Ekip Performans Tablosu Bileşeni ---
type TeamPerformanceTableProps = {
    teamMembers: SalesRep[];
    customers: Customer[];
    activeRepId: string | null;
    onSelectRep: (repId: string | null) => void;
};

const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({ teamMembers, customers, activeRepId, onSelectRep }) => {
    const teamStats = useMemo(() => {
        return teamMembers.map(rep => {
            const repCustomers = customers.filter(c => c.salesRepId === rep.id);
            const visited = repCustomers.filter(c => c.status && c.status !== 'Planlandı' && c.status !== 'İptal');
            const salesCount = visited.filter(c => c.status === 'Satış Yapıldı' || c.status === 'Tamamlandı').length;
            const salesRate = visited.length ? Math.round((salesCount / visited.length) * 100) : 0;
            return { ...rep, visitedCount: visited.length, salesCount, salesRate };
        });
    }, [teamMembers, customers]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Ekip Üyesi Performansı</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Detayları görmek için bir temsilci seçin.</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Temsilci</th>
                            <th scope="col" className="px-6 py-3 text-center">Ziyaret</th>
                            <th scope="col" className="px-6 py-3 text-center">Satış</th>
                            <th scope="col" className="px-6 py-3 text-center">Satış Oranı</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Tüm Ekip Satırı */}
                        <tr onClick={() => onSelectRep(null)}
                            className={`cursor-pointer transition-colors ${activeRepId === null ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">TÜM EKİP</td>
                            <td className="px-6 py-4 text-center font-bold">{customers.filter(c => c.status && c.status !== 'Planlandı').length}</td>
                            <td className="px-6 py-4 text-center font-bold">{customers.filter(c => c.status === 'Satış Yapıldı' || c.status === 'Tamamlandı').length}</td>
                            <td className="px-6 py-4 text-center font-bold">%...</td>
                        </tr>
                        {/* Bireysel Temsilci Satırları */}
                        {teamStats.sort((a,b) => b.salesCount - a.salesCount).map(rep => (
                            <tr key={rep.id} onClick={() => onSelectRep(rep.id)}
                                className={`cursor-pointer transition-colors ${activeRepId === rep.id ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{rep.name}</td>
                                <td className="px-6 py-4 text-center">{rep.visitedCount}</td>
                                <td className="px-6 py-4 text-center">{rep.salesCount}</td>
                                <td className="px-6 py-4 text-center">% {rep.salesRate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Raporlar Ana Bileşeni (Yönetici Mantığı Eklendi) ---
const ReportsScreen: React.FC<{ customers?: Customer[]; salesRepName?: string; }> = ({ customers = [], salesRepName }) => {
    // ... (Mevcut tüm hesaplamalar burada kalacak, çünkü hem bireysel hem ekip için geçerli)
    const [period, setPeriod] = useState<'gunluk' | 'haftalik' | 'aylik'>('gunluk');
    const [showMoreKPIs, setShowMoreKPIs] = useState(false);
    
    // Metrik hesaplamaları (değişiklik yok, gelen 'customers' listesine göre çalışır)
    const periodStart = useMemo(() => { /* ... */ }, [period]);
    const inPeriod = useMemo(() => customers.filter(c => c.visitedAt && +new Date(c.visitedAt) >= periodStart), [customers, periodStart]);
    const visited = useMemo(() => inPeriod.filter(c => c.status && c.status !== 'Planlandı' && c.status !== 'İptal'), [inPeriod]);
    const salesCount = useMemo(() => visited.filter(c => c.status === 'Satış Yapıldı' || c.status === 'Tamamlandı').length, [visited]);
    const salesRate = useMemo(() => (visited.length ? Math.round((salesCount / visited.length) * 100) : 0), [visited.length, salesCount]);
    const kmStats = useMemo(() => { /* ... */ }, [visited]);
    // ...diğer metrikler...
    
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
            {/* ... Diğer KPI'lar ve Notlar bölümü ... */}
        </div>
    );
};


// --- Demo Veri Setleri ---
const teamMembers: SalesRep[] = [
    { id: 'rep1', name: 'Ayşe Yılmaz' },
    { id: 'rep2', name: 'Mehmet Öztürk' },
    { id: 'rep3', name: 'Zeynep Kaya' },
];

const teamCustomers: Customer[] = [
    // Ayşe'nin müşterileri
    { id: '1', salesRepId: 'rep1', name: 'Market A', address: 'Adres 1', status: 'Satış Yapıldı', lat: 41.01, lng: 29.01, visitedAt: new Date().toISOString() },
    { id: '2', salesRepId: 'rep1', name: 'Restoran B', address: 'Adres 2', status: 'Teklif Verildi', lat: 41.02, lng: 29.02, visitedAt: new Date(Date.now() - 60*60*1000).toISOString() },
    // Mehmet'in müşterileri
    { id: '3', salesRepId: 'rep2', name: 'Ofis C', address: 'Adres 3', status: 'Reddedildi', lat: 41.03, lng: 29.03, visitedAt: new Date().toISOString() },
    { id: '4', salesRepId: 'rep2', name: 'Dükkan D', address: 'Adres 4', status: 'Satış Yapıldı', lat: 41.04, lng: 29.04, visitedAt: new Date(Date.now() - 90*60*1000).toISOString() },
    { id: '5', salesRepId: 'rep2', name: 'Mağaza E', address: 'Adres 5', status: 'Satış Yapıldı', lat: 41.05, lng: 29.05, visitedAt: new Date(Date.now() - 120*60*1000).toISOString() },
    // Zeynep'in müşterileri
    { id: '6', salesRepId: 'rep3', name: 'Atölye F', address: 'Adres 6', status: 'Evde Yok', lat: 41.06, lng: 29.06, visitedAt: new Date().toISOString() },
];


// --- ANA GÖSTERGE PANELİ BİLEŞENİ ---
export default function ManagerDashboard() {
    const [viewMode, setViewMode] = useState<'team' | 'individual'>('team');
    const [selectedRepId, setSelectedRepId] = useState<string | null>(null); // null = tüm ekip

    // Gösterilecek müşteri listesini seçilen temsilciye göre filtrele
    const filteredCustomers = useMemo(() => {
        if (viewMode === 'individual' || !selectedRepId) {
            // "Tüm Ekip" seçildiğinde veya bireysel modda tüm müşterileri göster
            // Bireysel modda normalde sadece o kullanıcının müşterisi filtrelenir, burada demo için hepsi gösteriliyor.
            return teamCustomers;
        }
        return teamCustomers.filter(c => c.salesRepId === selectedRepId);
    }, [viewMode, selectedRepId]);
    
    const selectedRepName = useMemo(() => {
        return teamMembers.find(rep => rep.id === selectedRepId)?.name;
    }, [selectedRepId]);

    const dateLabel = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
         <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Üst Panel: Başlık ve Rol Değiştirici */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                            {viewMode === 'team' ? 'Ekip Raporları' : 'Bireysel Raporum'}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dateLabel}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center space-x-1">
                        <button onClick={() => setViewMode('individual')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'individual' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
                            Bireysel
                        </button>
                        <button onClick={() => setViewMode('team')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'team' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
                            Ekip
                        </button>
                    </div>
                </header>

                {/* Ana İçerik Alanı */}
                {viewMode === 'team' ? (
                    <div className="space-y-6">
                        <ReportsScreen customers={filteredCustomers} salesRepName={selectedRepName} />
                        <TeamPerformanceTable teamMembers={teamMembers} customers={teamCustomers} activeRepId={selectedRepId} onSelectRep={setSelectedRepId} />
                    </div>
                ) : (
                    <div>
                        {/* Buraya normal, bireysel satış temsilcisi rapor ekranı gelir */}
                        <ReportsScreen customers={teamCustomers.filter(c => c.salesRepId === 'rep1')} salesRepName="Bireysel Rapor (Ayşe Yılmaz)" />
                    </div>
                )}
            </div>
        </div>
    );
}