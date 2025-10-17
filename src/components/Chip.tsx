// src/components/Chip.tsx
import React from 'react';
import { chipStyles, ChipVariant, ChipColor, getStatusColor } from '../styles/theme';

interface ChipProps {
  label: string;
  color?: ChipColor | string;
  variant?: ChipVariant;
  className?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Chip: React.FC<ChipProps> = ({
  label,
  color,
  variant = 'soft',
  className = '',
  leadingIcon,
  trailingIcon,
}) => {
  // Durum bazlı renk eşlemesi
  const resolvedColor = color ? (
    ['navy', 'yellow', 'success', 'warning', 'error', 'neutral'].includes(color) 
      ? color as ChipColor
      : getStatusColor(color)
  ) : 'neutral';

  const baseClasses = chipStyles.base;
  const variantClasses = chipStyles.variants[variant][resolvedColor];

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {leadingIcon && <span className="grid place-items-center">{leadingIcon}</span>}
      {label}
      {trailingIcon && <span className="grid place-items-center">{trailingIcon}</span>}
    </span>
  );
};

export default Chip;