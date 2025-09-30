import React, { useState } from 'react';
import { QueryProvider } from './shared/providers/QueryProvider';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { Suspense } from 'react';
import AppRouter from './shared/components/AppRouter';
import LoadingSpinner from './shared/components/LoadingSpinner';
import { useAuth } from './features/auth/hooks/useAuth';
import { useCustomers } from './features/customers/hooks/useCustomers';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import LoginScreen from './screens/LoginScreen';
import RoleSelectScreen from './screens/RoleSelectScreen';
import AppLayout from './layouts/AppLayout';
import type { Customer, Screen } from './shared/types';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';

function App() {
  const { user, isLoading: authLoading, isDemoMode, login, loginDemo, logout } = useAuth();
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string | undefined>>({});

  // Custom hooks for data management
  const { customers } = useCustomers(isDemoMode);
  const { location: salesRepLocation, error: locationError } = useCurrentLocation(
    isDemoMode,
    { lat: 40.9923, lng: 29.0275 }
  );

  const handleLogin = async (email?: string, password?: string, isDemo = false) => {
    if (isDemo) {
      setShowRoleSelect(true);
      return;
    }
    
    if (email && password) {
      try {
        await login({ email, password });
      } catch (error) {
        console.error('Login failed:', error);
      }
    } else {
      // Quick test login
      try {
        await login({ email: 'test@enerjisa.com', password: 'test123' });
      } catch (error) {
        console.error('Quick login failed:', error);
      }
    }
  };

  const handleRoleSelect = (selectedRole: string) => {
    loginDemo(selectedRole);
    setShowRoleSelect(false);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  // Loading state
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Authentication flow
  if (!user) {
    if (showRoleSelect) {
      return <RoleSelectScreen onSelect={handleRoleSelect} />;
    }
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <AppLayout
          agentName={user.name}
          role={user.role}
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
        >
          <AppRouter
            currentScreen={currentScreen}
            setCurrentScreen={setCurrentScreen}
            user={user}
            isDemoMode={isDemoMode}
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
            assignments={assignments}
            setAssignments={setAssignments}
            salesRepLocation={salesRepLocation}
            locationError={locationError}
          />
        </AppLayout>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
