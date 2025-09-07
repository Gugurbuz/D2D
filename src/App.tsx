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
      case 'userManagement':
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
