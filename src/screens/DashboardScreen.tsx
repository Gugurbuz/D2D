import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  Megaphone,
  Sparkles,
  Award
} from 'lucide-react';
import VisitCard from '../components/VisitCard';
import KPICard from '../components/KPICard';
import Button from '../components/Button';
import { BRAND_COLORS } from '../styles/theme';
import type { Customer, SalesRep } from '../types';

// --- VERİ ---
const announcements = [
  { id: 1, icon: <Sparkles className="w-5 h-5 text-yellow-500" />, text: "Yeni kampanya başladı! Müşterilerinize özel indirimleri sunmayı unutmayın." },
  { id: 2, icon: <Target className="w-5 h-5 text-blue-500" />, text: "Hedeflerinizi gün sonunda tamamlamayı unutmayın!" },
  { id: 3, icon: <Award className="w-5 h-5 text-violet-500" />, text: "Enerjisa saha ekibi için özel online eğitim yarın başlıyor." }
];

// --- NotificationBell ---
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

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
    if (hasUnread) setHasUnread(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="group relative p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        aria-label="Duyuruları aç/kapat"
        title="Duyurular"
      >
        <Megaphone className="w-6 h-6 text-white" />
        {hasUnread && (
          <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white/50 group-hover:ring-white/70" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 z-10">
          <div className="p-3 border-b dark:border-gray-700">
            <h3 className="font-semibold text-md dark:text-gray-100">Duyurular</h3>
          </div>
          <div className="flex flex-col">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0 dark:border-gray-700"
              >
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

// --- DashboardScreen ---
type Props = {
  customers: Customer[];
  assignments: Record<string, string>;
  allReps: SalesRep[];
  setCurrentScreen: (screen: string) => void;
  onSelectCustomer: (customer: Customer) => void;
};

const DashboardScreen: React.FC<Props> = ({ customers, assignments, allReps, setCurrentScreen, onSelectCustomer }) => {
  const today = new Date().toISOString().split('T')[0];
  const time = new Date();

  // --- Zaman ve Tarih Mantığı ---
  const hour = time.getHours();
  const day = time.getDay(); // 0: Pazar, 6: Cumartesi
  const isWeekend = day === 0 || day === 6;
  const isWorkingHours = hour >= 9 && hour < 18;

  const todaysVisits = useMemo(() => customers.filter(c => c.visitDate === today), [customers, today]);
  // YENİ: Yarının ziyaretlerini hesapla
  const tomorrowsVisits = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split('T')[0];
    return customers.filter(c => c.visitDate === tomorrowDateString);
  }, [customers]);

  // GÜNCELLENDİ: Hangi programın gösterileceğine ve başlığına karar ver
  const isShowingTomorrow = !isWeekend && !isWorkingHours;
  const visitsToShow = isShowingTomorrow ? tomorrowsVisits : todaysVisits;
  const programTitle = isShowingTomorrow ? "Yarınki Program" : "Bugünkü Program";
  const noVisitMessage = isShowingTomorrow
    ? "Yarın için planlanmış ziyaret yok."
    : "Bugün için planlanmış ziyaret yok.";

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
    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    const greetings = {
        morning: ["Günaydın", "Harika bir gün dilerim", "Enerjin bol olsun"],
        afternoon: ["Merhaba", "İyi çalışmalar", "Günün nasıl geçiyor?"],
        evening: ["İyi akşamlar", "Umarım günün iyi geçmiştir"],
        night: ["İyi geceler", "İyi dinlenmeler"],
    };
    const status = {
        hasVisits: (count: number) => [
            `bugün ${count} ziyaretin var.`,
            `seni bekleyen ${count} müşteri var.`,
            `programında ${count} ziyaret görünüyor.`,
        ],
        noVisits: [
            "bugün için planlanmış bir ziyaretin yok.",
            "programın bugün boş görünüyor, yeni görevler için hazır ol.",
            "bugün dinlenme veya hazırlık günü mü? Fırsatları değerlendirebilirsin.",
        ],
    };
    const motivation = {
        high: [ "Hedefine çok yakınsın, harika gidiyor! 🎉", "Mükemmel bir performans, böyle devam et! 🏆", "Günün yıldızı sensin! ✨" ],
        medium: [ "İyi ilerliyorsun, motivasyonunu koru. 💪", "Hedefin yarısı tamam, harika! 👍", "Adım adım hedefe, devam et! 🚶‍♂️" ],
        low: [ "Başarılı bir gün seni bekliyor! 🚀", "Güne enerjik bir başlangıç yapalım! ⚡", "İlk ziyaret günün en önemlisidir, başlayalım! ☀️" ],
    };
    const outOfHours = {
        morningPrep: [ "Güne hazırlanma zamanı! Kahveni al ve günün planına bir göz at. ☕", "Yeni bir gün, yeni fırsatlar. Bugünkü hedeflerin için hazırsın! ✨" ],
        eveningRest: [ "mesai bitti, dinlenme zamanı! Yarınki programına göz atabilirsin. 🌙", "Bugünkü emeğin için teşekkürler. Şimdi dinlenmeyi hak ettin. 🛋️", "İyi dinlenmeler! Yarın yeni bir gün. 🌃" ],
    };
    const weekend = [ "Bugün dinlenme günü. Haftanın yorgunluğunu at, iyi hafta sonları! 🏖️", "Hafta sonunun tadını çıkar, enerji toplama zamanı! ☀️", "İyi tatiller! Pazartesi görüşmek üzere. 👋" ];

    if (isWeekend) {
        return `Merhaba Ahmet! ${getRandom(weekend)}`;
    }

    if (isWorkingHours) {
        let greeting = "";
        if (hour < 12) greeting = getRandom(greetings.morning);
        else if (hour < 17) greeting = getRandom(greetings.afternoon);
        else greeting = getRandom(greetings.evening);

        const statusMessage = todaysVisits.length > 0
            ? getRandom(status.hasVisits(todaysVisits.length))
            : getRandom(status.noVisits);

        let motivationalMessage = "";
        if (todaysVisits.length > 0) {
            if (completionRate >= 80) motivationalMessage = getRandom(motivation.high);
            else if (completionRate >= 40) motivationalMessage = getRandom(motivation.medium);
            else motivationalMessage = getRandom(motivation.low);
        }
        return `${greeting}, Ahmet! ${statusMessage} ${motivationalMessage}`;
    } else {
        if (hour >= 6 && hour < 9) {
            return `Günaydın Ahmet! ${getRandom(outOfHours.morningPrep)}`;
        }
        if (hour >= 18) {
            const greeting = hour < 21 ? getRandom(greetings.evening) : getRandom(greetings.night);
            return `${greeting}, Ahmet! ${getRandom(outOfHours.eveningRest)}`;
        }
        return `İyi geceler, Ahmet! ${getRandom(outOfHours.eveningRest)}`;
    }
}, [time, todaysVisits.length, completionRate, isWorkingHours, isWeekend, hour]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-start md:justify-between gap-4"
        style={{ background: `linear-gradient(to right, ${BRAND_COLORS.navy}, #001B50)` }}
      >
        <div className="max-w-xl">
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
          <NotificationBell />
        </div>
      </div>
      
      {/* KPI Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Günlük Hedef" value={`${completedVisits.length}/${dailyTarget}`} progress={completionRate} icon={<Target className="w-6 h-6" />} type="target" />
        <KPICard title="Tamamlanan" value={completedVisits.length.toString()} subtitle="Bugünkü ziyaret" icon={<CheckCircle className="w-6 h-6" />} type="completed" />
        <KPICard title="Bekleyen" value={pendingVisits.length.toString()} subtitle="Bugünkü ziyaret" icon={<Clock className="w-6 h-6" />} type="pending" />
        <KPICard title="Haftalık Performans" value={`%${weeklyStats.rate}`} subtitle={`${weeklyStats.completed}/${weeklyStats.target} ziyaret`} icon={<TrendingUp className="w-6 h-6" />} type="performance" />
      </div>

      {/* Program */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{programTitle}</h2>
        </div>
        
        {visitsToShow.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{noVisitMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visitsToShow.slice(0, 5).map((customer) => (
              <VisitCard
                key={customer.id}
                customer={customer}
                assignedName={assignments[customer.id] ? allReps.find(r => r.id === assignments[customer.id])?.name : undefined}
                onDetail={() => onSelectCustomer(customer)}
                onStart={() => { onSelectCustomer(customer); setCurrentScreen('visitFlow'); }}
                primaryAction={customer.status === 'Planlandı' ? 'start' : 'detail'}
              />
            ))}
            {visitsToShow.length > 5 && (
              <div className="text-center pt-4">
                <Button variant="soft" onClick={() => setCurrentScreen('visits')}>
                  Tüm Ziyaretleri Gör (+{visitsToShow.length - 5})
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

