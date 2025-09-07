import React, { useMemo, useState } from 'react';
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Users,
  Calendar,
  Award,
  Megaphone,
  X // Kapatma butonu için X ikonu eklendi
} from 'lucide-react';

// --- Test için Mock Data ve Tipler ---
const todayStr = new Date().toISOString().split('T')[0];
type Customer = {
  id: string;
  name: string;
  address: string;
  visitDate: string;
  status: 'Tamamlandı' | 'Planlandı' | 'İptal Edildi';
};
type SalesRep = { id: string; name: string; };
const mockCustomers: Customer[] = [
  { id: '1', name: 'ABC Market', address: 'Örnek Mah. 123 Sok. No:4', visitDate: todayStr, status: 'Tamamlandı' },
  { id: '2', name: 'Deneme Büfe', address: 'Test Cad. 45/B', visitDate: todayStr, status: 'Planlandı' },
  { id: '3', name: 'Yıldız Gıda', address: 'Gelecek Sok. No:1', visitDate: todayStr, status: 'Planlandı' },
];
const mockAllReps: SalesRep[] = [{ id: 'rep1', name: 'Ayşe Yılmaz' }];
const mockAssignments: Record<string, string | undefined> = { '1': 'rep1', '2': 'rep1' };


// --- VisitCard Componenti (Harici dosya yerine dahil edildi) ---
const VisitCard: React.FC<{
  customer: Customer;
  assignedName?: string;
  onDetail: () => void;
  onStart: () => void;
}> = ({ customer, assignedName, onDetail, onStart }) => {
  const statusClasses: { [key: string]: string } = {
    'Tamamlandı': 'bg-green-100 text-green-800',
    'Planlandı': 'bg-blue-100 text-blue-800',
    'İptal Edildi': 'bg-red-100 text-red-800',
  };
  return (
    <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-bold text-gray-800">{customer.name}</p>
        <p className="text-sm text-gray-500">{customer.address}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusClasses[customer.status]}`}>
          {customer.status}
        </span>
        {customer.status === 'Planlandı' && (
          <button onClick={onStart} className="px-4 py-2 bg-[#0099CB] text-white rounded-lg text-sm font-semibold">
            Başlat
          </button>
        )}
      </div>
    </div>
  );
};

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: SalesRep[];
  setCurrentScreen: (screen: string) => void;
  onSelectCustomer: (customer: Customer) => void;
};

const DashboardScreen: React.FC<Props> = ({ 
  customers = mockCustomers, 
  assignments = mockAssignments, 
  allReps = mockAllReps, 
  setCurrentScreen, 
  onSelectCustomer 
}) => {
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  const [isNewAnnouncement, setIsNewAnnouncement] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const time = new Date();

  const todaysVisits = useMemo(() => {
    return (customers || []).filter(c => c.visitDate === today);
  }, [customers, today]);

  const completedVisits = useMemo(() => {
    return todaysVisits.filter(c => c.status === 'Tamamlandı');
  }, [todaysVisits]);

  const pendingVisits = useMemo(() => {
    return todaysVisits.filter(c => c.status === 'Planlandı');
  }, [todaysVisits]);

  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);
  const conversionRate = Math.round((completedVisits.length / (todaysVisits.length || 1)) * 100);

  const hour = time.getHours();
  let greeting = "Hoş geldin";
  if (hour >= 6 && hour < 12) greeting = "Günaydın";
  else if (hour >= 12 && hour < 17) greeting = "Hoş geldin";
  else if (hour >= 17 && hour < 21) greeting = "İyi akşamlar";
  else greeting = "İyi geceler";

  let visitMessage = "";
  if (hour >= 6 && hour < 18) {
    visitMessage = `Bugün ${todaysVisits.length} ziyaretin var. Başarılı bir gün geçir! 🚀`;
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(time.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];
    const tomorrowsVisits = (customers || []).filter(c => c.visitDate === tomorrowDate);
    visitMessage = tomorrowsVisits.length > 0
      ? `🌙 Mesai bitti. Yarın ${tomorrowsVisits.length} ziyaretin planlı. Dinlenme zamanı!`
      : "🌙 Mesai bitti. Yarın için programında ziyaret görünmüyor. Enerjini topla!";
  }

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

  let motivation = "";
  if (completionRate >= 80) motivation = randomPick(motivationalMessages.high);
  else if (completionRate >= 40) motivation = randomPick(motivationalMessages.medium);
  else motivation = randomPick(motivationalMessages.low);

  if (conversionRate >= 30) motivation += " " + randomPick(motivationalMessages.conversionHigh);
  else if (conversionRate > 0) motivation += " " + randomPick(motivationalMessages.conversionLow);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0099CB] to-[#007ca8] rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between relative pb-12">
        <div>
          <h1 className="text-2xl font-bold mb-1">{greeting}, Ahmet!</h1>
          <p className="text-base font-medium text-blue-100 mb-1">{visitMessage}</p>
          <p className="text-base font-medium text-blue-100">{motivation}</p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <div className="text-3xl font-bold">{time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-sm text-blue-100">{time.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>

        {/* --- DEĞİŞİKLİK: Duyuru çubuğu mantığı güncellendi --- */}
        <div className="absolute bottom-0 left-0 w-full bg-black/20 text-white rounded-b-2xl transition-all">
          {isAnnouncementVisible ? (
            // Genişletilmiş Görünüm
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Megaphone className="w-5 h-5 shrink-0 text-yellow-300" />
                <p className="text-sm truncate">⚡ Yeni kampanya başladı! | 🎯 Hedeflerini gün sonunda tamamlamayı unutma!</p>
              </div>
              <button onClick={() => setIsAnnouncementVisible(false)} className="p-1 rounded-full hover:bg-white/20" aria-label="Duyuruyu kapat">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // Daraltılmış Görünüm
            <button
              onClick={() => {
                setIsAnnouncementVisible(true);
                setIsNewAnnouncement(false);
              }}
              className="w-full flex items-center justify-center text-center gap-2 px-4 py-2 hover:bg-white/10"
              aria-label="Duyuruları göster"
            >
              <div className="relative">
                <Megaphone className="w-5 h-5" />
                {isNewAnnouncement && (
                  <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#007ca8]"></span>
                )}
              </div>
              <span className="text-sm font-medium">Duyuruları Göster</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Günlük Hedef" value={`${completedVisits.length}/${dailyTarget}`} subtitle={`%${completionRate} tamamlandı`} icon={<Target className="w-6 h-6" />} color="bg-[#0099CB]" />
        <KPICard title="Tamamlanan" value={completedVisits.length.toString()} subtitle="Bugün" icon={<CheckCircle className="w-6 h-6" />} color="bg-green-500" />
        <KPICard title="Bekleyen" value={pendingVisits.length.toString()} subtitle="Ziyaret" icon={<Clock className="w-6 h-6" />} color="bg-yellow-500" />
        <KPICard title="Haftalık" value={`%${completionRate}`} subtitle={`${completedVisits.length}/${dailyTarget} tamamlandı`} icon={<TrendingUp className="w-6 h-6" />} color="bg-purple-500" />
      </div>

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

