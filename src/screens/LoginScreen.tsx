import React, { useState } from 'react';
import { signIn, signUp } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

type Props = { 
  onLogin: () => void; 
};

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'sales_rep' | 'manager'>('sales_rep');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createTestUser = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const testEmail = 'test@enerjisa.com';
      const testPassword = 'test123';
      const testName = 'Test Kullanıcısı';
      const testPhone = '0555 123 45 67';
      
      // First try to login with existing test user
      const { error: loginError } = await signIn(testEmail, testPassword);
      
      if (!loginError) {
        setSuccess('Test kullanıcısı ile giriş başarılı!');
        setTimeout(() => onLogin(), 1000);
        return;
      }
      
      // If login fails, try to create new user
      const { error } = await signUp(testEmail, testPassword, {
        name: testName,
        phone: testPhone,
        role: 'sales_rep'
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Test kullanıcısı zaten mevcut. Yukarıdaki giriş formunu kullanarak test@enerjisa.com ve test123 ile giriş yapın.');
          return;
        } else {
          setError(`Kullanıcı oluşturulamadı: ${error.message}`);
          return;
        }
      }
      
      setSuccess('Test kullanıcısı başarıyla oluşturuldu! Giriş yapılıyor...');
      setTimeout(() => onLogin(), 1000);
    } catch (err: any) {
      setError(`Beklenmeyen hata: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setEmail('test@enerjisa.com');
    setPassword('test123');
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await signIn('test@enerjisa.com', 'test123');
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Test kullanıcısı bulunamadı. Önce "Test Kullanıcısı Oluştur" butonuna tıklayın.');
        } else {
          setError(`Giriş hatası: ${error.message}`);
        }
        return;
      }
      setSuccess('Giriş başarılı!');
      setTimeout(() => onLogin(), 500);
    } catch (err: any) {
      setError(`Beklenmeyen hata: ${err.message || 'Bilinmeyen hata'}`);
      onLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.');
          }
          throw error;
        }
      } else {
        const { error } = await signUp(email, password, { name, phone, role });
        if (error) {
          if (error.message.includes('User already registered')) {
            setError('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
            return;
          }
          if (error.message.includes('Password should be at least')) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
          }
          setError(error.message);
          return;
        }
      }
      onLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
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

        <div className="mb-6">
          <div className="flex rounded-lg border border-gray-300 p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin ? 'bg-[#0099CB] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin ? 'bg-[#0099CB] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kayıt Ol
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
                  placeholder="Adınızı ve soyadınızı girin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
                  placeholder="Telefon numaranızı girin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'sales_rep' | 'manager')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
                >
                  <option value="sales_rep">Satış Temsilcisi</option>
                  <option value="manager">Saha Yöneticisi</option>
                </select>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
              placeholder="E-posta adresinizi girin"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0099CB] focus:border-transparent"
              placeholder="Şifrenizi girin"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0099CB] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0088B8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleQuickLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Hızlı Test Girişi
            </button>
            
            <button
              type="button"
              onClick={createTestUser}
              disabled={loading}
              className="w-full bg-[#F9C800] text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-[#E6B400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Test Kullanıcısı Oluşturuluyor...' : 'Test Kullanıcısı Oluştur'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              <strong>Test Bilgileri:</strong><br />
              E-posta: test@enerjisa.com<br />
              Şifre: test123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;