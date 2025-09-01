
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

// src/types.ts

export type Role = 'admin' | 'agent';

// YENİLİK: 'messages' ekranı eklendi
export type Screen = 'routeMap' | 'teamMap' | 'assignmentMap' | 'messages' | 'settings';

export type Rep = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  phone: string;
  color: string;
  fillColor: string;
};