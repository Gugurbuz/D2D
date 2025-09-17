import React, { useMemo } from 'react';
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Megaphone,
  Calendar
} from 'lucide-react';
import VisitCard from '../components/VisitCard'; // VisitCard bileşeninizin yolunu doğrulayın
import type { Customer, SalesRep } from '../types';

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: SalesRep[];
  setCurrentScreen: (screen: string) => void;
  onSelectCustomer: (customer: Customer) => void;
};

// --- YENİ BİLEŞENLER ---

// UX-İYİLEŞTİRME: Duyuru bandı, ana karşılama mesajından ayrılarak bilişsel yük azaltıldı.
// Kendi bileşeni olması, yönetilebilirliği artırır.
const AnnouncementBar = () => (
  <div className="bg-gray-800 text-white flex items-center gap-3 px-4 py-2 rounded-lg overflow-hidden">
    <Megaphone className="w-5 h-5 shrink-0 text-yellow-300" />
    <div className="flex-1 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap text-sm font-medium">
        <span className="mx-4">⚡ Yeni kampanya başladı!</span>
        <span className="mx-4">🎯 Hedeflerini gün sonunda tamamlamayı unutma!</span>
        <span className="mx-4">🌍 Enerjisa saha ekibi için özel eğitim yarın başlıyor!</span>
      </div>
    </div>
  </div>
);


// UX-İYİLEŞTİRME: KPI Kartı tasarımı modernize edildi.
// - Renkli arka plan yerine, daha zarif olan renkli sol kenarlık kullanıldı.
// - İlerleme durumu göstermek için opsiyonel 'progress' prop'u eklendi.
const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  progress?: number; // 0-100 arası bir değer
  icon: React.ReactNode;
  borderColor: string;
  iconColor: string;
}> = ({ title, value, subtitle, progress, icon, borderColor, iconColor }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between border-l-4 ${borderColor}`}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <div className={`${iconColor}`}>{icon}</div>
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {progress !== undefined ? (
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div className={`${borderColor.replace('border', 'bg')}`} style={{ width: `${progress}%`, height: '100%', borderRadius: 'inherit' }}></div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  </div>
);


const DashboardScreen: React.FC<Props> = ({ customers, assignments, allReps, setCurrentScreen, onSelectCustomer }) => {
  const today = new Date().toISOString().split('T')[0];
  const time = new Date();

  const todaysVisits = useMemo(() => customers.filter(c => c.visitDate === today), [customers, today]);
  const completedVisits = useMemo(() => todaysVisits.filter(c => c.status === 'Tamamlandı'), [todaysVisits]);
  const pendingVisits = useMemo(() => todaysVisits.filter(c => c.status === 'Planlandı'), [todaysVisits]);

  // --- KPI Hesaplamaları ---
  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);

  // UX-İYİLEŞTİRME: Haftalık veri, günlük veriden ayrılarak netleştirildi.
  // Bu kısım gerçek veri ile doldurulmalıdır. Bu sadece bir örnek.
  const weeklyStats = useMemo(() => {
    const weeklyTarget = dailyTarget * 5;
    const weeklyCompleted = Math.min(weeklyTarget, completedVisits.length * 4 + 15); // Örnek hesaplama
    const rate = Math.round((weeklyCompleted / weeklyTarget) * 100);
    return {
      target: weeklyTarget,
      completed: weeklyCompleted,
      rate: rate,
    };
  }, [completedVisits.length, dailyTarget]);


  // UX-İYİLEŞTİRME: Karşılama, durum ve motivasyon mesajları tek bir akıcı metin haline getirildi.
  // Bu sayede kullanıcıya daha net ve odaklanmış bir mesaj sunulur.
  const headerMessage = useMemo(() => {
    const hour = time.getHours();
    let greeting = "Hoş geldin";
    if (hour >= 6 && hour < 12) greeting = "Günaydın";
    else if (hour >= 17 && hour < 21) greeting = "İyi akşamlar";
    else if (hour >= 21 || hour < 6) greeting = "İyi geceler";

    let statusMessage = "";
    if (hour >= 6 && hour < 18) { // Mesai içi
      if (todaysVisits.length > 0) {
        statusMessage = `bugün ${todaysVisits.length} ziyaretin var.`;
      } else {
        statusMessage = `bugün için planlanmış bir ziyaretin yok.`;
      }
    } else { // Mesai dışı
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
      {/* Hoş geldin bloğu - Sadeleştirilmiş */}
      <div className="bg-gradient-to-r from-[#0099CB] to-[#007ca8] rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-start md:justify-between">
        <div className='max-w-xl'>
          <h1 className="text-2xl font-bold">{headerMessage}</h1>
        </div>
        <div className="text-right mt-4 md:mt-0 flex-shrink-0">
          <div className="text-3xl font-bold">
            {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-sm text-blue-100">
            {time.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </div>
      
      {/* Duyuru Bandı - Ayrı bir bileşen */}
      <AnnouncementBar />

      {/* KPI Kartları - Yeniden Tasarlanmış */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Günlük Hedef"
          value={`${completedVisits.length}/${dailyTarget}`}
          progress={completionRate}
          icon={<Target className="w-6 h-6" />}
          borderColor="border-blue-500"
          iconColor="text-blue-500"
        />
        <KPICard
          title="Tamamlanan"
          value={completedVisits.length.toString()}
          subtitle="Bugünkü ziyaret"
          icon={<CheckCircle className="w-6 h-6" />}
          borderColor="border-emerald-500"
          iconColor="text-emerald-500"
        />
        <KPICard
          title="Bekleyen"
          value={pendingVisits.length.toString()}
          subtitle="Bugünkü ziyaret"
          icon={<Clock className="w-6 h-6" />}
          borderColor="border-amber-500"
          iconColor="text-amber-500"
        />
        <KPICard
          title="Haftalık Performans"
          value={`%${weeklyStats.rate}`}
          subtitle={`${weeklyStats.completed}/${weeklyStats.target} ziyaret`}
          icon={<TrendingUp className="w-6 h-6" />}
          borderColor="border-violet-500"
          iconColor="text-violet-500"
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
            <p>Bugün için planlanmış ziyaret yok.</p>
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
                // UX-İYİLEŞTİRME: VisitCard'a hangi eylemin öncelikli olduğunu iletiyoruz.
                // Bu prop sayesinde VisitCard içinde "Başlat" butonu daha belirgin hale getirilebilir.
                primaryAction={customer.status === 'Planlandı' ? 'start' : 'detail'}
              />
            ))}
            {todaysVisits.length > 5 && (
              <div className="text-center pt-4">
                {/* UX-İYİLEŞTİRME: "Tümünü Gör" linki daha net ve tıklanabilir bir butona dönüştürüldü. */}
                <button
                  onClick={() => setCurrentScreen('visits')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Tüm Ziyaretleri Gör (+{todaysVisits.length - 5})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;