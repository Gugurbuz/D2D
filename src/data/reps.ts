import { SalesRep } from '../types';

export const mockReps: SalesRep[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@enerjisa.com',
    phone: '0532 123 45 67',
    role: 'sales_rep',
    district: 'Kadıköy',
    region: 'Anadolu',
    isActive: true,
    dailyTarget: 20
  },
  {
    id: '2',
    name: 'Fatma Demir',
    email: 'fatma@enerjisa.com',
    phone: '0533 234 56 78',
    role: 'sales_rep',
    district: 'Beşiktaş',
    region: 'Avrupa',
    isActive: true,
    dailyTarget: 18
  },
  {
    id: '3',
    name: 'Mehmet Kaya',
    email: 'mehmet@enerjisa.com',
    phone: '0534 345 67 89',
    role: 'manager',
    district: 'Şişli',
    region: 'Avrupa',
    isActive: true,
    dailyTarget: 25
  }
];