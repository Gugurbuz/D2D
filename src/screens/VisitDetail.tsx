import React from 'react';
import Navigation from '../components/Navigation';
import { Customer, Screen } from '../types';
import { MapPin, CheckCircle } from 'lucide-react';

type Props = {
  selectedCustomer: Customer;
  setCurrentScreen: (s: Screen) => void;
  startVisit: (c: Customer) => void;
  agentName: string;
  currentScreen: Screen;
};

const VisitDetail: React.FC<Props> = ({ selectedCustomer, setCurrentScreen, startVisit, agentName, currentScreen }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation agentName={agentName} currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ziyaret Detayı</h1>
          <button onClick={() => setCurrentScreen('visitList')} className="text-gray-600 hover:text-gray-900">← Geri</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h3>
              <div className="space-y-3">
                <div><label className="text-sm font-medium text-gray-600">Müşteri Adı</label><p className="text-gray-900 font-medium">{selectedCustomer.name}</p></div>
                <div><label className="text-sm font-medium text-gray-600">Adres</label><p className="text-gray-900">{selectedCustomer.address}, {selectedCustomer.district}</p></div>
                <div><label className="text-sm font-medium text-gray-600">Tarife</label><p className="text-gray-900">{selectedCustomer.tariff}</p></div>
                <div><label className="text-sm font-medium text-gray-600">Sayaç Numarası</label><p className="text-gray-900">{selectedCustomer.meterNumber}</p></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tüketim & Geçmiş</h3>
              <div className="space-y-3">
                <div><label className="text-sm font-medium text-gray-600">Aylık Tüketim</label><p className="text-gray-900 font-medium">{selectedCustomer.consumption}</p></div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Teklif Geçmişi</label>
                  <div className="space-y-1">
                    {selectedCustomer.offerHistory.map((offer, i) => (
                      <p key={i} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{offer}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          {selectedCustomer.status === 'Bekliyor' && (
            <button onClick={() => startVisit(selectedCustomer)} className="bg-[#0099CB] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0088B8] transition-colors flex items-center space-x-2">
              <MapPin className="w-5 h-5" /><span>Ziyarete Başla</span>
            </button>
          )}
          {selectedCustomer.status === 'Yolda' && (
            <button onClick={() => setCurrentScreen('visitResult')} className="bg-[#F9C800] text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-[#E6B500] transition-colors flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" /><span>Ziyareti Tamamla</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitDetail;
