import React, { useMemo, useState, useEffect } from 'react';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Users,
  Calendar,
  Award,
  Megaphone
} from 'lucide-react';
import VisitCard from '../components/VisitCard';
import Marquee from "react-fast-marquee";
import type { Customer, SalesRep } from '../types';

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: SalesRep[];
  setCurrentScreen: (screen: string) => void;
  onSelectCustomer: (customer: Customer) => void;
};

const DashboardScreen: React.FC<Props> = ({ customers, assignments, allReps, setCurrentScreen, onSelectCustomer }) => {
  const [time, setTime] = useState(new Date());
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  // Duyurular örnek (normalde backend'den gelebilir)
  const announcements = [
    "⚡ Yeni kampanya başladı! Elektrik tarifelerinde indirim.",
    "📊 Haftalık toplantı yarın saat 09:00’da.",
    "🚀 Bu ay en çok satış yapan temsilciye ödül var!"
  ];

  // Zaman güncelle
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Bugünün tarihi
  const today = new Date().toISOString().split('T')[0];
  
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

  // Atanan rep ismi bulma fonksiyonu
  const getAssignedName = (customerId: string) => {
    const repId = assignments[customerId];
    return repId ? allReps.find((r) => r.id === repId)?.name || repId : null;
  };

  // Günlük hedef ve dönüşüm
  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);
  const conversionRate = completedVisits.length > 0 
    ? Math.round((completedVisits.filter(c => c.contractSigned).length / completedVisits.length) * 100) 
    : 0;

  // Dinamik selamlama
  const hour = time.getHours();
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

  // Motivasyon seçimi
  let motivation = "";
  if (completionRate >= 80) {
    motivation = randomPick(motivationalMessages.high);
  } else if (completionRate >= 40) {
    motivation = randomPick(motivationalMessages.medium);
  } else {
    motivation = randomPick(motivationalMessages.low);
  }

  if (conversionRate >= 30) {
    motivation += " " + randomPick(motivationalMessages.conversionHigh);
  } else if (conversionRate > 0) {
    motivation += " " + randomPick(motivationalMessages.conversionLow);
  }

  return (
    <div className="space-y-6">
      {/* Hoş geldin mesajı + saat + tarih + duyurular */}
      <div className="bg-gradient-to-r from-[#0099CB] to-[#007ca8] rounded-2xl p-6 text-white">
        <div className="flex justify-between items-start">
          {/* Sol taraf */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{greeting}, Ahmet!</h1>
            <p className="text-blue-100">
              Bugün {todaysVisits.length} ziyaretin var. Başarılı bir gün geçir! 🚀
            </p>
            <p className="mt-2 text-yellow-200 text-sm">{motivation}</p>
          </div>

          {/* Sağ taraf */}
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-bold">
              {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-sm text-blue-100 mt-1">
              {time.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Alt satır: Duyurular */}
        <div
          className="relative mt-4 w-full bg-[#007ca8]/40 rounded-lg overflow-hidden flex items-center cursor-pointer"
          onClick={() => setShowAnnouncements(true)}
        >
          <Megaphone className="w-5 h-5 text-yellow-300 flex-shrink-0 ml-2 mr-3" />
          <Marquee
            gradient={false}
            speed={50}
            pauseOnHover={true}
            direction="left"
            className="text-sm text-blue-100 py-2"
          >
            {announcements.map((a, idx) => (
              <span key={idx} className="mx-6">{a}</span>
            ))}
          </Marquee>
        </div>
      </div>

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
          title="Dönüşüm"
          value={`%${conversionRate}`}
          subtitle="Satış oranı"
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
                assignedName={getAssignedName(customer.id)}
                onDetail={() => {
                  onSelectCustomer(customer);
                  setCurrentScreen('visitDetail');
                }}
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

// Yardımcı: random mesaj seç
function randomPick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg ${color} text-white`}>
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
);

export default DashboardScreen;
