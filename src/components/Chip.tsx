// src/components/Chip.tsx
import React from 'react';
import { themeColors, statusStyles } from '../styles/theme';
import { SortAsc, SortDesc } from 'lucide-react';

type ChipProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
  sortDirection?: 'asc' | 'desc' | null;
};

export const Chip = ({ label, isActive, onClick, sortDirection }: ChipProps) => {
  // Gelen label'a göre tema rengini bul (örn: "Planlandı" -> "warning")
  const statusKey = statusStyles[label] || 'neutral';
  const colors = themeColors[statusKey];

  // Aktif ve pasif durumlar için stilleri belirle
  const baseClasses = "flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition whitespace-nowrap cursor-pointer";
  
  const activeClasses = `bg-[${colors.DEFAULT}] text-[${colors.text}] border-[${colors.dark}] shadow-sm`;
  const inactiveClasses = `bg-[${colors.light}] text-[${colors.text}] border-[${colors.light}] hover:border-[${colors.DEFAULT}] hover:bg-white`;

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {label}
      {isActive && sortDirection && (
        sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
      )}
    </button>
  );
};