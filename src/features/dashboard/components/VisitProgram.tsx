import React from 'react';
import { Eye, Play } from 'lucide-react';
import type { Customer } from '../../../types';

type Props = {
  title: string;
  visits: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: any[];
  noVisitMessage: string;
  onSelectCustomer: (customer: Customer) => void;
  onStartVisit: (customer: Customer) => void;
  onViewAll: () => void;
};

const VisitProgram: React.FC<Props> = ({
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
    return repId ? allReps.find(r => r.id === repId)?.name || repId : null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {visits.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-sm text-[#0099CB] hover:text-[#007CA8] font-medium"
          >
            Tümünü Görüntüle
          </button>
        )}
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{noVisitMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.slice(0, 5).map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-600">{customer.address}, {customer.district}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-500">Saat: {customer.plannedTime}</span>
                  <span className="text-xs text-gray-500">Öncelik: {customer.priority}</span>
                  {getAssignedName(customer.id) && (
                    <span className="text-xs text-gray-500">
                      Atanan: {getAssignedName(customer.id)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectCustomer(customer)}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Detay
                </button>
                {customer.status === 'Bekliyor' && (
                  <button
                    onClick={() => onStartVisit(customer)}
                    className="px-3 py-1.5 text-sm bg-[#0099CB] text-white rounded-lg hover:bg-[#007CA8] flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Başlat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitProgram;