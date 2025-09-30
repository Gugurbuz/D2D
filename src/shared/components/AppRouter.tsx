import React, { lazy } from 'react';
import { Screen, Role } from '../types';
import { Customer } from '../../features/customers/types';
import { AuthUser } from '../../features/auth/types';

// Lazy load screens for better performance
const DashboardScreen = lazy(() => import('../../screens/DashboardScreen'));
const RouteMapScreen = lazy(() => import('../../screens/RouteMapScreen'));
const VisitListScreen = lazy(() => import('../../screens/VisitListScreen'));
const VisitDetailScreen = lazy(() => import('../../screens/VisitDetailScreen'));
const VisitFlowScreen = lazy(() => import('../../screens/VisitFlowScreen'));
const ReportsScreen = lazy(() => import('../../screens/ReportsScreen'));
const AssignmentScreen = lazy(() => import('../../screens/AssignmentScreen'));
const AssignmentMapScreen = lazy(() => import('../../screens/AssignmentMapScreen'));
const TeamMapScreen = lazy(() => import('../../screens/TeamMapScreen'));
const MessagesScreen = lazy(() => import('../../screens/MessagesScreen'));
const ProfileScreens = lazy(() => import('../../screens/ProfileScreens'));
const InvoiceOcrPage = lazy(() => import('../../screens/InvoiceOcrPage'));
const UserManagementScreen = lazy(() => import('../../screens/UserManagementScreen'));
const SystemManagementScreen = lazy(() => import('../../screens/SystemManagementScreen'));
const TariffsScreen = lazy(() => import('../../screens/TariffsScreen'));
const FieldOpsMapScreen = lazy(() => import('../../screens/FieldOpsMapScreen'));
const SystemReportsScreen = lazy(() => import('../../screens/SystemReportsScreen'));
const OutOfRegionVisitWizard = lazy(() => import('../../screens/OutOfRegionVisitWizard'));

interface AppRouterProps {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  user: AuthUser;
  isDemoMode: boolean;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  assignments: Record<string, string | undefined>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  salesRepLocation: { lat: number; lng: number } | null;
  locationError: string | null;
}

const AppRouter: React.FC<AppRouterProps> = ({
  currentScreen,
  setCurrentScreen,
  user,
  isDemoMode,
  customers,
  selectedCustomer,
  onSelectCustomer,
  assignments,
  setAssignments,
  salesRepLocation,
  locationError,
}) => {
  // Mock data for now - in real app this would come from proper data hooks
  const allReps = []; // TODO: Use proper reps data
  const teamReps = []; // TODO: Use proper team data

  const renderLocationError = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
      <p className="mb-4">{locationError}</p>
      <p className="text-sm text-gray-500">
        Konum servisi olmadan rota haritası görüntülenemez.
      </p>
    </div>
  );

  const renderLocationLoading = () => (
    <div className="flex items-center justify-center h-full text-gray-500">
      Konum alınıyor...
    </div>
  );

  switch (currentScreen) {
    case 'dashboard':
      return (
        <DashboardScreen
          customers={customers}
          assignments={assignments}
          allReps={allReps}
          setCurrentScreen={setCurrentScreen}
          onSelectCustomer={onSelectCustomer}
        />
      );

    case 'route':
      if (!isDemoMode) {
        if (locationError) return renderLocationError();
        if (!salesRepLocation) return renderLocationLoading();
      }
      
      return (
        <RouteMapScreen
          customers={customers}
          salesRep={{ 
            name: user.name, 
            ...(salesRepLocation || { lat: 40.9923, lng: 29.0275 }) 
          }}
        />
      );

    case 'visits':
      return (
        <VisitListScreen
          customers={customers}
          assignments={assignments}
          allReps={allReps}
          setCurrentScreen={setCurrentScreen}
          onSelectCustomer={onSelectCustomer}
        />
      );

    case 'visitDetail':
      return selectedCustomer ? (
        <VisitDetailScreen
          customer={selectedCustomer}
          onBack={() => setCurrentScreen('visits')}
          onStartVisit={(c) => {
            onSelectCustomer(c);
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
      if (user.role === 'admin') {
        return <SystemReportsScreen />;
      }
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
      return <ProfileScreens role={user.role} />;

    case 'invoiceOcr':
      return (
        <InvoiceOcrPage
          onContinue={() => setCurrentScreen('outOfRegionWizard')}
        />
      );

    case 'outOfRegionWizard':
      return (
        <OutOfRegionVisitWizard
          onBack={() => setCurrentScreen('invoiceOcr')}
          onFinish={() => setCurrentScreen('visits')}
        />
      );

    case 'userManagement':
      return <UserManagementScreen />;

    case 'systemManagement':
      return <SystemManagementScreen />;

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
          onSelectCustomer={onSelectCustomer}
        />
      );
  }
};

export default AppRouter;