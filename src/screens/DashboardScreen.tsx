import React from 'react';
import { KpiCard } from '../components/KpiCard';
import { VisitCard } from '../components/VisitCard';
import { Customer } from '../RouteMap';
import { Rep } from '../types';

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
