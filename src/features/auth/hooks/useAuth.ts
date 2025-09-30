import { useState, useEffect } from 'react';
import { AuthUser, AuthState, LoginCredentials } from '../types';
import { signIn, signOut, getCurrentUser } from '../../../lib/supabase';

export function useAuth(): AuthState & {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loginDemo: (role: string) => void;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isDemoMode: false,
  });

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { user, error } = await getCurrentUser();
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return;
      }

      if (user) {
        const authUser: AuthUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          role: user.user_metadata?.role || 'sales_rep',
          isActive: true,
        };
        setState(prev => ({ ...prev, user: authUser, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Authentication failed',
        isLoading: false 
      }));
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { error } = await signIn(credentials.email, credentials.password);
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return;
      }

      await checkAuthState();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false 
      }));
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await signOut();
      setState({
        user: null,
        isLoading: false,
        error: null,
        isDemoMode: false,
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Logout failed',
        isLoading: false 
      }));
    }
  };

  const loginDemo = (roleKey: string) => {
    const roleMap: Record<string, Role> = {
      'rep-1': 'sales_rep',
      'manager-1': 'manager',
      'admin-1': 'admin',
      'operations-1': 'operations_manager',
    };

    const demoUser: AuthUser = {
      id: roleKey,
      email: 'demo@enerjisa.com',
      name: 'Demo User',
      role: roleMap[roleKey] || 'sales_rep',
      isActive: true,
    };

    setState({
      user: demoUser,
      isLoading: false,
      error: null,
      isDemoMode: true,
    });
  };

  return {
    ...state,
    login,
    logout,
    loginDemo,
  };
}