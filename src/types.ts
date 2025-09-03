
// Satış Uzmanı arayüzü (artık bir ID'si var)
export interface SalesRep {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// Müşteri arayüzü (kime atandığını tutan yeni bir alan eklendi)
export interface Customer {
  id: string;
  name: string;
  address: string;
  district: string;
  plannedTime: string;
  priority: 'Yüksek' | 'Orta' | 'Düşük';
  tariff: 'Mesken' | 'İş Yeri';
  meterNumber: string;
  consumption: string;
  offerHistory: string[];
  status: 'Bekiyor' | 'Yolda' | 'Tamamlandı';
  estimatedDuration: string;
  distance: string;
  lat: number;
  lng: number;
  phone: string;
  assignedRepId: string | null; // (null = atanmamış)
}
export type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;
export type Role = 'rep' | 'manager';
export type Screen =
  | 'login'
  | 'roleSelect'
  | 'dashboard'
  | 'visitList'
  | 'visitDetail'
  | 'visitFlow'
  | 'visitResult'
  | 'reports'
  | 'routeMap'
  | 'assignment'
  | 'profile'
  | 'assignmentMap'; 

// src/types.ts
export type Rep = {
  id: string;
  name: string;
  lat: number;   // eklendi
  lng: number;   // eklendi
  phone?: string;
};

export type ExtractField<T = string | number | null> = {
  value?: T | null;
  confidence?: number;
};
export type ExtractResponseData = {
  provider?: { name?: string | null; confidence?: number };
  period?: { from?: string | null; to?: string | null; confidence?: number };
  customer?: { name?: string | null; address?: string | null };
  installation_no?: ExtractField<string>;
  meter_no?: ExtractField<string>;
  consumption_kwh?: ExtractField<number>;
  unit_price_tl_per_kwh?: ExtractField<number>;
  total_amount_tl?: ExtractField<number>;
};
export type ExtractAPIResponse = { ok: boolean; data: ExtractResponseData };
