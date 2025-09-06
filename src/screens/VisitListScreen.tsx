import React, { useState, useEffect } from 'react'; // useState ve useEffect'i import ediyoruz
import { Search, Mic, Clock, MapPin } from 'lucide-react';
import { Customer } from '../RouteMap';
import { getPriorityColor, getStatusColor } from '../utils/ui';

type Props = {
  customers: Customer[];
  filter: string;
  setFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isListening: boolean;
  onMicClick: () => void;
  assignments: Record<string, string | undefined>;
  allReps: { id: string; name: string }[];
  onDetail: (c: Customer) => void;
  onStart: (c: Customer) => void;
};

const VisitListScreen: React.FC<Props> = ({
  customers, filter, setFilter, searchQuery, setSearchQuery, isListening, onMicClick,
  assignments, allReps, onDetail, onStart
}) => {
  // YENİ EKLENEN KISIM BAŞLANGICI
  // 1. Sayfa durumunu ve sayfa başına öğe sayısını tanımlıyoruz
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3; // Her sayfada 3 öğe görünecek

  // Filtre veya arama sorgusu değiştiğinde kullanıcıyı ilk sayfaya yönlendiriyoruz.
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);
  // YENİ EKLENEN KISIM SONU

  let filtered = customers;
  if (filter === 'Tamamlandı') filtered = filtered.filter(c => c.status === 'Tamamlandı');
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q)
    );
  }
  
  // YENİ EKLENEN KISIM BAŞLANGICI
  // 2. Sayfalama için hesaplamalar
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = filtered.slice(startIndex, endIndex); // Sadece mevcut sayfanın verisini alıyoruz
  // YENİ EKLENEN KISIM SONU

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ziyaret Listesi</h1>
        <div className="flex space-x-2">
          {['Bugün', 'Bu Hafta', 'Tamamlandı'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg ${filter === f ? 'bg-[#0099CB] text-white' : 'bg-white hover:bg-gray-100'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-16 py-3 border rounded-lg"
            placeholder="Müşteri adı, adres veya ilçe ile ara..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button onClick={onMicClick} disabled={isListening}
              className={`p-2 rounded-lg ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#F9C800] bg-opacity-20 text-[#0099CB]'}`}>
              <Mic className="h-5 w-5" />
            </button>
          </div>
        </div>
        {searchQuery && <p className="text-sm text-gray-600 mt-2">"{searchQuery}" için {filtered.length} sonuç</p>}
      </div>

      <div className="space-y-4">
        {/* DEĞİŞTİRİLEN KISIM: Artık 'filtered' yerine 'paginatedCustomers' dizisini map'liyoruz */}
        {paginatedCustomers.map(c => {
          const rid = assignments[c.id];
          const who = rid ? (allReps.find(r=>r.id===rid)?.name || rid) : 'Atanmamış';
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{c.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">{who}</span>
                  </div>
                  <p className="text-gray-600 mb-1">{c.address}, {c.district}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center space-x-1"><Clock className="w-4 h-4" />{c.estimatedDuration}</span>
                    <span className="flex items-center space-x-1"><MapPin className="w-4 h-4" />{c.distance}</span>
                    <span>Saat: {c.plannedTime}</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <button onClick={() => onDetail(c)} className="bg-[#0099CB] text-white px-4 py-2 rounded-lg">Detay</button>
                  {c.status === 'Bekliyor' && (
                    <button onClick={() => onStart(c)} className="bg-[#F9C800] text-gray-900 px-4 py-2 rounded-lg">Ziyarete Başla</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* YENİ EKLENEN KISIM: Sayfalama navigasyon kontrolleri */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Geri
          </button>
          <span className="text-gray-700">
            Sayfa {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            İleri
          </button>
        </div>
      )}
    </div>
  );
};

export default VisitListScreen;