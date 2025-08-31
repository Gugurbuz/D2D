import { Customer } from '../types';

export const mockCustomers: Customer[] = [
  { id: '1',  name: 'Mehmet Yılmaz', address: 'Kadıköy – Bahariye Cd.', district: 'Kadıköy', plannedTime: '09:00', priority: 'Yüksek', tariff: 'Mesken',   meterNumber: '100000001', consumption: '290 kWh/ay', offerHistory: ['Şubat 2025: %12 indirim', 'Ekim 2024: Sadakat teklifi'], status: 'Bekliyor', estimatedDuration: '30 dk', distance: '0.8 km',  lat: 40.9916, lng: 29.0250 },
  { id: '2',  name: 'Ayşe Demir',    address: 'Üsküdar – Çengelköy',    district: 'Üsküdar', plannedTime: '09:30', priority: 'Orta',   tariff: 'Mesken',   meterNumber: '100000002', consumption: '320 kWh/ay', offerHistory: ['Mart 2025: Yeni müşteri teklifi'], status: 'Bekliyor', estimatedDuration: '25 dk', distance: '1.3 km',  lat: 41.0255, lng: 29.0653 },
  { id: '3',  name: 'Ali Kaya',      address: 'Beşiktaş – Barbaros Blv.', district: 'Beşiktaş', plannedTime: '10:00', priority: 'Düşük', tariff: 'İş Yeri', meterNumber: '100000003', consumption: '880 kWh/ay', offerHistory: ['Ocak 2025: İş yeri sabit fiyat', 'Kasım 2024: %18 indirim'], status: 'Bekliyor', estimatedDuration: '40 dk', distance: '2.1 km',  lat: 41.0430, lng: 29.0070 },
  { id: '4',  name: 'Zeynep Koç',    address: 'Levent – Büyükdere Cd.', district: 'Beşiktaş', plannedTime: '10:30', priority: 'Yüksek', tariff: 'İş Yeri', meterNumber: '100000004', consumption: '1250 kWh/ay', offerHistory: ['Aralık 2024: Kurumsal tarife önerisi'], status: 'Bekliyor', estimatedDuration: '45 dk', distance: '3.0 km',  lat: 41.0800, lng: 29.0119 },
  // ... kalanları aynı şekilde ekleyebilirsin
];
