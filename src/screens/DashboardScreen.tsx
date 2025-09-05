import React from 'react';
import { Eye, Play, MapPin, UserCheck, CheckCircle, Timer, Activity, AlertCircle } from 'lucide-react';
import { Customer } from '../RouteMap';
import { Rep } from '../types';

export const Chip = ({ tone = 'gray', children }: { tone?: 'blue' | 'yellow' | 'green' | 'red' | 'gray'; children: React.ReactNode }) => {
  const tones: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${tones[tone]} font-medium`}>
      {children}
    </span>
  );
};

const KpiCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center space-x-3">
    <div className="p-2 bg-cyan-100 text-cyan-700 rounded-full">{icon}</div>
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  </div>
);

const VisitCard: React.FC<{
  customer: Customer;
  assignedName: string | null;
  onDetail: () => void;
  onStart: () => void;
}> = ({ customer, assignedName, onDetail, onStart }) => {
  const statusTone = customer.status === 'Tamamlandı' ? 'green' : customer.status === 'Yolda' ? 'blue' : 'yellow';
  const priorityTone = customer.priority === 'Yüksek' ? 'red' : customer.priority === 'Orta' ? 'yellow' : 'green';
  const typeLabel = customer.tariff === 'İş Yeri' ? 'B2B – Sabit Fiyat' : 'B2C – Endeks';

  return (
    <div className="bg-white border border-gray-200 hover:border-cyan-600 rounded-xl p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="text-lg font-semibold text-gray-900">{customer.name}</div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {customer.address} – {customer.district}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip tone={statusTone}>{customer.status}</Chip>
            <Chip tone={priorityTone}>{customer.priority} Öncelik</Chip>
            <Chip tone="blue">{typeLabel}</Chip>
            {assignedName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-100 text-gray-800 border-gray-200">
                <UserCheck className="w-3 h-3 mr-1" /> {assignedName}
              </span>
            )}
          </div>
        </div>
        <div className="text-right space-y-2 flex flex-col items-end justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">{customer.plannedTime}</div>
            <div className="text-xs text-gray-500">{customer.distance}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={onDetail}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs transition"
              aria-label="Ziyaret detayını gör"
              title="Detay"
            >
              <Eye className="w-4 h-4" /> Detay
            </button>
            {customer.status === 'Bekliyor' && (
              <button
                onClick={onStart}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs transition"
                aria-label="Ziyareti başlat"
                title="Başlat"
              >
                <Play className="w-4 h-4" /> Başlat
              </button>
            )}
          </div>
        </div>
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

const DashboardScreen: React.FC<Props> = ({
  customers,
  assignments,
  allReps,
  setCurrentScreen,
  setSelectedCustomer
}) => {
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
    <div className="px-6 pb-10 space-y-10">
      {/* KPI Cards */}
      <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <KpiCard label="Toplam Ziyaret" value={planned} icon={<Activity className="w-4 h-4" />} />
        <KpiCard label="Yolda" value={onTheWay} icon={<Timer className="w-4 h-4" />} />
        <KpiCard label="Tamamlandı" value={done} icon={<CheckCircle className="w-4 h-4" />} />
        <KpiCard label="Bekleyen" value={waiting} icon={<AlertCircle className="w-4 h-4" />} />
        <KpiCard label="Dönüşüm" value={`%${conversionRate}`} icon={<UserCheck className="w-4 h-4" />} />
        <KpiCard label="Tah. Gelir" value={`${estimatedRevenueTL} ₺`} icon={<MapPin className="w-4 h-4" />} />
      </div>

      {/* Today’s Visits */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-lg">Bugünkü Ziyaretler</h2>
          <button
            onClick={() => setCurrentScreen('visitList')}
            className="text-xs text-cyan-600 hover:underline"
            title="Tüm ziyaretleri gör"
          >
            Tamamını Gör
          </button>
        </div>

        {todayList.length === 0 ? (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Bugün için planlanmış ziyaret bulunmamaktadır 😊
          </div>
        ) : (
          <div className="space-y-4">
            {todayList.map((c) => (
              <VisitCard
                key={c.id}
                customer={c}
                assignedName={getAssignedName(c.id)}
                onDetail={() => {
                  setSelectedCustomer(c);
                  setCurrentScreen('visitDetail');
                }}
                onStart={() => {
                  setSelectedCustomer(c);
                  setCurrentScreen('visitFlow');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;
