import React from 'react';
import { User, Home, Route, List, BarChart3, UserCheck, Users } from 'lucide-react'; // Users eklendi
import { Role, Screen } from '../types';

type Props = {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
};

const Navigation: React.FC<Props> = ({ agentName, role, currentScreen, setCurrentScreen }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#0099CB] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{agentName || 'Kullanıcı'}</h2>
            <p className="text-sm text-gray-600">
              {role === 'manager' ? 'Saha Yöneticisi' : 'Saha Temsilcisi'}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className={`px-4 py-2 rounded-lg ${currentScreen === 'dashboard' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}
            aria-label="Dashboard"
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentScreen('routeMap')}
            className={`px-4 py-2 rounded-lg ${currentScreen === 'routeMap' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}
            aria-label="Rota Haritası"
            title="Rota Haritası"
          >
            <Route className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentScreen('visitList')}
            className={`px-4 py-2 rounded-lg ${currentScreen === 'visitList' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}
            aria-label="Ziyaret Listesi"
            title="Ziyaret Listesi"
          >
            <List className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentScreen('reports')}
            className={`px-4 py-2 rounded-lg ${currentScreen === 'reports' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}
            aria-label="Raporlar"
            title="Raporlar"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {role === 'manager' && (
            <>
              <button
                onClick={() => setCurrentScreen('assignment')}
                className={`px-4 py-2 rounded-lg ${currentScreen === 'assignment' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}
                aria-label="Atama"
                title="Atama"
              >
                <UserCheck className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentScreen('teamMap')}
                className={`px-4 py-2 rounded-lg ${currentScreen === 'teamMap' ? 'bg-[#F9C800]' : 'hover:bg-gray-100'}`}
                title="Ekip Haritası"
                aria-label="Ekip Haritası"
              >
                <Users className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
