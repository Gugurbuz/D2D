export interface Customer {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  email?: string;
  customerNumber?: string;
  installationNumber?: string;
  meterNumber?: string;
  lat: number;
  lng: number;
  customerType: 'Mesken' | 'Ticarethane' | 'Sanayi';
  tariff: string;
  consumption: string;
  offerHistory: string[];
  status: 'Planlandı' | 'Bekliyor' | 'Yolda' | 'Tamamlandı' | 'İptal';
  priority: 'Yüksek' | 'Orta' | 'Düşük';
  plannedTime: string;
  estimatedDuration: string;
  distance: string;
  visitDate: string;
  isFreeConsumer: boolean;
}