'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, saveToken, removeToken } from '@/lib/auth';
import { api } from '@/lib/api';
import type { User, LoginCredentials } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carregar usuário do localStorage ao montar
  useEffect(() => {
    const loadUser = () => {
      const token = getToken();
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Erro ao carregar usuário:', e);
          removeToken();
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.auth.login(credentials.email, credentials.password);
      
      if (response.data) {
        const { token, user } = response.data as { token: string; user: User };
        saveToken(token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        router.push('/dashboard');
      } else {
        throw new Error('Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem('user');
    setUser(null);
    api.auth.logout();
    router.push('/login');
  };

  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

