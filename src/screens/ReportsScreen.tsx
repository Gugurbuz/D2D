import React from 'react';
import { MapPin, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Customer } from '../RouteMap';

type Props = { customers: Customer[]; };

const ReportsScreen: React.FC<Props> = ({ customers }) => {
  const salesCount = customers.filter(c => c.status === 'Tamamlandı').length;
  const salesRate = customers.length ? Math.round((salesCount / customers.length) * 100) : 0;
  const offersGiven = Math.floor(salesCount * 1.5);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gün Sonu Raporu</h1>
        <div className="text-sm text-gray-600">{new Date().toLocaleDateString('tr-TR', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>
      </div>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Toplam Ziyaret</p><p className="text-2xl font-bold text-[#0099CB]">{customers.length}</p></div><MapPin className="w-8 h-8 text-[#0099CB]" /></div></div>
        <div className="bg-white rounded-2xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Satış Oranı</p><p className="text-2xl font-bold text-[#F9C800]">%{salesRate}</p></div><TrendingUp className="w-8 h-8 text-[#F9C800]" /></div></div>
        <div className="bg-white rounded-2xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Verilen Teklifler</p><p className="text-2xl font-bold text-[#0099CB]">{offersGiven}</p></div><AlertCircle className="w-8 h-8 text-[#0099CB]" /></div></div>
        <div className="bg-white rounded-2xl shadow-sm p-6"><div className="flex justify-between"><div><p className="text-sm text-gray-600">Tamamlanan</p><p className="text-2xl font-bold text-[#0099CB]">{salesCount}</p></div><CheckCircle className="w-8 h-8 text-[#0099CB]" /></div></div>
      </div>
    </div>
  );
};

export default ReportsScreen;
