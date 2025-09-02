// src/data/reps.ts
import { SalesRep as MapSalesRep } from '../RouteMap';
import { Rep } from '../types';

export const salesRepForMap: MapSalesRep = {
  name: 'Satış Uzmanı',
  lat: 40.9368,
  lng: 29.1553,
};

export const allReps: Rep[] = [
  { 
    id: 'rep-1', 
    name: 'Serkan Özkan',  
    lat: 40.9368, // Maltepe civarı
    lng: 29.1553, 
    phone: '05079681648',
    color: '#0ea5e9',                  // Mavi
    fillColor: 'rgba(14,165,233,.18)'
  },
  { 
    id: 'rep-2', 
    name: 'Zelal Kaya',    
    lat: 41.0086, // Ataşehir civarı
    lng: 29.0736, 
    phone: '0555 000 00 02',
    color: '#22c55e',                  // Yeşil
    fillColor: 'rgba(34,197,94,.18)'
  },
  { 
    id: 'rep-3', 
    name: 'Şöhret Demir',  
    lat: 40.9913, // Kadıköy civarı
    lng: 29.0271, 
    phone: '0555 000 00 03',
    color: '#f97316',                  // Turuncu
    fillColor: 'rgba(249,115,22,.18)'
  },
  { 
    id: 'rep-4', 
    name: 'Mert Yıldırım', 
    phone: '0555 000 00 04', 
    lat: 40.9497, // Maltepe civarı
    lng: 29.1228, 
    completedToday: 1, 
    totalToday: 4,
    color: '#8b5cf6',                  // Mor
    fillColor: 'rgba(139,92,246,.18)'
  },
  // ------ GÜNCELLENMİŞ LOKASYONLAR ------
  { 
    id: 'rep-5', 
    name: 'Ayşe Güneş', 
    phone: '0555 000 00 05', 
    lat: 41.0261, // Ümraniye civarı (Güncellendi)
    lng: 29.1184, // (Güncellendi)
    color: '#ef4444',                  // Kırmızı
    fillColor: 'rgba(239,68,68,.18)'
  },
  { 
    id: 'rep-6', 
    name: 'Emre Aksoy', 
    phone: '0555 000 00 06', 
    lat: 41.0854, // Beykoz civarı (Güncellendi)
    lng: 29.0953, // (Güncellendi)
    color: '#eab308',                  // Sarı
    fillColor: 'rgba(234,179,8,.18)'
  },
  { 
    id: 'rep-7', 
    name: 'Elif Aydın', 
    phone: '0555 000 00 07', 
    lat: 40.8875, // Pendik civarı (Güncellendi)
    lng: 29.2541, // (Güncellendi)
    color: '#ec4899',                  // Pembe
    fillColor: 'rgba(236,72,153,.18)'
  },
  { 
    id: 'rep-8', 
    name: 'Burak Çelik', 
    phone: '0555 000 00 08', 
    lat: 40.9182, // Kartal civarı (Güncellendi)
    lng: 29.1924, // (Güncellendi)
    color: '#14b8a6',                  // Turkuaz
    fillColor: 'rgba(20,184,166,.18)'
  },
  { 
    id: 'rep-9', 
    name: 'Fatma Şahin', 
    phone: '0555 000 00 09', 
    lat: 41.0123, // Ataşehir civarı
    lng: 29.1234, 
    color: '#6366f1',                  // İndigo
    fillColor: 'rgba(99,102,241,.18)'
  },
  { 
    id: 'rep-10', 
    name: 'Mustafa Koç', 
    phone: '0555 000 00 10', 
    lat: 40.9750, // Kadıköy civarı
    lng: 29.0500, 
    color: '#6b7280',                  // Gri
    fillColor: 'rgba(107,114,128,.18)'
  },
  { 
    id: 'rep-11', 
    name: 'Zeynep Arslan', 
    phone: '0555 000 00 11', 
    lat: 41.0385, // Çekmeköy civarı (Güncellendi)
    lng: 29.1732, // (Güncellendi)
    color: '#06b6d4',                  // Camgöbeği
    fillColor: 'rgba(6,182,212,.18)'
  },
  { 
    id: 'rep-12', 
    name: 'Ali Vural', 
    phone: '0555 000 00 12', 
    lat: 41.0145, // Sancaktepe civarı (Güncellendi)
    lng: 29.2281, // (Güncellendi)
    color: '#84cc16',                  // Limon Yeşili
    fillColor: 'rgba(132,204,22,.18)'
  },
];