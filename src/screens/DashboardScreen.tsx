import React, { useMemo, useState } from 'react';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Megaphone
} from 'lucide-react';
import VisitCard from '../components/VisitCard';
import type { Customer, SalesRep } from '../types';

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: SalesRep[];
  setCurrentScreen: (screen: string) => void;
  onSelectCustomer: (customer: Customer) => void;
};

const DashboardScreen: React.FC<Props> = ({ customers, assignments, allReps, setCurrentScreen, onSelectCustomer }) => {
  const today = new Date().toISOString().split('T')[0];
  const time = new Date();

  // --- State for popup ---
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const announcements = [
    "⚡ Yeni kampanya başladı!",
    "🎯 Hedeflerini gün sonunda tamamlamayı unutma!",
    "🌍 Enerjisa saha ekibi için özel eğitim yarın başlıyor!"
  ];

  // Bugünkü ziyaretler
  const todaysVisits = useMemo(() => {
    return customers.filter(c => c.visitDate === today);
  }, [customers, today]);

  // Tamamlanan ziyaretler
  const completedVisits = useMemo(() => {
    return todaysVisits.filter(c => c.status === 'Tamamlandı');
  }, [todaysVisits]);

  // Bekleyen ziyaretler
  const pendingVisits = useMemo(() => {
    return todaysVisits.filter(c => c.status === 'Planlandı');
  }, [todaysVisits]);

  // Günlük hedef
  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);
  const conversionRate = Math.round((completedVisits.length / (todaysVisits.length || 1)) * 100);

  // --- Zaman bazlı selamlama ---
  const hour = time.getHours();
  let greeting = "Hoş geldin";
  if (hour >= 6 && hour < 12) greeting = "🌅 Günaydın";
  else if (hour >= 12 && hour < 17) greeting = "☀️ Hoş geldin";
  else if (hour >= 17 && hour < 21) greeting = "🌆 İyi akşamlar";
  else greeting = "🌙 İyi geceler";

  // --- Motivasyon mesajları ---
  const motivationalMessages = {
    high: ["🎉 Harikasın, hedefinin çoğunu tamamladın!", "🏆 Bugün mükemmel gidiyorsun, az kaldı!", "🌟 Performansın zirvede, devam et!"],
    medium: ["🚀 Güzel gidiyorsun, biraz daha gayretle hedefe ulaşabilirsin.", "⚡ İyi ilerliyorsun, motivasyonu koru!", "🌱 Hedefin için sağlam adımlar atıyorsun."],
    low: ["💡 Başlamak için harika bir zaman, ilk adımı at!", "🔥 Günün daha başındasın, çok fırsat seni bekliyor.", "🕒 Hedefe ulaşmak için daha çok zamanın var, devam et!"],
    conversionHigh: ["🥇 Satış dönüşüm oranında harikasın!", "💎 Ziyaretlerin satışa dönüşüyor, tebrikler!", "🌟 Mükemmel satış performansı yakaladın!"],
    conversionLow: ["🤝 Satış şansını artırmak için müşterilerle güven inşa et.", "💡 Daha çok teklif yaparak dönüşümü artırabilirsin.", "🛠️ Küçük dokunuşlarla satış performansın yükselebilir."]
  };

  function randomPick(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Dinamik motivasyon seçimi
  let motivation = "";
  if (completionRate >= 80) motivation = randomPick(motivationalMessages.high);
  else if (completionRate >= 40) motivation = randomPick(motivationalMessages.medium);
  else motivation = randomPick(motivationalMessages.low);

  if (conversionRate >= 30) {
    motivation += " " + randomPick(motivationalMessages.conversionHigh);
  } else if (conversionRate > 0) {
    motivation += " " + randomPick(motivationalMessages.conversionLow);
  }

  return (
    <div className="space-y-6">
      {/* Hoş geldin bloğu */}
      <div className="bg-gradient-to-r from-[#0099CB] to-[#007ca8] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          {/* Sol: selamlama + motivasyon */}
          <div>
            <h1 className="text-2xl font-bold mb-1">{greeting}, Ahmet!</h1>
            <p className="text-blue-100 mb-2">
              Bugün {todaysVisits.length} ziyaretin var. Başarılı bir gün geçir! 🚀
            </p>
            <p className="text-yellow-200 text-sm">{motivation}</p>
          </div>

          {/* Sağ: saat ve tarih */}
          <div className="text-right mt-4 md:mt-0 md:ml-6">
            <div className="text-3xl font-bold">
              {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-sm text-blue-100">
              {time.toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          </div>
        </div>

        {/* Alt: duyuru barı */}
        {announcements.length > 0 && (
          <div
            className="absolute bottom-0 left-0 w-full bg-black/20 text-white flex items-center gap-2 px-3 py-1 cursor-pointer overflow-hidden rounded-b-2xl"
            onClick={() => setShowAnnouncements(true)}
          >
            <Megaphone className="w-4 h-4 shrink-0 text-yellow-300" />
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-sm">
                {announcements.join(" | ")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Günlük Hedef" value={`${completedVisits.length}/${dailyTarget}`} subtitle={`%${completionRate} tamamlandı`} icon={<Target className="w-6 h-6" />} color="bg-[#0099CB]" />
        <KPICard title="Tamamlanan" value={completedVisits.length.toString()} subtitle="Bugün" icon={<CheckCircle className="w-6 h-6" />} color="bg-green-500" />
        <KPICard title="Bekleyen" value={pendingVisits.length.toString()} subtitle="Ziyaret" icon={<Clock className="w-6 h-6" />} color="bg-yellow-500" />
        <KPICard title="Haftalık" value={`%${completionRate}`} subtitle={`${completedVisits.length}/${dailyTarget} tamamlandı`} icon={<TrendingUp className="w-6 h-6" />} color="bg-purple-500" />
      </div>

      {/* Bugünkü Program */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[#0099CB]" />
          <h2 className="text-lg font-semibold">Bugünkü Program</h2>
        </div>
        
        {todaysVisits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Bugün için planlanmış ziyaret yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysVisits.slice(0, 5).map((customer) => (
              <VisitCard
                key={customer.id}
                customer={customer}
                assignedName={assignments[customer.id] ? allReps.find(r => r.id === assignments[customer.id])?.name : undefined}
                onDetail={() => onSelectCustomer(customer)}
                onStart={() => {
                  onSelectCustomer(customer);
                  setCurrentScreen('visitFlow');
                }}
              />
            ))}
            {todaysVisits.length > 5 && (
              <div className="text-center pt-4">
                <button onClick={() => setCurrentScreen('visits')} className="text-sm text-[#0099CB] hover:underline font-medium">
                  +{todaysVisits.length - 5} ziyaret daha... (Tümünü Gör)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popup */}
      {showAnnouncements && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">📢 Duyurular</h2>
            <ul className="space-y-2 text-gray-700">
              {announcements.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <button onClick={() => setShowAnnouncements(false)} className="mt-4 px-4 py-2 bg-[#0099CB] text-white rounded-lg hover:bg-[#0088b8]">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const KPICard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ReactNode; color: string; }> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${color} text-white`}>{icon}</div>
    </div>
    <div className="space-y-1">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
);

export default DashboardScreen;
