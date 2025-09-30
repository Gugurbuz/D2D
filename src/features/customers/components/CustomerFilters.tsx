import React from 'react';
import { Search, Import as SortAsc, Dessert as SortDesc } from 'lucide-react';
import { CustomerFilters, CustomerSort } from '../types';

interface CustomerFiltersProps {
  filters: CustomerFilters;
  sort: CustomerSort;
  onFiltersChange: (filters: CustomerFilters) => void;
  onSortChange: (sort: CustomerSort) => void;
  onReset: () => void;
  visible?: boolean;
  onToggleVisibility?: () => void;
}

const CustomerFiltersComponent: React.FC<CustomerFiltersProps> = ({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onReset,
  visible = true,
  onToggleVisibility,
}) => {
  const updateFilter = <K extends keyof CustomerFilters>(
    key: K,
    value: CustomerFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleSort = (field: keyof CustomerSort['field']) => {
    if (sort.field === field) {
      onSortChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ field, direction: 'asc' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Müşteri adı, adres veya no ile ara..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
        />
      </div>

      {/* Toggle Filters */}
      {onToggleVisibility && (
        <div className="text-right">
          <button
            onClick={onToggleVisibility}
            className="text-sm text-blue-600 hover:underline"
          >
            {visible ? 'Filtreleri Gizle ▲' : 'Filtreleri Göster ▼'}
          </button>
        </div>
      )}

      {visible && (
        <>
          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700">Durum</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Tümü', 'Planlandı', 'Tamamlandı', 'İptal', 'Yolda'].map((status) => {
                  const isActive = filters.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => updateFilter('status', status as any)}
                      className={`px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${
                        isActive
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700">Tarih</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Tümü', 'Bugün', 'Yarın', 'Bu Hafta'].map((date) => {
                  const isActive = filters.dateRange === date;
                  return (
                    <button
                      key={date}
                      onClick={() => updateFilter('dateRange', date as any)}
                      className={`px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${
                        isActive
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {date}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700">Sıralama</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'plannedTime', label: 'Tarihe Göre' },
                  { key: 'priority', label: 'Önceliğe Göre' },
                ].map((item) => {
                  const isActive = sort.field === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleSort(item.key as any)}
                      className={`flex items-center justify-center gap-1 px-4 py-2 min-w-[120px] rounded-full border text-sm transition whitespace-nowrap ${
                        isActive
                          ? 'bg-gray-200 text-gray-900 border-gray-400'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        sort.direction === 'asc' ? 
                        <SortAsc size={16} /> : 
                        <SortDesc size={16} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="text-right pt-2">
            <button
              onClick={onReset}
              className="text-sm text-blue-600 hover:underline"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerFiltersComponent;