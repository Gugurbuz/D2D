// src/components/Chip.tsx
import React from 'react';
import { getShade } from '../styles/theme';

type ChipProps = {
  label: string;
  // color: palette anahtarı: 'green' | 'amber' | 'navy' | 'Planlandı' ... (theme.ts'te tanımlı)
  color?: string;
  variant?: 'soft' | 'solid' | 'outline';
  className?: string;
  leadingIcon?: React.ReactNode;
};

const Chip: React.FC<ChipProps> = ({
  label,
  color,
  variant = 'soft',
  className = '',
  leadingIcon,
}) => {
  const shade = getShade(color); // her zaman bir Shade döner (gray fallback)

  // Variant bazlı stiller (DEFAULT ve soft/ring güvenli kullanılıyor)
  const base =
    'inline-flex items-center gap-1.5 rounded-full text-xs font-medium whitespace-nowrap';

  const stylesByVariant: Record<typeof variant, string> = {
    soft: `bg-[${shade.soft || '#F3F4F6'}] text-[${shade.DEFAULT}] ring-1 ring-[${shade.ring || '#E5E7EB'}] px-2 py-1`,
    solid: `bg-[${shade.DEFAULT}] text-[${shade.fg || '#ffffff'}] px-2 py-1`,
    outline: `bg-transparent text-[${shade.DEFAULT}] ring-1 ring-[${shade.DEFAULT}] px-2 py-1`,
  };

  const style = stylesByVariant[variant];

  return (
    <span className={`${base} ${style} ${className}`}>
      {leadingIcon ? <span className="grid place-items-center">{leadingIcon}</span> : null}
      {label}
    </span>
  );
};

export default Chip;
