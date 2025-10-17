import React from 'react';
import { MapPin } from 'lucide-react';
import { Customer } from '../RouteMap';

type Props = {
  customer: Customer;
  onBack: () => void;
  onStartVisit: (c: Customer) => void;
};

const VisitDetailScreen: React.FC<Props> = ({ customer, onBack, onStartVisit }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Ziyaret Detayı</h1>
      <button onClick={onBack} className="text-gray-600 hover:text-gray-900">← Geri</button>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 grid md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h3>
        <div className="space-y-3">
          <div><span className="text-sm text-gray-600">Müşteri</span><p className="font-medium">{customer.name}</p></div>
          <div><span className="text-sm text-gray-600">Adres</span><p>{customer.address}, {customer.district}</p></div>
          <div><span className="text-sm text-gray-600">Tarife</span><p>{customer.tariff}</p></div>
          <div><span className="text-sm text-gray-600">Sayaç</span><p>{customer.meterNumber}</p></div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tüketim & Geçmiş</h3>
        <div className="space-y-3">
          <div><span className="text-sm text-gray-600">Aylık Tüketim</span><p className="font-medium">{customer.consumption}</p></div>
          <div>
            <span className="text-sm text-gray-600">Teklif Geçmişi</span>
            <div className="space-y-1 mt-1">{customer.offerHistory.map((o,i)=><p key={i} className="text-sm bg-gray-50 p-2 rounded">{o}</p>)}</div>
          </div>
        </div>
      </div>
    </div>

    <div className="flex gap-3">
      <button onClick={() => onStartVisit(customer)}
              className="bg-[#0099CB] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0088B8] transition-colors flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        <span>Ziyarete Başla</span>
      </button>
    </div>
  </div>
);

export default VisitDetailScreen;
