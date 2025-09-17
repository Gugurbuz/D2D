// src/styles/theme.ts
export const BRAND_NAVY = '#002D72';
export const BRAND_YELLOW = '#F9C800';

type Shade = {
  DEFAULT: string;
  fg?: string;     // metin rengi
  soft?: string;   // yumuşak arka plan (chip 'soft' varyantı için)
  ring?: string;   // border / ring rengi
};

type Palette = Record<string, Shade>;

export const palette: Palette = {
  navy:   { DEFAULT: BRAND_NAVY, fg: '#ffffff', soft: '#EBF2FF', ring: '#CBD5E1' },
  yellow: { DEFAULT: BRAND_YELLOW, fg: '#111827', soft: '#FFF7CC', ring: '#FDE68A' },
  green:  { DEFAULT: '#16A34A', fg: '#ffffff', soft: '#DCFCE7', ring: '#86EFAC' },
  amber:  { DEFAULT: '#D97706', fg: '#ffffff', soft: '#FEF3C7', ring: '#FCD34D' },
  purple: { DEFAULT: '#7C3AED', fg: '#ffffff', soft: '#F3E8FF', ring: '#D8B4FE' },
  gray:   { DEFAULT: '#6B7280', fg: '#ffffff', soft: '#F3F4F6', ring: '#E5E7EB' },

  // Durum kısayolları (VisitCard/Chip status → color)
  // İstersen doğrudan bu anahtarları Chip'e color olarak geçebilirsin.
  Planlandı:   { DEFAULT: '#D97706', fg: '#111827', soft: '#FEF3C7', ring: '#FCD34D' }, // amber
  Devam:       { DEFAULT: '#2563EB', fg: '#ffffff', soft: '#DBEAFE', ring: '#93C5FD' }, // blue
  Tamamlandı:  { DEFAULT: '#16A34A', fg: '#ffffff', soft: '#DCFCE7', ring: '#86EFAC' }, // green
  İptal:       { DEFAULT: '#DC2626', fg: '#ffffff', soft: '#FEE2E2', ring: '#FCA5A5' }, // red
};

// Güvenli okuma (renk yoksa 'gray' döner)
export function getShade(color?: string): Shade {
  if (!color) return palette.gray;
  return palette[color] || palette.gray;
}
