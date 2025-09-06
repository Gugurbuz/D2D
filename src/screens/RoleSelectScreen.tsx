import React from 'react';
import { Role } from '../types';

type Props = {
  onSelect: (role: Role) => void;
};

const RoleSelectScreen: React.FC<Props> = ({ onSelect }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Rol Seçimi</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <button onClick={() => onSelect('rep')} className="rounded-xl border p-6 hover:border-[#0099CB] hover:bg-[#0099CB]/5 text-left">
          <div className="text-lg font-semibold">Satış Uzmanı</div>
          <div className="text-sm text-gray-600 mt-1">Kendi ziyaretlerini gör ve yürüt</div>
        </button>
        <button onClick={() => onSelect('manager')} className="rounded-xl border p-6 hover:border-[#F9C800] hover:bg-[#F9C800]/10 text-left">
          <div className="text-lg font-semibold">Saha Yöneticisi</div>
          <div className="text-sm text-gray-600 mt-1">Atama yap, rotaları izle</div>
        </button>
      </div>
    </div>
  </div>
);

export default RoleSelectScreen;
