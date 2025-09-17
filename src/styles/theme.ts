// src/styles/theme.ts

/* ====================== MARKA PALETİ ====================== */
export const BRAND_COLORS = {
  // Enerjisa Marka Renkleri
  navy: '#002D72',
  yellow: '#F9C800',
  
  // Sistem Renkleri
  success: '#16A34A',
  warning: '#D97706', 
  error: '#DC2626',
  neutral: '#6B7280',
  
  // Ek Renkler
  blue: '#2563EB',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#D97706',
  gray: '#6B7280',
} as const;

/* ====================== RENK TONLARI ====================== */
export type ColorTone = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

export const colorTones: Record<string, ColorTone> = {
  navy: {
    50: '#EBF2FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#002D72',
    600: '#002461',
    700: '#001B50',
    800: '#00123F',
    900: '#000A2E',
    950: '#00051D',
  },
  yellow: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F9C800',
    600: '#D69E00',
    700: '#B37500',
    800: '#92600F',
    900: '#78350F',
    950: '#451A03',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#16A34A',
    600: '#15803D',
    700: '#166534',
    800: '#14532D',
    900: '#14532D',
    950: '#052E16',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#D97706',
    600: '#C2410C',
    700: '#9A3412',
    800: '#7C2D12',
    900: '#7C2D12',
    950: '#431407',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#DC2626',
    600: '#B91C1C',
    700: '#991B1B',
    800: '#7F1D1D',
    900: '#7F1D1D',
    950: '#450A0A',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
};

/* ====================== BUTON VARYANTLARI ====================== */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'soft' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const buttonStyles = {
  base: 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  },
  
  variants: {
    primary: `bg-[${BRAND_COLORS.navy}] text-white hover:bg-[#001B50] focus:ring-[${BRAND_COLORS.navy}]`,
    secondary: `bg-[${BRAND_COLORS.yellow}] text-[${BRAND_COLORS.navy}] hover:bg-[#D69E00] focus:ring-[${BRAND_COLORS.yellow}]`,
    danger: `bg-[${BRAND_COLORS.error}] text-white hover:bg-[#B91C1C] focus:ring-[${BRAND_COLORS.error}]`,
    outline: `bg-transparent border border-[${BRAND_COLORS.navy}] text-[${BRAND_COLORS.navy}] hover:bg-[${BRAND_COLORS.navy}] hover:text-white focus:ring-[${BRAND_COLORS.navy}]`,
    soft: `bg-[#EBF2FF] text-[${BRAND_COLORS.navy}] hover:bg-[#DBEAFE] focus:ring-[${BRAND_COLORS.navy}]`,
    ghost: `bg-transparent text-[${BRAND_COLORS.neutral}] hover:bg-[#F3F4F6] focus:ring-[${BRAND_COLORS.neutral}]`,
  },
} as const;

/* ====================== CHIP VARYANTLARI ====================== */
export type ChipVariant = 'solid' | 'soft' | 'outline';
export type ChipColor = 'navy' | 'yellow' | 'success' | 'warning' | 'error' | 'neutral';

export const chipStyles = {
  base: 'inline-flex items-center gap-1.5 rounded-full text-xs font-medium whitespace-nowrap px-2 py-1',
  
  variants: {
    solid: {
      navy: `bg-[${BRAND_COLORS.navy}] text-white`,
      yellow: `bg-[${BRAND_COLORS.yellow}] text-[${BRAND_COLORS.navy}]`,
      success: `bg-[${BRAND_COLORS.success}] text-white`,
      warning: `bg-[${BRAND_COLORS.warning}] text-white`,
      error: `bg-[${BRAND_COLORS.error}] text-white`,
      neutral: `bg-[${BRAND_COLORS.neutral}] text-white`,
    },
    soft: {
      navy: `bg-[#EBF2FF] text-[${BRAND_COLORS.navy}] border border-[#DBEAFE]`,
      yellow: `bg-[#FFFBEB] text-[${BRAND_COLORS.warning}] border border-[#FEF3C7]`,
      success: `bg-[#F0FDF4] text-[${BRAND_COLORS.success}] border border-[#DCFCE7]`,
      warning: `bg-[#FFFBEB] text-[${BRAND_COLORS.warning}] border border-[#FEF3C7]`,
      error: `bg-[#FEF2F2] text-[${BRAND_COLORS.error}] border border-[#FEE2E2]`,
      neutral: `bg-[#F9FAFB] text-[${BRAND_COLORS.neutral}] border border-[#E5E7EB]`,
    },
    outline: {
      navy: `bg-transparent text-[${BRAND_COLORS.navy}] border border-[${BRAND_COLORS.navy}]`,
      yellow: `bg-transparent text-[${BRAND_COLORS.warning}] border border-[${BRAND_COLORS.yellow}]`,
      success: `bg-transparent text-[${BRAND_COLORS.success}] border border-[${BRAND_COLORS.success}]`,
      warning: `bg-transparent text-[${BRAND_COLORS.warning}] border border-[${BRAND_COLORS.warning}]`,
      error: `bg-transparent text-[${BRAND_COLORS.error}] border border-[${BRAND_COLORS.error}]`,
      neutral: `bg-transparent text-[${BRAND_COLORS.neutral}] border border-[${BRAND_COLORS.neutral}]`,
    },
  },
} as const;

/* ====================== DURUM RENK EŞLEMELERI ====================== */
export const statusColorMap = {
  // Visit Status
  'Planlandı': 'warning',
  'Bekliyor': 'warning', 
  'Yolda': 'navy',
  'Devam': 'navy',
  'Tamamlandı': 'success',
  'İptal': 'error',
  
  // Priority
  'Yüksek': 'error',
  'Orta': 'warning',
  'Düşük': 'success',
  
  // Filter labels
  'Tümü': 'neutral',
  'Bugün': 'navy',
  'Yarın': 'warning',
  'Bu Hafta': 'neutral',
} as const;

export const statusStyles = statusColorMap;

/* ====================== YARDIMCI FONKSİYONLAR ====================== */
export function getStatusColor(status: string): ChipColor {
  return (statusColorMap as any)[status] || 'neutral';
}

export function getPriorityColor(priority: string): ChipColor {
  return (statusColorMap as any)[priority] || 'neutral';
}

export function getShade(color?: string): { DEFAULT: string; fg?: string; soft?: string; ring?: string } {
  const colorKey = color as keyof typeof BRAND_COLORS;
  if (colorKey && BRAND_COLORS[colorKey]) {
    const baseColor = BRAND_COLORS[colorKey];
    const tones = colorTones[colorKey];
    
    return {
      DEFAULT: baseColor,
      fg: colorKey === 'yellow' ? BRAND_COLORS.navy : '#ffffff',
      soft: tones ? tones[100] : '#F3F4F6',
      ring: tones ? tones[200] : '#E5E7EB',
    };
  }
  
  // Fallback to neutral
  return {
    DEFAULT: BRAND_COLORS.neutral,
    fg: '#ffffff',
    soft: '#F3F4F6',
    ring: '#E5E7EB',
  };
}

/* ====================== DARK MODE DESTEĞI ====================== */
export const darkModeClasses = {
  background: 'dark:bg-gray-900',
  surface: 'dark:bg-gray-800',
  border: 'dark:border-gray-700',
  text: {
    primary: 'dark:text-gray-100',
    secondary: 'dark:text-gray-300',
    muted: 'dark:text-gray-400',
  },
} as const;

/* ====================== KPI KART RENKLERI ====================== */
export const kpiCardColors = {
  target: { border: 'border-l-blue-500', icon: 'text-blue-500', bg: 'bg-blue-500' },
  completed: { border: 'border-l-emerald-500', icon: 'text-emerald-500', bg: 'bg-emerald-500' },
  pending: { border: 'border-l-amber-500', icon: 'text-amber-500', bg: 'bg-amber-500' },
  performance: { border: 'border-l-violet-500', icon: 'text-violet-500', bg: 'bg-violet-500' },
} as const;