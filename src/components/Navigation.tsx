import React from 'react';
import { User, Home, Map, Route, List, BarChart3 } from 'lucide-react';
import { Screen } from '../types';

type Props = {
  agentName: string;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
};

const Navigation: React.FC<Props> = ({ agentName, currentScreen, setCurrentScreen }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#0099CB] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{agentName}</h2>
            <p className="text-sm text-gray-600">Saha Temsilcisi</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {[
            { key: 'dashboard', icon: <Home className="w-5 h-5" /> },
            { key: 'map', icon: <Map className="w-5 h-5" /> },
            { key: 'routeMap', icon: <Route className="w-5 h-5" /> },
            { key: 'visitList', icon: <List className="w-5 h-5" /> },
            { key: 'reports', icon: <BarChart3 className="w-5 h-5" /> },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setCurrentScreen(btn.key as Screen)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentScreen === btn.key ? 'bg-[#F9C800] text-gray-900' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
