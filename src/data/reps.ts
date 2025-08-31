// src/data/reps.ts
import type { SalesRep as MapSalesRep } from '../RouteMap';

export type Rep = { id: string; name: string };

export const allReps: Rep[] = [
  { id: 'rep-1', name: 'Serkan Özkan' },
  { id: 'rep-2', name: 'Zelal Kaya' },
  { id: 'rep-3', name: 'Şöhret Demir' },
];

// Harita için reps (RouteMap bileşeniyle aynı tip)
export const salesRepForMap: MapSalesRep = {
  name: 'Satış Uzmanı',
  lat: 40.9360,  // Maltepe civarı
  lng: 29.1500,
};
