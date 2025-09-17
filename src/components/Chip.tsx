// src/components/Chip.tsx (Geliştirilmiş Hali)

import React from "react";
import { themeColors } from "../styles/theme"; // Merkezi temayı import ediyoruz
import { SortAsc, SortDesc } from "lucide-react";

// 'tone' prop'unu tema renklerimizin anahtarlarıyla eşleştiriyoruz
type Tone = keyof typeof themeColors;

type ChipProps = {
  children: React.ReactNode;
  tone?: Tone;
  // YENİ PROPLAR: Bileşeni interaktif hale getiriyoruz
  isActive?: boolean;
  onClick?: () => void;
  sortDirection?: 'asc' | 'desc' | null;
  // Statik ve interaktif kullanım için as prop'u
  as?: 'button' | 'span'; 
};

export const Chip = ({
  children,
  tone = "neutral",
  isActive = false,
  onClick,
  sortDirection = null,
  as = 'span',
}: ChipProps) => {
  // Renkler artık merkezi temadan geliyor
  const colors = themeColors[tone];

  const baseClasses = "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold transition whitespace-nowrap";
  
  // Aktif ve pasif durumlar için dinamik stil
  // Bütüncül tasarım için aktif durumlar hep aynı stilde olacak
  const activeClasses = `bg-[${colors.DEFAULT}] text-white border-[${colors.dark}] shadow-sm`;
  
  // Pasif durumlar, rengin açık tonunu kullanacak
  const inactiveClasses = `bg-[${colors.light}] text-[${colors.text}] border-transparent hover:border-[${colors.DEFAULT}]`;

  const commonProps = {
    className: `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${onClick ? 'cursor-pointer' : ''}`,
    onClick: onClick,
  };

  const content = (
    <>
      {children}
      {isActive && sortDirection && (
        sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
      )}
    </>
  );

  // 'as' prop'una göre <button> veya <span> render et
  if (as === 'button') {
    return <button {...commonProps} type="button">{content}</button>;
  }
  
  return <span {...commonProps}>{content}</span>;
};