import React from 'react';
import { Customer } from '../RouteMap';
import { Rep } from '../types';

// Chip bileşeni (örnek)
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

// KPI Kart bileşeni
const KpiCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-3xl font-bold text-gray-900">{value}</div>
  </div>
);

// Ziyaret Kartı bileşeni
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
    <div className="bg-white border border-gray-200 hover:border-cyan-600 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 transition-all">
      <div className="flex-1 space-y-1">
        <div className="font-medium text-gray-900">{customer.name}</div>
        <div className="text-sm text-gray-600">{customer.address} – {customer.district}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip tone={statusTone}>{customer.status}</Chip>
          <Chip tone={priorityTone}>{customer.priority} Öncelik</Chip>
          <Chip tone="blue">{typeLabel}</Chip>
          {assignedName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-100 text-gray-800 border-gray-200">
              {assignedName}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 space-y-2">
        <div className="text-sm text-gray-900">{customer.plannedTime}</div>
        <div className="text-xs text-gray-500">{customer.distance}</div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onDetail}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs transition"
            aria-label="Ziyaret detayını gör"
          >
            Detay
          </button>
          {customer.status === 'Bekliyor' && (
            <button
              onClick={onStart}
              className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs transition"
              aria-label="Ziyareti başlat"
            >
              Başlat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Ana Dashboard bileşeni
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
    <div className="px-6">
      {/* KPI Cards */}
      <div className="py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <KpiCard label="Toplam Ziyaret" value={planned} />
        <KpiCard label="Yolda" value={onTheWay} />
        <KpiCard label="Tamamlandı" value={done} />
        <KpiCard label="Bekleyen" value={waiting} />
        <KpiCard label="Dönüşüm" value={`%${conversionRate}`} />
        <KpiCard label="Tah. Gelir" value={`${estimatedRevenueTL} ₺`} />
      </div>

      {/* Today’s Visits */}
      <div className="py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
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
            <p className="text-sm text-gray-500">Bugün için planlanmış ziyaret bulunmamaktadır.</p>
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
    </div>
  );
};

export default DashboardScreen;
