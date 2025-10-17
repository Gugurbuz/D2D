import React, { ReactNode } from 'react';
import { useAuthContext } from './AuthProvider';
import LoginScreen from '../screens/LoginScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  requireManager?: boolean;
}

export function ProtectedRoute({ children, requireManager = false }: ProtectedRouteProps) {
  const { user, salesRep, loading, isManager } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0099CB]"></div>
      </div>
    );
  }

  if (!user || !salesRep) {
    return <LoginScreen onLogin={() => {}} />;
  }

  if (requireManager && !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Yetkisiz Erişim</h1>
          <p className="text-gray-600">Bu sayfaya erişim için yönetici yetkisi gereklidir.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}