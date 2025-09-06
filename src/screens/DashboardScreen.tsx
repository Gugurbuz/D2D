import React, { useMemo } from 'react';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Users,
  Calendar,
  Award
} from 'lucide-react';
import type { Customer, SalesRep } from '../types';

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: SalesRep[];
  setCurrentScreen: (screen: string) => void;
};

const DashboardScreen: React.FC<Props> = ({ customers, assignments, allReps }) => {
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

  // Günlük hedef
  const dailyTarget = 20;
  const completionRate = Math.round((completedVisits.length / dailyTarget) * 100);

  // Haftalık istatistikler
  const weeklyStats = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Pazartesi
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
      {/* Hoş geldin mesajı */}
      <div className="bg-gradient-to-r from-[#0099CB] to-[#007ca8] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Hoş geldin, Ahmet!</h1>
        <p className="text-blue-100">Bugün {todaysVisits.length} ziyaretin var. Başarılı bir gün geçir! 🚀</p>
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
          title="Haftalık"
          value={`%${weeklyStats.rate}`}
          subtitle={`${weeklyStats.completed}/${weeklyStats.total} tamamlandı`}
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
          <div className="space-y-3">
            {todaysVisits.slice(0, 5).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{customer.plannedTime}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    customer.status === 'Tamamlandı' ? 'bg-green-100 text-green-800' :
                    customer.status === 'Planlandı' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.status}
                  </div>
                </div>
              </div>
            ))}
            
            {todaysVisits.length > 5 && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">
                  +{todaysVisits.length - 5} ziyaret daha...
                </span>
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
          <ActionButton
            title="Rota Haritası"
            subtitle="Bugünkü rotanı gör"
            icon={<MapPin className="w-5 h-5" />}
            onClick={() => setCurrentScreen('route')}
          />
          
          <ActionButton
            title="Ziyaret Listesi"
            subtitle="Tüm ziyaretleri listele"
            icon={<Users className="w-5 h-5" />}
            onClick={() => setCurrentScreen('visits')}
          />
          
          <ActionButton
            title="Raporlar"
            subtitle="Performans analizi"
            icon={<TrendingUp className="w-5 h-5" />}
            onClick={() => setCurrentScreen('reports')}
          />
        </div>
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

const ActionButton: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, subtitle, icon, onClick }) => (
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