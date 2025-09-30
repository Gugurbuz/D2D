import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import Button from '../../../shared/components/Button';
import VisitCard from '../../visits/components/VisitCard';
import { Customer } from '../../customers/types';
import { BRAND_COLORS } from '../../../styles/theme';

interface VisitProgramProps {
  title: string;
  visits: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: any[];
  noVisitMessage: string;
  onSelectCustomer: (customer: Customer) => void;
  onStartVisit: (customer: Customer) => void;
  onViewAll: () => void;
}

const VisitProgram: React.FC<VisitProgramProps> = ({
  title,
  visits,
  assignments,
  allReps,
  noVisitMessage,
  onSelectCustomer,
  onStartVisit,
  onViewAll,
}) => {
  const getAssignedName = (customerId: string) => {
    const repId = assignments[customerId];
    return repId ? allReps.find(r => r.id === repId)?.name : undefined;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      
      {visits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>{noVisitMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.slice(0, 5).map((customer) => (
            <VisitCard
              key={customer.id}
              customer={customer}
              assignedName={getAssignedName(customer.id)}
              onDetail={() => onSelectCustomer(customer)}
              onStart={() => onStartVisit(customer)}
            />
          ))}
          {visits.length > 5 && (
            <div className="text-center pt-4">
              <Button variant="soft" onClick={onViewAll}>
                Tüm Ziyaretleri Gör (+{visits.length - 5})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitProgram;