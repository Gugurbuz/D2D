import React, { useMemo, useState } from 'react';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Users,
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
  const now = new Date();
  const hour = now.getHours();

  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Bugünkü ziyaretler
  const todaysVisits = useMemo(() => {
    return customers.filter(c => c.visitDate === today);
  }, [customers, today]);

  const completedVisits = todaysVisits.filter(c => c.status === 'Tamamlandı');
  const pendingVisits = todaysVisits.filter(c => c.status === 'Planlandı');

  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);
  const conversionRate = Math.round((completedVisits.length / (todaysVisits.length || 1)) * 100);

  // Zaman bazlı selamlama
  let greeting = "Hoş geldin";
  if (hour >= 6 && hour < 12) greeting = "🌅 Günaydın";
  else if (hour >= 12 && hour < 17) greeting = "☀️ Hoş geldin";
  else if (hour >= 17 && hour < 21) greeting = "🌆 İyi akşamlar";
  else greeting = "🌙 İyi geceler";

  // Motivasyon mesajları
  const motivationalMessages = {
    high: [
      "🎉 Harikasın, hedefinin çoğunu tamamladın!",
      "🏆 Bugün mükemmel gidiyorsun, az kaldı!",
      "🌟 Performansın zirvede, devam et!"
    ],
    medium: [
      "🚀 Güzel gidiyorsun, biraz daha gayretle hedefe ulaşabilirsin.",
      "⚡ İyi ilerliyorsun, motivasyonu koru!",
      "🌱 Hedefin için sağlam adımlar atıyorsun."
    ],
    low: [
      "💡 Başlamak için harika bir zaman, ilk adımı at!",
      "🔥 Günün daha başındasın, çok fırsat seni bekliyor.",
      "🕒 Hedefe ulaşmak için daha çok zamanın var, devam et!"
    ],
    conversionHigh: [
      "🥇 Satış dönüşüm oranında harikasın!",
      "💎 Ziyaretlerin satışa dönüşüyor, tebrikler!",
      "🌟 Mükemmel satış performansı yakaladın!"
    ],
    conversionLow: [
      "🤝 Satış şansını artırmak için müşterilerle güven inşa et.",
      "💡 Daha çok teklif yaparak dönüşümü artırabilirsin.",
      "🛠️ Küçük dokunuşlarla satış performansın yükselebilir."
    ]
  };

  function randomPick(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  let motivation = "";
  if (completionRate >= 80) motivation = randomPick(motivationalMessages.high);
  else if (completionRate >= 40) motivation = randomPick(motivationalMessages.medium);
  else motivation = randomPick(motivationalMessages.low);

  if (conversionRate >= 30) motivation += " " + randomPick(motivationalMessages.conversionHigh);
  else if (conversionRate > 0) motivation += " " + randomPick(motivationalMessages.conversionLow);

  return (
    <div className="space-y-6">
      {/* Hoş geldin bloğu */}
      <div className="bg-gradient-to-r from-[#0099CB] to-[#007ca8] rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between">
        {/* Sol */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{greeting}, Ahmet!</h1>
          <p className="text-blue-100">Bugün {todaysVisits.length} ziyaretin var. 🚀</p>
          <p className="mt-2 text-yellow-200 text-sm">{motivation}</p>
        </div>

        {/* Sağ */}
        <div className="text-right mt-4 md:mt-0">
          <div className="text-3xl font-bold">
            {now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-sm text-blue-100">
            {now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </div>

      {/* Duyuru barı */}
      <div 
        onClick={() => setShowAnnouncement(true)} 
        className="bg-black/20 text-white flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer overflow-hidden"
      >
        <Megaphone className="w-4 h-4 shrink-0 text-yellow-300" />
        <div className="animate-marquee whitespace-nowrap text-sm">
          ⚡ Yeni kampanya başladı! | 🎯 Gün sonu hedefini unutma! | 🌍 Eğitim yarın başlıyor!
        </div>
      </div>

      {/* Duyuru popup */}
      {showAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md text-center">
            <h2 className="text-xl font-bold mb-2">📢 Duyurular</h2>
            <p className="text-gray-700 mb-4">
              ⚡ Yeni kampanya başladı! <br/>
              🎯 Gün sonu hedefini unutma! <br/>
              🌍 Enerjisa saha ekibi için özel eğitim yarın başlıyor!
            </p>
            <button 
              onClick={() => setShowAnnouncement(false)} 
              className="bg-[#0099CB] text-white px-4 py-2 rounded-lg"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Günlük Hedef"
          value={`${completedVisits.length}/${dailyTarget}`}
          subtitle={`%${completionRate} tamamlandı`}
          icon={<Target className="w-6 h-6" />}
          color="bg-[#0099CB]"
        />
        <KPICard
          title="Tamamlanan"
          value={completedVisits.length.toString()}
          subtitle="Bugün"
          icon={<CheckCircle className="w-6 h-6" />}
          color="bg-green-500"
        />
        <KPICard
          title="Bekleyen"
          value={pendingVisits.length.toString()}
          subtitle="Ziyaret"
          icon={<Clock className="w-6 h-6" />}
          color="bg-yellow-500"
        />
        <KPICard
          title="Haftalık"
          value={`%${completionRate}`}
          subtitle={`${completedVisits.length}/${dailyTarget} tamamlandı`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-purple-500"
        />
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
                <button
                  onClick={() => setCurrentScreen('visits')}
                  className="text-sm text-[#0099CB] hover:underline font-medium"
                >
                  +{todaysVisits.length - 5} ziyaret daha... (Tümünü Gör)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
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
