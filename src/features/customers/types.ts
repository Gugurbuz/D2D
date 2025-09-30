import { BaseEntity, Location, Priority, VisitStatus, CustomerType } from '../../shared/types';

export interface Customer extends BaseEntity {
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
  customerType: CustomerType;
  tariff: string;
  consumption: string;
  offerHistory: string[];
  status: VisitStatus;
  priority: Priority;
  plannedTime: string;
  estimatedDuration: string;
  distance: string;
  visitDate: string;
  isFreeConsumer: boolean;
}

export interface CustomerFilters {
  search: string;
  status: VisitStatus | 'Tümü';
  priority: Priority | 'Tümü';
  district: string | 'Tümü';
  dateRange: 'Bugün' | 'Yarın' | 'Bu Hafta' | 'Tümü';
}

export interface CustomerSort {
  field: keyof Customer;
  direction: 'asc' | 'desc';
}