import React from 'react';
import Navigation from '../components/Navigation';
import { Customer, Screen, VisitResult } from '../types';
import { CheckCircle, AlertCircle, XCircle, Home, Camera } from 'lucide-react';

type Props = {
  selectedCustomer: Customer | null;
  visitResult: VisitResult;
  setVisitResult: (r: VisitResult) => void;
  visitNotes: string;
  setVisitNotes: (s: string) => void;
  handleCompleteVisit: () => void;
  setCurrentScreen: (s: Screen) => void;
  agentName: string;
  currentScreen: Screen;
};

const VisitResultScreen: React.FC<Props> = ({
  selectedCustomer,
  visitResult,
  setVisitResult,
  visitNotes,
  setVisitNotes,
  handleCompleteVisit,
  setCurrentScreen,
  agentName,
  currentScreen,
}) => {
  const options: { value: VisitResult; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'Satış Yapıldı', label: 'Satış Yapıldı', icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'Teklif Verildi', label: 'Teklif Verildi', icon: <AlertCircle className="w-5 h-5" />, color: 'bg-[#F9C800] bg-opacity-20 text-[#0099CB] border-[#F9C800]' },
    { value: 'Reddedildi', label: 'Reddedildi', icon: <XCircle className="w-5 h-5" />, color: 'bg-red-100 text-red-800 border-red-300' },
    { value: 'Evde Yok', label: 'Evde Yok', icon: <Home className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation agentName={agentName} currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ziyaret Sonucu</h1>
          <button onClick={() => setCurrentScreen('visitDetail')} className="text-gray-600 hover:text-gray-900">← Geri</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedCustomer?.name} - Ziyaret Sonucu
            </h3>
            <p className="text-gray-600">{selectedCustomer?.address}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Ziyaret Sonucu</label>
            <div className="grid grid-cols-2 gap-3">
              {options.map((o) => (
                <button
                  key={o.label}
                  onClick={() => setVisitResult(o.value)}
                  className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
                    visitResult === o.value ? o.color : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {o.icon}
                  <span className="font-medium">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
            <textarea
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
              rows={4}
              placeholder="Ziyaret ile ilgili notlarınızı buraya yazın..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sayaç Fotoğrafı</label>
            <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Fotoğraf Çek / Yükle</span>
            </button>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleCompleteVisit}
              disabled={!visitResult}
              className="flex-1 bg-[#0099CB] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0088B8] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Kaydet ve Sonraki
            </button>
            <button
              onClick={() => setCurrentScreen('visitDetail')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitResultScreen;
