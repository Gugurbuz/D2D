// src/layouts/AppLayout.tsx
import React from 'react';
import Navigation from '../components/Navigation';
import { Role, Screen } from '../types';

type Props = {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
  children: React.ReactNode;
};

const AppLayout: React.FC<Props> = ({
  agentName,
  role,
  currentScreen,
  setCurrentScreen,
  children,
}) => (
  <div className="min-h-screen bg-gray-50">
    <Navigation
      agentName={agentName}
      role={role}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
    />
    <div className="p-6">{children}</div>
  </div>
);

export default AppLayout;
