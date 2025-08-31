import React from 'react';
import Navigation from '../components/Navigation';
import { Screen, Customer } from '../types';
import { MapPin, CheckCircle, Clock } from 'lucide-react';

type Props = {
  agentName: string;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  customers: Customer[];
};

const Dashboard: React.FC<Props> = ({ agentName, currentScreen, setCurrentScreen, customers }) => {
  const completedVisits = customers.filter(c => c.status === 'Tamamlandı').length;
  const remainingVisits = customers.filter(c => c.status === 'Bekliyor').length;
  const totalVisits = customers.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation agentName={agentName} currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ana Sayfa</h1>
          <p className="text-gray-600">Bugünkü satış faaliyetleriniz</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bugünkü Ziyaret Sayısı</p>
                <p className="text-3xl font-bold text-[#0099CB]">{totalVisits}</p>
              </div>
              <div className="w-12 h-12 bg-[#F9C800] bg-opacity-20 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[#0099CB]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamamlanan Görevler</p>
                <p className="text-3xl font-bold text-[#0099CB]">{completedVisits}</p>
              </div>
              <div className="w-12 h-12 bg-[#F9C800] bg-opacity-20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#0099CB]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kalan Ziyaretler</p>
                <p className="text-3xl font-bold text-[#0099CB]">{remainingVisits}</p>
              </div>
              <div className="w-12 h-12 bg-[#F9C800] bg-opacity-20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#0099CB]" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentScreen('visitList')}
            className="bg-[#0099CB] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#0088B8] transition-colors shadow-lg"
          >
            Ziyaretleri Başlat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
