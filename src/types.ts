import type { Database } from './lib/database.types';

export type VisitStatus = Database['public']['Enums']['visit_status'];

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
  | 'taskFlowTest'

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
  status: 'Planlandı' | 'Yolda' | 'Tamamlandı' | 'İptal';
  priority: 'Yüksek' | 'Orta' | 'Düşük';
  plannedTime: string;
  estimatedDuration: string;
  distance: string;
  visitDate: string;
  isFreeConsumer: boolean;
}

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  district?: string;
  region?: string;
  location?: {
    lat: number;
    lng: number;
  };
  dailyTarget: number;
  isActive: boolean;
}

export interface Visit {
  id: string;
  customer_id: string;
  sales_rep_id: string;
  visit_date: string;
  planned_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: VisitStatus;
  priority: 'low' | 'medium' | 'high';
  result?: string;
  notes?: string;
  distance_km?: number;
  estimated_duration?: string;
  contract_signed: boolean;
  revenue_amount: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Assignment {
  id: string;
  customer_id: string;
  sales_rep_id: string;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
  customer?: Customer;
  sales_rep?: SalesRep;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  content: string;
  message_type: 'direct' | 'broadcast' | 'system';
  is_read: boolean;
  created_at: string;
  sender?: SalesRep;
  recipient?: SalesRep;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: 'visit' | 'message' | 'assignment' | 'system';
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface Tariff {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
  customer_types: ('residential' | 'commercial' | 'industrial')[];
  is_active: boolean;
  created_at: string;
}

export interface VisitNote {
  id: string;
  visit_id: string;
  sales_rep_id: string;
  note: string;
  is_private: boolean;
  created_at: string;
}

export interface SolarLead {
  id: string;
  customer_id: string;
  sales_rep_id: string;
  solutions: string[];
  estimated_capacity?: number;
  estimated_cost?: number;
  status: string;
  notes?: string;
  kvkk_consent: boolean;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface FromStep1Payload {
  customerName?: string;
  address?: string;
  tariff?: string;
  annual?: string;
}

export interface VisitResult {
  result: 'contract_signed' | 'follow_up' | 'not_interested' | 'no_answer';
  notes: string;
  contract_amount?: number;
  follow_up_date?: string;
}

export interface Rep {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  district?: string;
  region?: string;
  location?: {
    lat: number;
    lng: number;
  };
  daily_target: number;
  is_active: boolean;
}