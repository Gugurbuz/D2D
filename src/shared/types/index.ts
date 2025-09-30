export type Role = 'sales_rep' | 'manager' | 'admin' | 'operations_manager';

export type Screen = 
  | 'dashboard' 
  | 'route'
  | 'visits' 
  | 'visitDetail'
  | 'visitFlow'
  | 'customers' 
  | 'messages' 
  | 'profile' 
  | 'reports'
  | 'team'
  | 'assignments'
  | 'assignmentMap'
  | 'invoiceOcr'
  | 'systemManagement'
  | 'systemReports'
  | 'outOfRegionWizard'
  | 'userManagement'
  | 'tariffs'
  | 'fieldOpsMap';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export type Priority = 'Yüksek' | 'Orta' | 'Düşük';
export type VisitStatus = 'Planlandı' | 'Yolda' | 'Tamamlandı' | 'İptal';
export type CustomerType = 'Mesken' | 'Ticarethane' | 'Sanayi';