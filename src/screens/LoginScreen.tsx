import React from 'react';

type Props = { onLogin: () => void; };

const LoginScreen: React.FC<Props> = ({ onLogin }) => (
  <div 
    className="min-h-screen flex items-center justify-center p-4 bg-center bg-no-repeat" 
    style={{ 
      backgroundImage: "url('https://media.licdn.com/dms/image/v2/C5616AQED5PdkHVHWpg/profile-displaybackgroundimage-shrink_200_800/profile-displaybackgroundimage-shrink_200_800/0/1643800809893?e=2147483647&v=beta&t=t_FM9FjEbhHmR-GOmYIUkOc8BXsSXKK8cvTxfL9dZOc')",
      backgroundSize: "contain",
      backgroundColor: "#f5f5f5"
    }}
  >
    <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-24 h-16 mx-auto mb-4 flex items-center justify-center">
          <img 
            src="https://www.enerjisa.com.tr/assets/sprite/enerjisa.webp" 
            alt="Enerjisa Logo" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">EnerjiSaHa</h1>
        <p className="text-gray-600">D2D Satış Uygulaması</p>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
          <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent" placeholder="Kullanıcı adınızı girin" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
          <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent" placeholder="Şifrenizi girin" />
        </div>
      </div>
      <button onClick={onLogin} className="w-full bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors">
        Giriş Yap
      </button>
    </div>
  </div>
);

export default LoginScreen;
