// src/utils/ui.tsx
import React, { ReactNode } from 'react';

export const getStatusColor = (s: string) =>
  s === 'Bekliyor' ? 'bg-yellow-100 text-yellow-800'
    : s === 'Yolda' ? 'bg-blue-100 text-blue-800'
    : s === 'Tamamlandı' ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';

export const getPriorityColor = (p: string) =>
  p === 'Yüksek' ? 'bg-red-100 text-red-800'
    : p === 'Orta' ? 'bg-orange-100 text-orange-800'
    : p === 'Düşük' ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';

type ChipProps = {
  tone?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  children: ReactNode;
};

export const Chip: React.FC<ChipProps> = ({ tone='gray', children }) => {
  const tones: Record<string, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow:'bg-yellow-100 text-yellow-800 border-yellow-200',
    red:   'bg-red-100 text-red-800 border-red-200',
    blue:  'bg-blue-100 text-blue-800 border-blue-200',
    gray:  'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${tones[tone]}`}>
      {children}
    </span>
  );
};
