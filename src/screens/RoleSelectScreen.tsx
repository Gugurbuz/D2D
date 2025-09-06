import React from 'react';
import { Role } from '../types';

type Props = {
  onSelect: (role: Role) => void;
};

const RoleSelectScreen: React.FC<Props> = ({ onSelect }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-lg transition-all duration-300">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Rol Seçimi</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => onSelect('rep')}
          className="rounded-xl border border-gray-300 dark:border-gray-700 p-6 hover:border-[#0099CB] hover:bg-[#0099CB]/10 focus:outline-none focus:ring-2 focus:ring-[#0099CB] text-left transition-all duration-200"
          aria-label="Satış Uzmanı Rolünü Seç"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🧑‍💼</span>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Satış Uzmanı</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Kendi ziyaretlerini gör ve yürüt</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => onSelect('manager')}
          className="rounded-xl border border-gray-300 dark:border-gray-700 p-6 hover:border-yellow-400 hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-left transition-all duration-200"
          aria-label="Saha Yöneticisi Rolünü Seç"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Saha Yöneticisi</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Atama yap, rotaları izle</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
);

export default RoleSelectScreen;
