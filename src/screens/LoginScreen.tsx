import React, { useState } from 'react';
import { signIn, isSupabaseConfigured } from '../lib/supabase';
import { Loader as Loader2 } from 'lucide-react';

type Props = {
  onLogin: (email?: string, password?: string, isDemoMode?: boolean) => void;
};

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleQuickLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onLogin('test@enerjisa.com', 'test123');
      setSuccess('Giriş başarılı!');
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onLogin(email, password);
      setSuccess('Giriş başarılı!');
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-360 h-240 mx-auto mb-4 flex items-center justify-center">
            <img
              src="https://ehqotgebdywdmwxbwbjl.supabase.co/storage/v1/object/sign/Logo/animatedlogo3.gif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82YTJkNThmMC1kMzNhLTRiY2MtODMxMy03ZjE2NmIwN2NjMDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMb2dvL2FuaW1hdGVkbG9nbzMuZ2lmIiwiaWF0IjoxNzU3MjY2NDMzLCJleHAiOjE3ODg4MDI0MzN9.J6IxjFdcZwL38INubr8hwsMYpzZM3il9GllxYQF_BFk"
              alt="Enerjisa Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">D2D Satış Uygulaması</h1>
          <p className="text-gray-600"> </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'İşleniyor...' : 'Giriş Yap'}
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
              onClick={() => onLogin(undefined, undefined, true)}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Demo Modunda Devam Et
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
