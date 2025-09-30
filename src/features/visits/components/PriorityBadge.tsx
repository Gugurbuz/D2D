import React from 'react';
import { getPriorityChipClassesFromKPI } from '../../../styles/theme';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getPriorityChipClassesFromKPI(priority)} ${className}`}>
      {priority} Öncelik
    </span>
  );
};

export default PriorityBadge;