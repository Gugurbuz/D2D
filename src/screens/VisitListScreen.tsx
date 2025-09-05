import React, { useState, useEffect } from 'react';
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
  itemsPerPage?: number;
};

const VisitListScreen: React.FC<Props> = ({
  customers,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  isListening,
  onMicClick,
  assignments,
  allReps,
  onDetail,
  onStart,
  itemsPerPage = 3
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filtered.slice(startIndex, endIndex);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Ziyaret Listesi</h1>
        <div className="flex flex-wrap gap-2">
          {['Bugün', 'Bu Hafta', 'Tamamlandı'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === f
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Müşteri adı, adres veya ilçe ile ara..."
            aria-label="Müşteri arama alanı"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={onMicClick}
              disabled={isListening}
              className={`p-2 rounded-lg transition-all focus:outline-none ${
                isListening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'bg-yellow-100 text-cyan-700'
              }`}
              aria-label="Sesli arama başlat"
              title="Sesli arama başlat"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            "{searchQuery}" için <strong>{filtered.length}</strong> sonuç
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {paginatedCustomers.map(c => {
          const rid = assignments[c.id];
          const who = rid ? allReps.find(r => r.id === rid)?.name || rid : 'Atanmamış';
          return (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-md p-6 transition hover:shadow-lg"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">{c.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(c.priority)}`}>
                      {c.priority}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                      {who}
                    </span>
                  </div>
                  <p className="text-gray-600">{c.address}, {c.district}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {c.estimatedDuration}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {c.distance}
                    </span>
                    <span>Saat: {c.plannedTime}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 justify-center">
                  <button
                    onClick={() => onDetail(c)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Detay
                  </button>
                  {c.status === 'Bekliyor' && (
                    <button
                      onClick={() => onStart(c)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg transition"
                    >
                      Ziyarete Başla
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Geri
          </button>
          <span className="text-gray-700 text-sm">
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
