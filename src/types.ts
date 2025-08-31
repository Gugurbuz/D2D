export interface Customer {
  id: string;
  name: string;
  address: string;
  district: string;
  plannedTime: string;
  priority: 'Yüksek' | 'Orta' | 'Düşük';
  tariff: string;
  meterNumber: string;
  consumption: string;
  offerHistory: string[];
  status: 'Bekliyor' | 'Yolda' | 'Tamamlandı';
  estimatedDuration: string;
  distance: string;
  lat: number;
  lng: number;
}

export type VisitResult = 'Satış Yapıldı' | 'Teklif Verildi' | 'Reddedildi' | 'Evde Yok' | null;

export type Screen =
  | 'login'
  | 'dashboard'
  | 'map'
  | 'visitList'
  | 'visitDetail'
  | 'visitResult'
  | 'reports'
  | 'routeMap';
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
  assignedRepId: string | null; // <-- YENİ EKLENEN ALAN (null = atanmamış)
}