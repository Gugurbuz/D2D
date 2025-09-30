import { useState, useEffect, useMemo } from 'react';
import { Customer, CustomerFilters, CustomerSort } from '../types';
import { mockCustomers } from '../../../data/mockCustomers';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';

export function useCustomers(isDemoMode: boolean = false) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load customers data
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        if (isDemoMode) {
          // Use mock data
          setCustomers(mockCustomers as Customer[]);
        } else {
          // TODO: Load from Supabase
          setCustomers([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [isDemoMode]);

  return {
    customers,
    loading,
    error,
    setCustomers,
  };
}

export function useCustomerFilters(customers: Customer[]) {
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'Tümü',
    priority: 'Tümü',
    district: 'Tümü',
    dateRange: 'Tümü',
  });
  
  const [sort, setSort] = useState<CustomerSort>({
    field: 'plannedTime',
    direction: 'asc',
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (debouncedSearch.trim()) {
      const searchTerm = debouncedSearch.toLowerCase().trim();
      result = result.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.address.toLowerCase().includes(searchTerm) ||
        customer.customerNumber?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'Tümü') {
      result = result.filter(customer => customer.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'Tümü') {
      result = result.filter(customer => customer.priority === filters.priority);
    }

    // District filter
    if (filters.district !== 'Tümü') {
      result = result.filter(customer => customer.district === filters.district);
    }

    // Date range filter
    if (filters.dateRange !== 'Tümü') {
      result = result.filter(customer => {
        if (!customer.visitDate) return false;
        const date = parseISO(customer.visitDate);
        
        switch (filters.dateRange) {
          case 'Bugün':
            return isToday(date);
          case 'Yarın':
            return isTomorrow(date);
          case 'Bu Hafta':
            return isThisWeek(date, { weekStartsOn: 1 });
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [customers, debouncedSearch, filters, sort]);

  return {
    filters,
    setFilters,
    sort,
    setSort,
    filteredCustomers,
  };
}