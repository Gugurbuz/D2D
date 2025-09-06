import React from 'react';
import { Customer, Rep } from '../types';
import VisitCard from '../components/VisitCard';

interface VisitListScreenProps {
  customers: Customer[];
  filter: string;
  searchQuery: string;
  onDetail: (customer: Customer) => void;
  onStart: (customer: Customer) => void;
  currentRep?: Rep;
}

const VisitListScreen: React.FC<VisitListScreenProps> = ({
  customers,
  filter,
  searchQuery,
  onDetail,
  onStart,
  currentRep
}) => {
  // Filter customers based on status filter
  const filteredByStatus = filter === 'all' 
    ? customers 
    : customers.filter(customer => customer.status.toLowerCase() === filter.toLowerCase());

  // Further filter by search query
  const filteredCustomers = searchQuery
    ? filteredByStatus.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.district.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredByStatus;

  return (
    <div className="p-4 space-y-4">
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchQuery 
              ? `"${searchQuery}" araması için sonuç bulunamadı.`
              : 'Bu filtre için müşteri bulunamadı.'
            }
          </p>
        </div>
      ) : (
        filteredCustomers.map(customer => (
          <VisitCard
            key={customer.id}
            customer={customer}
            onDetail={onDetail}
            onStart={onStart}
          />
        ))
      )}
    </div>
  );
};

export default VisitListScreen;