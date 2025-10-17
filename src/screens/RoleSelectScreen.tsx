import React from 'react';

type Props = {
  onSelect: (role: string) => void;
};

const RoleSelectScreen: React.FC<Props> = ({ onSelect }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
      <div className="text-center mb-2">
        <img
          src="https://www.enerjisa.com.tr/assets/sprite/enerjisa.webp"
          alt="Enerjisa Logo"
          className="h-12 mx-auto mb-4 object-contain"
        />
        <h1 className="text-2xl font-bold text-gray-800">Uygulama Rolünüzü Seçin</h1>
        <p className="text-gray-500 mt-1">
          Görüntüleyeceğiniz ekranlar rolünüze göre şekillenecektir.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Satış Uzmanı */}
        <button
          onClick={() => onSelect('rep-1')}
          className="group rounded-xl border p-6 text-left transition-all duration-200 ease-in-out hover:border-[#0099CB] hover:shadow-lg hover:-translate-y-1"
        >
          <div className="text-lg font-semibold text-gray-800 group-hover:text-[#0099CB]">
            Satış Uzmanı
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Kendi ziyaretlerinizi görüntüleyin ve yeni müşteri kayıtları oluşturun.
          </div>
        </button>

        {/* Saha Yöneticisi */}
        <button
          onClick={() => onSelect('manager-1')}
          className="group rounded-xl border p-6 text-left transition-all duration-200 ease-in-out hover:border-[#F9C800] hover:shadow-lg hover:-translate-y-1"
        >
          <div className="text-lg font-semibold text-gray-800 group-hover:text-[#D4A900]">
            Saha Yöneticisi
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Tüm ekibin rotalarını ve performansını anlık olarak izleyin.
          </div>
        </button>

        {/* Admin */}
        <button
          onClick={() => onSelect('admin-1')}
          className="group rounded-xl border p-6 text-left transition-all duration-200 ease-in-out hover:border-red-500 hover:shadow-lg hover:-translate-y-1"
        >
          <div className="text-lg font-semibold text-gray-800 group-hover:text-red-600">
            Admin
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Kullanıcı yönetimi ve sistem ayarlarını gerçekleştirin.
          </div>
        </button>

        {/* Operasyon Yöneticisi */}
        <button
          onClick={() => onSelect('operations-1')}
          className="group rounded-xl border p-6 text-left transition-all duration-200 ease-in-out hover:border-green-500 hover:shadow-lg hover:-translate-y-1"
        >
          <div className="text-lg font-semibold text-gray-800 group-hover:text-green-600">
            Operasyon Yöneticisi
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Tarife yönetimi ve saha operasyonlarını planlayın.
          </div>
        </button>
      </div>
    </div>
  </div>
);

export default RoleSelectScreen;
