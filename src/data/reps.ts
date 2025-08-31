// src/data/reps.ts
import { SalesRep as MapSalesRep } from '../RouteMap';
import { Rep } from '../types';

export const salesRepForMap: MapSalesRep = {
  name: 'Satış Uzmanı',
  lat: 40.9368,
  lng: 29.1553,
};

export const allReps: Rep[] = [
  { id: 'rep-1', name: 'Serkan Özkan',  lat: 40.9368, lng: 29.1553, phone: '0555 000 00 01' }, // Maltepe
  { id: 'rep-2', name: 'Zelal Kaya',    lat: 41.0086, lng: 29.0736, phone: '0555 000 00 02' }, // Üsküdar
  { id: 'rep-3', name: 'Şöhret Demir',  lat: 40.9913, lng: 29.0271, phone: '0555 000 00 03' }, // Kadıköy
];
