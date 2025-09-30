import React, { memo } from 'react';
import VisitCard from '../../visits/components/VisitCard';
import { Customer } from '../types';

interface CustomerListProps {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: any[];
  onSelectCustomer: (customer: Customer) => void;
  onStartVisit: (customer: Customer) => void;
  className?: string;
}

const CustomerList: React.FC<CustomerListProps> = memo(({
  customers,
  assignments,
  allReps,
  onSelectCustomer,
  onStartVisit,
  className = '',
}) => {
  const getAssignedName = (customerId: string) => {
    const repId = assignments[customerId];
    return repId ? allReps.find(r => r.id === repId)?.name || repId : null;
  };

  if (customers.length === 0) {
    return (
      <div className={`text-center py-12 text-gray-500 ${className}`}>
        Hiç müşteri bulunamadı.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {customers.map((customer) => (
        <VisitCard
          key={customer.id}
          customer={customer}
          assignedName={getAssignedName(customer.id)}
          onDetail={() => onSelectCustomer(customer)}
          onStart={() => onStartVisit(customer)}
        />
      ))}
    </div>
  );
});

CustomerList.displayName = 'CustomerList';

export default CustomerList;