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
    lat: 40.9368, 
    lng: 29.1553, 
    phone: '0555 000 00 01',
    color: '#0ea5e9',                  // Mavi
    fillColor: 'rgba(14,165,233,.18)'
  },
  { 
    id: 'rep-2', 
    name: 'Zelal Kaya',    
    lat: 41.0086, 
    lng: 29.0736, 
    phone: '0555 000 00 02',
    color: '#22c55e',                  // Yeşil
    fillColor: 'rgba(34,197,94,.18)'
  },
  { 
    id: 'rep-3', 
    name: 'Şöhret Demir',  
    lat: 40.9913, 
    lng: 29.0271, 
    phone: '0555 000 00 03',
    color: '#f97316',                  // Turuncu
    fillColor: 'rgba(249,115,22,.18)'
  },
   { 
    id: 'rep-4', 
    name: 'Mert Yıldırım', 
    phone: '0555 000 00 04', 
    lat: 40.9497, 
    lng: 29.1228, 
    completedToday: 1, 
    totalToday: 4,
    color: '#8b5cf6',                  // Mor (yeni eklendi)
    fillColor: 'rgba(139,92,246,.18)'
  },
];