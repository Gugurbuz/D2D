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

const AppLayout: React.FC<Props> = (p) => (
  <div className="min-h-screen bg-gray-50">
    <Navigation
      agentName={p.agentName}
      role={p.role}
      currentScreen={p.currentScreen}
      setCurrentScreen={p.setCurrentScreen}
    />
    <div className="p-6">{p.children}</div>
  </div>
);

export default AppLayout;
