// src/data/team.ts
export type TeamRep = {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  completedToday: number;
  totalToday: number;
};

export const teamReps: TeamRep[] = [
  { id: 'rep-1', name: 'Serkan Özkan',  phone: '0555 000 00 01', lat: 40.9368, lng: 29.1553, completedToday: 3, totalToday: 6 },
  { id: 'rep-2', name: 'Zelal Kaya',    phone: '0555 000 00 02', lat: 41.0004, lng: 29.0498, completedToday: 5, totalToday: 7 },
  { id: 'rep-3', name: 'Şöhret Demir',  phone: '0555 000 00 03', lat: 41.0255, lng: 29.0653, completedToday: 2, totalToday: 5 },
  { id: 'rep-4', name: 'Mert Yıldırım', phone: '0555 000 00 04', lat: 40.9497, lng: 29.1228, completedToday: 1, totalToday: 4 },
];
