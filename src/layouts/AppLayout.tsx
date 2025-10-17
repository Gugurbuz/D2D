import React, { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  agentName: string;
  role: string;
  currentScreen: string;
  setCurrentScreen: (screen: any) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, agentName, role, currentScreen, setCurrentScreen }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">D2D Satış Uygulaması</h1>
          <div className="text-sm text-gray-600">
            {agentName} ({role})
          </div>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex gap-4 overflow-x-auto">
          {['dashboard', 'route', 'visits', 'assignments', 'reports', 'messages', 'profile'].map((screen) => (
            <button
              key={screen}
              onClick={() => setCurrentScreen(screen)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                currentScreen === screen
                  ? 'bg-[#0099CB] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {screen.charAt(0).toUpperCase() + screen.slice(1)}
            </button>
          ))}
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
};

export default AppLayout;
