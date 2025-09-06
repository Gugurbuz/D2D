import React from 'react';
// --- NOT: Eğer aşağıdaki Role tipini güncellemeyip string kullanacaksak bu satırı silebiliriz. ---
import { Role } from '../types';

type Props = {
  // --- DEĞİŞİKLİK 1: onSelect fonksiyonunun tipini daha esnek olması için 'string' olarak güncelleyebiliriz ---
  // Veya aşağıdaki notta belirtildiği gibi Role tipini güncelleyebilirsiniz.
  onSelect: (role: string) => void;
};

const RoleSelectScreen: React.FC<Props> = ({ onSelect }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
      <div className="text-center mb-2">
        <img
          src="https://www.enerjisa.com.tr/assets/sprite/enerjisa.webp"
          alt="Enerjisa Logo"
          className="h-12 mx-auto mb-4 object-contain"
        />
        <h1 className="text-2xl font-bold text-gray-800">Uygulama Rolünüzü Seçin</h1>
        <p className="text-gray-500 mt-1">Görüntüleyeceğiniz ekranlar rolünüze göre şekillenecektir.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* --- DEĞİŞİKLİK 2: onSelect parametresi 'rep' yerine 'rep-1' oldu. --- */}
        <button
          onClick={() => onSelect('rep-1')}
          className="group rounded-xl border p-6 text-left transition-all duration-200 ease-in-out hover:border-[#0099CB] hover:shadow-lg hover:-translate-y-1"
        >
          <div className="text-lg font-semibold text-gray-800 group-hover:text-[#0099CB]">Satış Uzmanı</div>
          <div className="text-sm text-gray-600 mt-1">Kendi ziyaretlerinizi görüntüleyin ve yeni müşteri kayıtları oluşturun.</div>
        </button>

        {/* --- DEĞİŞİKLİK 3: onSelect parametresi 'manager' yerine 'manager-1' oldu. --- */}
        <button
          onClick={() => onSelect('manager-1')}
          className="group rounded-xl border p-6 text-left transition-all duration-200 ease-in-out hover:border-[#F9C800] hover:shadow-lg hover:-translate-y-1"
        >
          <div className="text-lg font-semibold text-gray-800 group-hover:text-[#D4A900]">Saha Yöneticisi</div>
          <div className="text-sm text-gray-600 mt-1">Tüm ekibin rotalarını ve performansını anlık olarak izleyin.</div>
        </button>
      </div>
    </div>
  </div>
);

export default RoleSelectScreen;