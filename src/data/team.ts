// src/data/team.ts
export type TeamRep = {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  completedToday: number;
  totalToday: number;
  color: string;
  fillColor: string;
};

// YENİ: Yönetici bilgisi eklendi ve export edildi
export const managerUser = {
  id: 'manager-1',
  name: 'Ayşe Demir',
};

export const teamReps: TeamRep[] = [
  { 
    id: 'rep-1', 
    name: 'Serkan Özkan',
    phone: '05079681648', 
    lat: 40.9368, 
    lng: 29.1553, 
    completedToday: 7, 
    totalToday: 6,
    color: '#0ea5e9',
    fillColor: 'rgba(14,165,233,.18)'
  },
  { 
    id: 'rep-2', 
    name: 'Zelal Kaya',
    phone: '0555 000 00 02', 
    lat: 41.0004, 
    lng: 29.0498, 
    completedToday: 5, 
    totalToday: 7,
    color: '#22c55e',
    fillColor: 'rgba(34,197,94,.18)'
  },
  // ... diğer temsilciler
];