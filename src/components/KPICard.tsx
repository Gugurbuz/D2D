// src/components/KPICard.tsx
import React from 'react';
import { kpiCardColors } from '../styles/theme';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  icon: React.ReactNode;
  type: 'target' | 'completed' | 'pending' | 'performance';
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  progress,
  icon,
  type,
  className = '',
}) => {
  const colors = kpiCardColors[type];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between border-l-4 ${colors.border} ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
        <div className={`${colors.icon}`}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
        {progress !== undefined ? (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
            <div 
              className={`${colors.bg} h-full rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default KPICard;