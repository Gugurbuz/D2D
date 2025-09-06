// src/App.tsx (Tam ve Düzeltilmiş Versiyon)



import React, { useState, useEffect } from 'react';
import AppLayout from './layouts/AppLayout';
import MessagesScreen from './screens/MessagesScreen';
import { Screen, Customer } from './types';
import { AuthProvider, useAuthContext } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { customerService } from './services/customerService';
import { visitService } from './services/visitService';
import { assignmentService } from './services/assignmentService';
import { mockCustomers } from './data';

// Screens
import LoginScreen from './screens/LoginScreen';
import AssignmentScreen from './screens/AssignmentScreen';
import AssignmentMapScreen from './screens/AssignmentMapScreen';
import DashboardScreen from './screens/DashboardScreen';
import VisitListScreen from './screens/VisitListScreen';
import VisitDetailScreen from './screens/VisitDetailScreen';
import VisitFlowScreen from './screens/VisitFlowScreen';
import ReportsScreen from './screens/ReportsScreen';
import RouteMapScreen from './screens/RouteMapScreen';
import TeamMapScreen from './screens/TeamMapScreen';
import ProfileScreens from './screens/ProfileScreens';
import InvoiceOcrPage from './screens/InvoiceOcrPage';

function AppContent() {
  const { salesRep, isManager } = useAuthContext();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filter, setFilter] = useState('Bugün');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [assignments, setAssignments] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    if (salesRep) {
      // loadData(); // Temporarily disabled for demo
      setCurrentScreen('dashboard');
      setLoading(false);
    }
  }, [salesRep]);

  // const loadData = async () => {
  //   setLoading(true);
  //   try {
  //     // Load customers
  //     const { data: customersData } = await customerService.getCustomers();
  //     if (customersData) {
  //       setCustomers(customersData);
  //     }

  //     // Load assignments
  //     const { data: assignmentsData } = await assignmentService.getAssignments();
  //     if (assignmentsData) {
  //       const assignmentMap: Record<string, string> = {};
  //       assignmentsData.forEach(assignment => {
  //         assignmentMap[assignment.customer_id] = assignment.sales_rep_id;
  //       });
  //       setAssignments(assignmentMap);
  //     }
  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleStartVisit = async (customer: any) => {
    // Create a new visit record
    const { data: visit } = await visitService.createVisit({
      customer_id: customer.id,
      sales_rep_id: salesRep!.id,
      visit_date: new Date().toISOString().split('T')[0],
      status: 'in_progress'
    });

    if (visit) {
      setSelectedCustomer({ ...customer, currentVisit: visit });
    }
    setCurrentScreen('visitFlow');
  };

  const handleCompleteVisit = async (customer: any, status: string, notes: string) => {
    if (customer.currentVisit) {
      await visitService.completeVisit(
        customer.currentVisit.id,
        status,
        notes,
        status === 'completed'
      );
    }
    
    // Refresh data
    // loadData(); // Temporarily disabled
  };

  const handleSpeechToText = () => { /* Implement speech to text */ };

  // Show login screen if no sales rep
  if (!salesRep) {
    return <LoginScreen onLogin={() => {}} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0099CB]"></div>
      </div>
    );
  }

  return (
    <AppLayout
      agentName={salesRep?.name || 'User'}
      role={isManager ? 'manager' : 'sales'}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
    >
      {currentScreen === 'profile' && (
        <ProfileScreens role={isManager ? 'manager' : 'sales'} />
      )}

      {currentScreen === 'assignmentMap' && isManager && (
        <ProtectedRoute requireManager>
          <AssignmentMapScreen
            customers={customers}
            assignments={assignments}
            setAssignments={setAssignments}
            allReps={[
              { id: 'rep1', name: 'Serkan Özkan', lat: 40.9360, lng: 29.1500, phone: '0555 111 22 01' },
              { id: 'rep2', name: 'Ayşe Yılmaz', lat: 41.0165, lng: 29.1248, phone: '0555 111 22 02' },
              { id: 'rep3', name: 'Mehmet Ali Vural', lat: 40.9923, lng: 29.1274, phone: '0555 111 22 03' }
            ]}
            onBack={() => setCurrentScreen('assignment')}
          />
        </ProtectedRoute>
      )}

      {currentScreen === 'assignment' && isManager && (
        <ProtectedRoute requireManager>
          <AssignmentScreen
            customers={customers}
            assignments={assignments}
            setAssignments={setAssignments}
            allReps={[
              { id: 'rep1', name: 'Serkan Özkan', lat: 40.9360, lng: 29.1500, phone: '0555 111 22 01' },
              { id: 'rep2', name: 'Ayşe Yılmaz', lat: 41.0165, lng: 29.1248, phone: '0555 111 22 02' },
              { id: 'rep3', name: 'Mehmet Ali Vural', lat: 40.9923, lng: 29.1274, phone: '0555 111 22 03' }
            ]}
            setCurrentScreen={setCurrentScreen}
          />
        </ProtectedRoute>
      )}

      {currentScreen === 'teamMap' && isManager && (
        <ProtectedRoute requireManager>
          <TeamMapScreen />
        </ProtectedRoute>
      )}
      
      {currentScreen === 'messages' && <MessagesScreen />}

      {currentScreen === 'dashboard' && (
        <DashboardScreen
          customers={customers}
          assignments={assignments}
          allReps={[
            { id: 'rep1', name: 'Serkan Özkan', lat: 40.9360, lng: 29.1500, phone: '0555 111 22 01' },
            { id: 'rep2', name: 'Ayşe Yılmaz', lat: 41.0165, lng: 29.1248, phone: '0555 111 22 02' },
            { id: 'rep3', name: 'Mehmet Ali Vural', lat: 40.9923, lng: 29.1274, phone: '0555 111 22 03' }
          ]}
          setCurrentScreen={setCurrentScreen}
          setSelectedCustomer={setSelectedCustomer}
        />
      )}

      {currentScreen === 'visitList' && (
        <VisitListScreen
          customers={customers}
          assignments={assignments}
          allReps={[
            { id: 'rep1', name: 'Serkan Özkan', lat: 40.9360, lng: 29.1500, phone: '0555 111 22 01' },
            { id: 'rep2', name: 'Ayşe Yılmaz', lat: 41.0165, lng: 29.1248, phone: '0555 111 22 02' },
            { id: 'rep3', name: 'Mehmet Ali Vural', lat: 40.9923, lng: 29.1274, phone: '0555 111 22 03' }
          ]}
          setCurrentScreen={setCurrentScreen} 
          onSelectCustomer={handleSelectCustomer}
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isListening={isListening}
          onMicClick={handleSpeechToText}
        />
      )}

      {currentScreen === 'visitDetail' && selectedCustomer && (
        <VisitDetailScreen
          customer={selectedCustomer}
          onBack={() => setCurrentScreen('visitList')}
          onStartVisit={handleStartVisit}
        />
      )}

      {currentScreen === 'visitFlow' && selectedCustomer && (
        <VisitFlowScreen
          customer={selectedCustomer}
          onCloseToList={() => setCurrentScreen('visitList')}
          onCompleteVisit={handleCompleteVisit}
        />
      )}

      {currentScreen === 'reports' && <ReportsScreen customers={customers} />}

      {currentScreen === 'routeMap' && (
        <RouteMapScreen customers={customers} salesRep={{ name: salesRep.name, lat: 40.9360, lng: 29.1500 }} />
      )}

      {currentScreen === 'invoiceOcr' && <InvoiceOcrPage />}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;