import React from 'react';
import { MapPin } from 'lucide-react';
import { Chip } from '../utils/ui';
import { Customer } from '../RouteMap';
import { Rep } from '../types';

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

  const statusTone = (s: Customer['status']) => (s === 'Tamamlandı' ? 'green' : s === 'Yolda' ? 'blue' : 'yellow');
  const badgeAssignedTo = (c: Customer) => {
    const rid = assignments[c.id];
    if (!rid) return null;
    const nm = allReps.find(r=>r.id===rid)?.name || rid;
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-100 text-gray-800 border-gray-200">{nm}</span>;
  };

  const planned = customers.length;
  const onTheWay = customers.filter(c => c.status === 'Yolda').length;
  const done = customers.filter(c => c.status === 'Tamamlandı').length;
  const waiting = customers.filter(c => c.status === 'Bekliyor').length;
  const conversionRate = planned ? Math.round((done / planned) * 100) : 0;
  const estimatedRevenueTL = done * 19;

  return (
    <div className="px-6">
      {/* KPI Kartları */}
      <div className="py-4 grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          ['Toplam Ziyaret', planned],
          ['Yolda', onTheWay],
          ['Tamamlandı', done],
          ['Bekleyen', waiting],
          ['Dönüşüm', `%${conversionRate}`],
          ['Tah. Gelir', `${estimatedRevenueTL} ₺`],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-3xl font-bold text-gray-900">{value as string}</div>
          </div>
        ))}
      </div>

      {/* Bugünkü Ziyaretler */}
      <div className="py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Bugünkü Ziyaretler</div>
            <button onClick={() => setCurrentScreen('visitList')} className="text-xs text-[#0099CB] hover:underline">Tamamını Gör</button>
          </div>
          <div className="space-y-3">
            {todayList.map(c => (
              <div key={c.id} className="bg-white border border-gray-200 hover:border-[#0099CB] rounded-xl p-3 flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-sm text-gray-600">{c.address} – {c.district}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Chip tone={statusTone(c.status)}>{c.status}</Chip>
                    <Chip tone={c.priority === 'Yüksek' ? 'red' : c.priority === 'Orta' ? 'yellow' : 'green'}>
                      {c.priority} Öncelik
                    </Chip>
                    <Chip tone="blue">{c.tariff === 'İş Yeri' ? 'B2B' : 'B2C'} – {c.tariff === 'İş Yeri' ? 'Sabit Fiyat' : 'Endeks'}</Chip>
                    {badgeAssignedTo(c)}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <div className="text-sm text-gray-900">{c.plannedTime}</div>
                  <div className="text-xs text-gray-500">{c.distance}</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => { setSelectedCustomer(c); setCurrentScreen('visitDetail'); }}
                            className="px-3 py-1.5 rounded-lg bg-[#0099CB] text-white text-xs">Detay</button>
                    {c.status === 'Bekliyor' && (
                      <button onClick={() => { setSelectedCustomer(c); setCurrentScreen('visitFlow'); }}
                              className="px-3 py-1.5 rounded-lg bg-[#F9C800] text-gray-900 text-xs">Başlat</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
