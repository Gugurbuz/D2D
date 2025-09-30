import React from 'react';
import DashboardHeader from '../features/dashboard/components/DashboardHeader';
import { Target, CircleCheck as CheckCircle, Clock, TrendingUp, MapPin, Calendar, Megaphone, Sparkles, Award } from 'lucide-react';
import VisitProgram from '../features/dashboard/components/VisitProgram';
import KPISection from '../features/dashboard/components/KPISection';
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData';
import type { Customer } from '../features/customers/types';
import { useMemo } from 'react';

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: any[];
  setCurrentScreen: (screen: string) => void;
  onSelectCustomer: (customer: Customer) => void;
};

const DashboardScreen: React.FC<Props> = ({ customers, assignments, allReps, setCurrentScreen, onSelectCustomer }) => {
  const dashboardData = useDashboardData(customers);

  return (
    <div>
      <DashboardHeader
        agentName="Ahmet Yılmaz" // TODO: Get from user context
        headerMessage={dashboardData.headerMessage}
        currentTime={dashboardData.currentTime}
      />
      
      <KPISection
        completedVisits={dashboardData.completedVisits.length}
        pendingVisits={dashboardData.pendingVisits.length}
        dailyTarget={dashboardData.dailyTarget}
        weeklyStats={dashboardData.weeklyStats}
      />

      <VisitProgram
        title={dashboardData.programTitle}
        visits={dashboardData.visitsToShow}
        assignments={assignments}
        allReps={allReps}
        noVisitMessage={dashboardData.noVisitMessage}
        onSelectCustomer={onSelectCustomer}
        onStartVisit={(customer) => {
          onSelectCustomer(customer);
          setCurrentScreen('visitFlow');
        }}
        onViewAll={() => setCurrentScreen('visits')}
      />
    </div>
  );
};

export default DashboardScreen;

