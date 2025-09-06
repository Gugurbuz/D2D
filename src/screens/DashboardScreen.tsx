import React, { useMemo, useEffect, useState } from 'react';
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
import Marquee from "react-fast-marquee";
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

  // Saat & Tarih
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Duyurular
  const announcements = [
    "📢 Yeni tarife kampanyası başladı!",
    "⚡ Sistem bakımı bu gece 02:00-04:00 arası yapılacak.",
    "🎯 Günlük hedefinize ulaşmayı unutmayın!"
  ];
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const todaysVisits = useMemo(() => customers.filter(c => c.visitDate === today), [customers, today]);
  const completedVisits = useMemo(() => todaysVisits.filter(c => c.status === 'Tamamlandı'), [todaysVisits]);
  const pendingVisits = useMemo(() => todaysVisits.filter(c => c.status === 'Planlandı'), [todaysVisits]);

  const getAssignedName = (customerId: string) => {
    const repId = assignments[customerId];
    return repId ? allReps.find((r) => r.id === repId)?.name || repId : null;
  };

  const handleVisitDetail = (customer: Customer) => {
    onSelectCustomer(customer);
    setCurrentScreen('visitDetail');
  };

  const handleStartVisit = (customer: Customer) => {
    onSelectCustomer(customer);
    setCurrentScreen('visitFlow');
  };

  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);

  const weeklyStats = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); 
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklyVisits = customers.filter(c => {
      const visitDate = new Date(c.visitDate);
      return visitDate >= weekStart;
    });
    
    const weeklyCompleted = weeklyVisits.filter(c => c.status === 'Tamamlandı');
    
    return {
      total: weeklyVisits.length,
      completed: weeklyCompleted.length,
      rate: weeklyVisits.length > 0 ? Math.round((weeklyCompleted.length / weeklyVisits.length) * 100) : 0
    };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Hoş geldin + Saat + Tarih + Duyurular */}
      <div className="bg-gradient-to-r from-[#0099CB] to-[#007ca8] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Hoş geldin, Ahmet!</h1>
        <p className="text-blue-100">
          Bugün {todaysVisits.length} ziyaretin var. Başarılı bir gün geçir! 🚀
        </p>

        {/* Saat + Tarih */}
        <div className="mt-4">
          <div className="text-3xl sm:text-4xl font-bold">
            {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm text-blue-100 mt-1">
            {time.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Duyurular */}
        <div
          className="relative mt-3 w-full bg-[#007ca8]/40 rounded-lg overflow-hidden flex items-center cursor-pointer"
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
        <KPICard title="Günlük Hedef" value={`${completedVisits.length}/${dailyTarget}`} subtitle={`%${completionRate} tamamlandı`} icon={<Target className="w-6 h-6" />} color="bg-[#0099CB]" />
        <KPICard title="Tamamlanan" value={completedVisits.length.toString()} subtitle="Bugün" icon={<CheckCircle className="w-6 h-6" />} color="bg-green-500" />
        <KPICard title="Bekleyen" value={pendingVisits.length.toString()} subtitle="Ziyaret" icon={<Clock className="w-6 h-6" />} color="bg-yellow-500" />
        <KPICard title="Haftalık" value={`%${weeklyStats.rate}`} subtitle={`${weeklyStats.completed}/${weeklyStats.total} tamamlandı`} icon={<TrendingUp className="w-6 h-6" />} color="bg-purple-500" />
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
                onDetail={() => handleVisitDetail(customer)}
                onStart={() => handleStartVisit(customer)}
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

      {/* Hızlı Aksiyonlar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-[#F9C800]" />
          <h2 className="text-lg font-semibold">Hızlı Aksiyonlar</h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <ActionButton title="Rota Haritası" subtitle="Bugünkü rotanı gör" icon={<MapPin className="w-5 h-5" />} onClick={() => setCurrentScreen('route')} />
          <ActionButton title="Ziyaret Listesi" subtitle="Tüm ziyaretleri listele" icon={<Users className="w-5 h-5" />} onClick={() => setCurrentScreen('visits')} />
          <ActionButton title="Raporlar" subtitle="Performans analizi" icon={<TrendingUp className="w-5 h-5" />} onClick={() => setCurrentScreen('reports')} />
        </div>
      </div>

      {/* Popup: Duyurular */}
      {showAnnouncements && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Duyurular</h2>
            <ul className="space-y-2 text-gray-700">
              {announcements.map((a, idx) => (
                <li key={idx}>- {a}</li>
              ))}
            </ul>
            <button
              onClick={() => setShowAnnouncements(false)}
              className="mt-4 px-4 py-2 bg-[#0099CB] text-white rounded-lg hover:bg-[#0088b8]"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------
   Reusable Components
------------------------ */

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color }) => (
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

interface ActionButtonProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, subtitle, icon, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 text-left border border-gray-200 rounded-lg hover:border-[#0099CB] hover:bg-blue-50 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="text-[#0099CB]">{icon}</div>
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-600">{subtitle}</div>
      </div>
    </div>
  </button>
);

export default DashboardScreen;
