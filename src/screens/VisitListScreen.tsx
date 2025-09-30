
import React, { useState, useEffect, useCallback } from 'react';
import CustomerFilters from '../features/customers/components/CustomerFilters';
import CustomerList from '../features/customers/components/CustomerList';
import { useCustomerFilters } from '../features/customers/hooks/useCustomers';
import { Customer } from '../features/customers/types';
import { APP_CONFIG } from '../shared/constants/app';

interface VisitListScreenProps {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: any[];
  setCurrentScreen: (screen: any) => void;
  onSelectCustomer: (customer: Customer) => void;
}

const VisitListScreen: React.FC<VisitListScreenProps> = ({
  customers,
  assignments,
  allReps,
  setCurrentScreen,
  onSelectCustomer,
}) => {
  const [page, setPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(true);
  
  const {
    filters,
    setFilters,
    sort,
    setSort,
    filteredCustomers,
  } = useCustomerFilters(customers);

  // Hide filters on mobile by default
  useEffect(() => {
    if (window.innerWidth < 768) {
      setFiltersVisible(false);
    }
  }, []);

  const visibleItems = filteredCustomers.slice(0, page * APP_CONFIG.defaultPageSize);

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'Tümü',
      priority: 'Tümü',
      district: 'Tümü',
      dateRange: 'Tümü',
    });
    setSort({ field: 'plannedTime', direction: 'asc' });
    setPage(1);
  };

  const selectAndGo = useCallback(
    (customer: Customer, screen: 'visitDetail' | 'visitFlow') => {
      onSelectCustomer(customer);
      requestAnimationFrame(() => setCurrentScreen(screen));
    },
    [onSelectCustomer, setCurrentScreen]
  );

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <CustomerFilters
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onReset={resetFilters}
        visible={filtersVisible}
        onToggleVisibility={() => setFiltersVisible(v => !v)}
      />

      <CustomerList
        customers={visibleItems}
        assignments={assignments}
        allReps={allReps}
        onSelectCustomer={(customer) => selectAndGo(customer, 'visitDetail')}
        onStartVisit={(customer) => selectAndGo(customer, 'visitFlow')}
      />

      {filteredCustomers.length > visibleItems.length && (
        <div className="text-center">
          <button
            onClick={() => setPage(p => p + 1)}
            className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 text-sm"
          >
            Daha Fazla Yükle ({filteredCustomers.length - visibleItems.length} kaldı)
          </button>
        </div>
      )}
    </div>
  );
};

export default VisitListScreen;