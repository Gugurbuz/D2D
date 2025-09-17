import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Target,

  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  Bell,
  Sparkles,
  Award
} from 'lucide-react';
import VisitCard from '../components/VisitCard';
import KPICard from '../components/KPICard';
import Button from '../components/Button';
import { BRAND_COLORS } from '../styles/theme';
import type { Customer, SalesRep } from '../types';

// --- VERİ ---
// UX-İYİLEŞTİRME: Duyuruları yönetmesi daha kolay bir veri yapısına taşıdık.
const announcements = [
    { id: 1, icon: <Sparkles className="w-5 h-5 text-yellow-500" />, text: "Yeni kampanya başladı! Müşterilerinize özel indirimleri sunmayı unutmayın." },
    { id: 2, icon: <Target className="w-5 h-5 text-blue-500" />, text: "Hedeflerinizi gün sonunda tamamlamayı unutmayın!" },
    { id: 3, icon: <Award className="w-5 h-5 text-violet-500" />, text: "Enerjisa saha ekibi için özel online eğitim yarın başlıyor." }
];


// --- YENİ MODERN BİLEŞEN: NotificationBell ---
const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true); // Yeni bildirim var mı?
    const ref = useRef<HTMLDivElement>(null);

    // Dışarı tıklandığında paneli kapatma
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);


    const handleToggle = () => {
      setIsOpen(!isOpen);
      if (hasUnread) {
        setHasUnread(false); // Kullanıcı tıkladığında "okundu" kabul edelim
      }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
            >
                <Bell className="w-6 h-6 text-white" />
                {hasUnread && (
                    <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white/50" />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 z-10">
                    <div className="p-3 border-b">
                        <h3 className="font-semibold text-md dark:text-gray-100">Duyurular</h3>
                    </div>
                    <div className="flex flex-col">
                        {announcements.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0">
                                <div className="flex-shrink-0 mt-1">{item.icon}</div>
                                <p className="text-sm">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Diğer Bileşenler (Değişiklik Yok) ---

const DashboardScreen: React.FC<Props> = ({ customers, assignments, allReps, setCurrentScreen, onSelectCustomer }) => {
  const today = new Date().toISOString().split('T')[0];
  const time = new Date();

  // Hesaplamalar... (Değişiklik yok)
  const todaysVisits = useMemo(() => customers.filter(c => c.visitDate === today), [customers, today]);
  const completedVisits = useMemo(() => todaysVisits.filter(c => c.status === 'Tamamlandı'), [todaysVisits]);
  const pendingVisits = useMemo(() => todaysVisits.filter(c => c.status === 'Planlandı'), [todaysVisits]);
  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);
  const weeklyStats = useMemo(() => {
    const weeklyTarget = dailyTarget * 5;
    const weeklyCompleted = Math.min(weeklyTarget, completedVisits.length * 4 + 15);
    const rate = Math.round((weeklyCompleted / weeklyTarget) * 100);
    return { target: weeklyTarget, completed: weeklyCompleted, rate: rate };
  }, [completedVisits.length, dailyTarget]);

  const headerMessage = useMemo(() => {
    const hour = time.getHours();
    let greeting = "Hoş geldin";
    if (hour >= 6 && hour < 12) greeting = "Günaydın";
    else if (hour >= 17 && hour < 21) greeting = "İyi akşamlar";
    else if (hour >= 21 || hour < 6) greeting = "İyi geceler";

    let statusMessage = "";
    if (hour >= 6 && hour < 18) {
      if (todaysVisits.length > 0) statusMessage = `bugün ${todaysVisits.length} ziyaretin var.`;
      else statusMessage = `bugün için planlanmış bir ziyaretin yok.`;
    } else {
      statusMessage = `mesai bitti, dinlenme zamanı! Yarınki programına göz atabilirsin. 🌙`;
    }

    let motivation = "";
    if (completionRate >= 80) motivation = "Hedefine çok yakınsın, harika gidiyor! 🎉";
    else if (completionRate >= 40) motivation = "İyi ilerliyorsun, motivasyonunu koru. 💪";
    else if (todaysVisits.length > 0) motivation = "Başarılı bir gün seni bekliyor! 🚀";
    
    return `${greeting}, Ahmet! ${statusMessage} ${motivation}`;
  }, [time, todaysVisits.length, completionRate]);

  return (
    <div className="space-y-6">
      {/* Header Bloğu - Bildirim Zili ile güncellendi */}
      <div className="rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-start md:justify-between gap-4" style={{ background: `linear-gradient(to right, ${BRAND_COLORS.navy}, #001B50)` }}>
        <div className='max-w-xl'>
          <h1 className="text-2xl font-bold">{headerMessage}</h1>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 self-end md:self-start">
          <div className="text-right">
            <div className="text-3xl font-bold">
              {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-sm text-blue-100">
              {time.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          {/* MODERN ÇÖZÜMÜN ENTEGRASYONU */}
          <NotificationBell />
        </div>
      </div>
      
      {/* KPI Kartları ve Ziyaret Listesi... (Değişiklik yok) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Günlük Hedef" value={`${completedVisits.length}/${dailyTarget}`} progress={completionRate} icon={<Target className="w-6 h-6" />} type="target" />
        <KPICard title="Tamamlanan" value={completedVisits.length.toString()} subtitle="Bugünkü ziyaret" icon={<CheckCircle className="w-6 h-6" />} type="completed" />
        <KPICard title="Bekleyen" value={pendingVisits.length.toString()} subtitle="Bugünkü ziyaret" icon={<Clock className="w-6 h-6" />} type="pending" />
        <KPICard title="Haftalık Performans" value={`%${weeklyStats.rate}`} subtitle={`${weeklyStats.completed}/${weeklyStats.target} ziyaret`} icon={<TrendingUp className="w-6 h-6" />} type="performance" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bugünkü Program</h2>
        </div>
        
        {todaysVisits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Bugün için planlanmış ziyaret yok.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysVisits.slice(0, 5).map((customer) => (
              <VisitCard
                key={customer.id} customer={customer}
                assignedName={assignments[customer.id] ? allReps.find(r => r.id === assignments[customer.id])?.name : undefined}
                onDetail={() => onSelectCustomer(customer)}
                onStart={() => { onSelectCustomer(customer); setCurrentScreen('visitFlow'); }}
                primaryAction={customer.status === 'Planlandı' ? 'start' : 'detail'}
              />
            ))}
            {todaysVisits.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="soft"
                  onClick={() => setCurrentScreen('visits')}
                >
                  Tüm Ziyaretleri Gör (+{todaysVisits.length - 5})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;