import React from 'react';
import { User, Home, Route, List, BarChart3, UserCheck, Users } from 'lucide-react';
import { Role, Screen } from '../types';

type Props = {
  agentName: string;
  role: Role;
  currentScreen: Screen;
  setCurrentScreen: (s: Screen) => void;
};

const Navigation: React.FC<Props> = ({ agentName, role, currentScreen, setCurrentScreen }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-3">
        {/* Sol: kullanıcı bilgisi */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#0099CB] rounded-full flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{agentName || 'Kullanıcı'}</h2>
            <p className="text-sm text-gray-600 truncate">
              {role === 'manager' ? 'Saha Yöneticisi' : 'Saha Temsilcisi'}
            </p>
          </div>
        </div>

        {/* Sağ: kaydırılabilir buton grubu */}
        <div
          className="
            flex items-center gap-2
            overflow-x-auto no-scrollbar
            max-w-[70vw] sm:max-w-none
            whitespace-nowrap
          "
          role="tablist"
          aria-label="Ana navigasyon"
        >
          <NavBtn
            active={currentScreen === 'dashboard'}
            onClick={() => setCurrentScreen('dashboard')}
            ariaLabel="Ana sayfa"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Ana</span>
          </NavBtn>

          <NavBtn
            active={currentScreen === 'routeMap'}
            onClick={() => setCurrentScreen('routeMap')}
            ariaLabel="Rota"
          >
            <Route className="w-5 h-5" />
            <span className="hidden sm:inline">Rota</span>
          </NavBtn>

          <NavBtn
            active={currentScreen === 'visitList'}
            onClick={() => setCurrentScreen('visitList')}
            ariaLabel="Ziyaretler"
          >
            <List className="w-5 h-5" />
            <span className="hidden sm:inline">Ziyaretler</span>
          </NavBtn>

          <NavBtn
            active={currentScreen === 'reports'}
            onClick={() => setCurrentScreen('reports')}
            ariaLabel="Raporlar"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden sm:inline">Raporlar</span>
          </NavBtn>

          {role === 'manager' && (
            <>
              <NavBtn
                active={currentScreen === 'assignment'}
                onClick={() => setCurrentScreen('assignment')}
                ariaLabel="Atama"
              >
                <UserCheck className="w-5 h-5" />
                <span className="hidden sm:inline">Atama</span>
              </NavBtn>

              <NavBtn
                active={currentScreen === 'teamMap'}
                onClick={() => setCurrentScreen('teamMap')}
                ariaLabel="Ekip Haritası"
              >
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Ekip</span>
              </NavBtn>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function NavBtn({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        "px-3 sm:px-4 h-10 rounded-lg flex items-center gap-2 shrink-0",
        active ? "bg-[#F9C800]" : "hover:bg-gray-100"
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default Navigation;
