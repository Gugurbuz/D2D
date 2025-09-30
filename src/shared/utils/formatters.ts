export const formatters = {
  date: (dateStr?: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },

  time: (timeStr?: string): string => {
    if (!timeStr) return '-';
    return timeStr;
  },

  phone: (phone: string): string => {
    if (!phone) return '-';
    // Format: +90 532 123 45 67
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('90')) {
      return `+90 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
    }
    if (cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
    }
    return phone;
  },

  distance: (km: number | string | null): string => {
    if (km == null) return '—';
    const numKm = typeof km === 'string' ? parseFloat(km) : km;
    if (isNaN(numKm)) return '—';
    
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(numKm) + ' km';
  },

  currency: (amount: number | string | null, currency = 'TL'): string => {
    if (amount == null) return '—';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '—';
    
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(numAmount).replace('TRY', currency);
  },

  consumption: (consumption: string): string => {
    if (!consumption) return '—';
    return consumption.includes('kWh') ? consumption : `${consumption} kWh`;
  },

  percentage: (value: number): string => {
    return `%${Math.round(value)}`;
  },

  compact: (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  },
};