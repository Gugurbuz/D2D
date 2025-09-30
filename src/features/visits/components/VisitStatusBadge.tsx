import React from 'react';
import { getStatusChipClassesFromKPI } from '../../../styles/theme';

interface VisitStatusBadgeProps {
  status: string;
  className?: string;
}

const VisitStatusBadge: React.FC<VisitStatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusChipClassesFromKPI(status)} ${className}`}>
      {status}
    </span>
  );
};

export default VisitStatusBadge;