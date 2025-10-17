import React from 'react';

interface DashboardScreenProps {
  customers: any[];
  assignments: any;
  allReps: any[];
  setCurrentScreen: (screen: any) => void;
  onSelectCustomer: (customer: any) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">Dashboard içeriği yükleniyor...</p>
    </div>
  );
};

export default DashboardScreen;
