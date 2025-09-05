/* ----DashboardScreen.tsx------- */
import React from 'react';
import { Activity, Timer, CheckCircle, AlertCircle, UserCheck, MapPin } from 'lucide-react';
import { Customer } from '../RouteMap';
import { Rep } from '../types';
import VisitCard from '../components/VisitCard';

const KpiCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; tone: string }> = ({ label, value, icon, tone }) => {
  const toneClasses: Record<string, string> = {
    cyan: 'bg-cyan-100 text-cyan-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center space-x-3">
      <div className={`p-2 rounded-full ${toneClasses[tone]}`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
};

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: Rep[];
  setCurrentScreen: (s: any) => void;
  setSelectedCustomer: (c: Customer) => void;
};

const DashboardScreen: React.FC<Props> = ({ customers, assignments, allReps, setCurrentScreen, setSelectedCustomer }) => {
  const byTime = [...customers].sort((a, b) => a.plannedTime.localeCompare(b.plannedTime));
  const todayList = byTime.slice(0, 4);

  const planned = customers.length;
  const onTheWay = customers.filter(c => c.status === 'Yolda').length;
  const done = customers.filter(c => c.status === 'Tamamlandı').length;
  const waiting = customers.filter(c => c.status === 'Bekliyor').length;
  const conversionRate = planned ? Math.round((done / planned) * 100) : 0;
  const estimatedRevenueTL = done * 19;

  const getAssignedName = (customerId: string) => {
    const repId = assignments[customerId];
    return repId ? allReps.find(r => r.id === repId)?.name || repId : null;
  };

  return (
    <div className="px-6 pb-10 space-y-10" role="main" aria-label="Dashboard ekranı">
      {/* KPI Cards */}
      <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <KpiCard label="Toplam Ziyaret" value={planned} icon={<Activity className="w-4 h-4" />} tone="cyan" />
        <KpiCard label="Yolda" value={onTheWay} icon={<Timer className="w-4 h-4" />} tone="blue" />
        <KpiCard label="Tamamlandı" value={done} icon={<CheckCircle className="w-4 h-4" />} tone="green" />
        <KpiCard label="Bekleyen" value={waiting} icon={<AlertCircle className="w-4 h-4" />} tone="yellow" />
        <KpiCard label="Dönüşüm" value={`%${conversionRate}`} icon={<UserCheck className="w-4 h-4" />} tone="cyan" />
        <KpiCard label="Tah. Gelir" value={`${estimatedRevenueTL} ₺`} icon={<MapPin className="w-4 h-4" />} tone="cyan" />
      </div>

      {/* Bugünkü Ziyaretler */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-lg">Bugünkü Ziyaretler</h2>
          <button
            onClick={() => setCurrentScreen('visitList')}
            className="text-xs text-cyan-600 hover:underline"
            title="Tüm ziyaretleri gör"
            aria-label="Tüm ziyaretleri listele"
          >
            Tamamını Gör
          </button>
        </div>

        {todayList.length === 0 ? (
          <div className="text-sm text-gray-500 flex items-center gap-2" role="status" aria-live="polite">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Bugün için planlanmış ziyaret bulunmamaktadır 😊
          </div>
        ) : (
          <div className="space-y-4" aria-label="Ziyaret listesi">
            {todayList.map((c) => (
              <VisitCard
                key={c.id}
                customer={c}
                assignedName={getAssignedName(c.id)}
                onDetail={() => { setSelectedCustomer(c); setCurrentScreen('visitDetail'); }}
                onStart={() => { setSelectedCustomer(c); setCurrentScreen('visitFlow'); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;
