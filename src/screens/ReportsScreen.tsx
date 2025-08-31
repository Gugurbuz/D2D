import React from 'react';
import Navigation from '../components/Navigation';
import { Screen, Customer } from '../types';
import { MapPin, TrendingUp, AlertCircle, CheckCircle, Route } from 'lucide-react';

type Props = {
  customers: Customer[];
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  agentName: string;
};

const Reports: React.FC<Props> = ({ customers, currentScreen, setCurrentScreen, agentName }) => {
  const total = customers.length;
  const completed = customers.filter(c => c.status === 'Tamamlandı').length;
  const salesRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const offersGiven = Math.floor(completed * 1.5); // mock

  const getStatusColor = (status: string) =>
    status === 'Tamamlandı' ? 'bg-green-100 text-green-800' :
    status === 'Yolda' ? 'bg-blue-100 text-blue-800' :
    'bg-yellow-100 text-yellow-800';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation agentName={agentName} currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gün Sonu Raporu</h1>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Ziyaret</p>
                <p className="text-2xl font-bold text-[#0099CB]">{total}</p>
              </div>
              <MapPin className="w-8 h-8 text-[#0099CB]" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satış Oranı</p>
                <p className="text-2xl font-bold text-[#F9C800]">%{salesRate}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#F9C800]" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verilen Teklifler</p>
                <p className="text-2xl font-bold text-[#0099CB]">{offersGiven}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-[#0099CB]" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                <p className="text-2xl font-bold text-[#0099CB]">{completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#0099CB]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ziyaret Detayları</h3>
            <div className="space-y-3">
              {customers.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-600">{c.district}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rota Haritası</h3>
            <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Route className="w-12 h-12 text-[#0099CB] mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Günlük Rota Özeti</p>
                <p className="text-sm text-gray-500 mt-2">Toplam Mesafe: ~8.2 km<br/>Ortalama Ziyaret Süresi: 32 dk</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
