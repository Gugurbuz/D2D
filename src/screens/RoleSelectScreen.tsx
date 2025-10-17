import React from 'react';

interface RoleSelectScreenProps {
  onSelect: (role: string) => void;
}

const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({ onSelect }) => {
  const roles = [
    { id: 'rep-1', title: 'Satış Temsilcisi', description: 'Sahada ziyaret yapan temsilci' },
    { id: 'manager-1', title: 'Yönetici', description: 'Takım yöneticisi' },
    { id: 'admin-1', title: 'Admin', description: 'Sistem yöneticisi' },
    { id: 'operations-1', title: 'Operasyon Yöneticisi', description: 'Operasyonları yöneten' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Rol Seçin</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelect(role.id)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-[#0099CB] hover:bg-blue-50 transition-all text-left"
            >
              <h3 className="font-semibold text-lg mb-1">{role.title}</h3>
              <p className="text-sm text-gray-600">{role.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectScreen;
