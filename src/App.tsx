import React, { useState, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import AppLayout from './layouts/AppLayout';
import DashboardScreen from './screens/DashboardScreen';
import RouteMapScreen from './screens/RouteMapScreen';
import VisitListScreen from './screens/VisitListScreen';
import VisitDetailScreen from './screens/VisitDetailScreen';
import VisitFlowScreen from './screens/VisitFlowScreen';
import ReportsScreen from './screens/ReportsScreen';
import AssignmentScreen from './screens/AssignmentScreen';
import AssignmentMapScreen from './screens/AssignmentMapScreen';
import TeamMapScreen from './screens/TeamMapScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreens from './screens/ProfileScreens';
import InvoiceOcrPage from './screens/InvoiceOcrPage';
import RoleSelectScreen from './screens/RoleSelectScreen';

import UserManagementScreen from './screens/UserManagementScreen';
import SystemManagementScreen from './screens/SystemManagementScreen';
import TariffsScreen from './screens/TariffsScreen';
import FieldOpsMapScreen from './screens/FieldOpsMapScreen';
import SystemReportsScreen from './screens/SystemReportsScreen';

import { mockCustomers } from './data/mockCustomers';
import { mockReps } from './data/reps';
import { teamReps } from './data/team';
import type { Customer, SalesRep, Screen, Role } from './types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [agentName, setAgentName] = useState('Ahmet Yılmaz');
  const [role, setRole] = useState<Role>('sales_rep');

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string | undefined>>({});
  const [allReps, setAllReps] = useState<SalesRep[]>([]);

  // Konum state
  const [salesRepLocation, setSalesRepLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleLogin = (isDemo = false) => {
    if (isDemo) {
      setIsDemoMode(true);
      setShowRoleSelect(true);
    } else {
      setIsDemoMode(false);
      setIsLoggedIn(true);
    }
  };

  const handleRoleSelect = (selectedRole: string) => {
    const roleMap: Record<string, Role> = {
      'rep-1': 'sales_rep',
      'manager-1': 'manager',
      'admin-1': 'admin',
      'operations-1': 'operations_manager',
    };
    setRole(roleMap[selectedRole] || 'sales_rep');
    setShowRoleSelect(false);
    setIsLoggedIn(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  // Demo / gerçek veri yükleme
  useEffect(() => {
    if (!isLoggedIn) return;

    if (isDemoMode) {
      setCustomers(mockCustomers);
      setAllReps(mockReps);
    } else {
      setCustomers([]);
      setAllReps([]);
      // TODO: Supabase'den gerçek veriler çekilecek
    }
  }, [isLoggedIn, isDemoMode]);

  // Konum alma
  useEffect(() => {
    if (!isLoggedIn) return;

    if (isDemoMode) {
      // ✅ Demo modunda mock koordinat
      setSalesRepLocation({ lat: 40.9923, lng: 29.0275 }); // Kadıköy örnek
      setLocationError(null);
      return;
    }

    // ✅ Gerçek login modunda cihaz konumu
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSalesRepLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLocationError(null);
        },
        (err) => {
          console.error('Konum alınamadı:', err);
          setLocationError('Konum izni gerekli. Lütfen cihaz ayarlarından açın.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError('Tarayıcınız konum servisini desteklemiyor.');
    }
  }, [isLoggedIn, isDemoMode]);

  if (!isLoggedIn) {
    if (showRoleSelect) {
      return <RoleSelectScreen onSelect={handleRoleSelect} />;
    }
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            customers={customers}
            assignments={assignments}
            allReps={allReps}
            setCurrentScreen={setCurrentScreen}
            onSelectCustomer={handleSelectCustomer}
          />
        );
      case 'route':
        if (!isDemoMode) {
          // Sadece gerçek login için hata ve loading kontrolleri
          if (locationError) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                <p className="mb-4">{locationError}</p>
                <p className="text-sm text-gray-500">
                  Konum servisi olmadan rota haritası görüntülenemez.
                </p>
              </div>
            );
          }

          if (!salesRepLocation) {
            return (
              <div className="flex items-center justify-center h-full text-gray-500">
                Konum alınıyor...
              </div>
            );
          }
        }

        return (
          <RouteMapScreen
            customers={customers}
            salesRep={{ name: agentName, ...(salesRepLocation || { lat: 40.9923, lng: 29.0275 }) }}
          />
        );
      case 'visits':
        return (
          <VisitListScreen
            customers={customers}
            assignments={assignments}
            allReps={allReps}
            setCurrentScreen={setCurrentScreen}
            onSelectCustomer={handleSelectCustomer}
          />
        );
      case 'visitDetail':
        return selectedCustomer ? (
          <VisitDetailScreen
            customer={selectedCustomer}
            onBack={() => setCurrentScreen('visits')}
            onStartVisit={(c) => {
              setSelectedCustomer(c);
              setCurrentScreen('visitFlow');
            }}
          />
        ) : null;
      case 'visitFlow':
        return selectedCustomer ? (
          <VisitFlowScreen
            customer={selectedCustomer}
            onCloseToList={() => setCurrentScreen('visits')}
            onCompleteVisit={() => setCurrentScreen('visits')}
          />
        ) : null;
      case 'reports':
        return <ReportsScreen customers={customers} />;
      case 'systemReports':
        return <SystemReportsScreen />;
      case 'assignments':
        return (
          <AssignmentScreen
            customers={customers}
            assignments={assignments}
            setAssignments={setAssignments}
            allReps={allReps}
            setCurrentScreen={setCurrentScreen}
          />
        );
      case 'assignmentMap':
        return (
          <AssignmentMapScreen
            customers={customers}
            assignments={assignments}
            setAssignments={setAssignments}
            allReps={teamReps}
            onBack={() => setCurrentScreen('assignments')}
          />
        );
      case 'team':
        return <TeamMapScreen reps={teamReps} />;
      case 'messages':
        return <MessagesScreen />;
      case 'profile':
        return <ProfileScreens role={role} />;
      case 'invoiceOcr':
        return <InvoiceOcrPage />;
      case 'userManagement':
        return <UserManagementScreen />;
      case 'export type Role = 'sales_rep' | 'manager' | 'admin' | 'operations_manager';


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
  | 'systemReports';

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
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'no_answer' | 'rejected';
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
}':
        return <SystemManagementScreen  />;
      case 'tariffs':
        return <TariffsScreen />;
      case 'fieldOpsMap':
        return <FieldOpsMapScreen />;
      default:
        return (
          <DashboardScreen
            customers={customers}
            assignments={assignments}
            allReps={allReps}
            setCurrentScreen={setCurrentScreen}
            onSelectCustomer={handleSelectCustomer}
          />
        );
    }
  };

  return (
    <AppLayout
      agentName={agentName}
      role={role}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
    >
      {renderScreen()}
    </AppLayout>
  );
}

export default App;
