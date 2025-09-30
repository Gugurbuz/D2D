import React from 'react';
import DashboardHeader from '../features/dashboard/components/DashboardHeader';
import KPISection from '../features/dashboard/components/KPISection';
import VisitProgram from '../features/dashboard/components/VisitProgram';
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
  const today = new Date().toISOString().split('T')[0];
  const time = new Date();

  // --- Zaman ve Tarih Mantığı ---
  const hour = time.getHours();
  const day = time.getDay(); // 0: Pazar, 6: Cumartesi
  const isWeekend = day === 0 || day === 6;
  const isWorkingHours = hour >= 9 && hour < 18;

  const todaysVisits = useMemo(() => customers.filter(c => c.visitDate === today), [customers, today]);
  
  const dashboardData = useDashboardData();

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

