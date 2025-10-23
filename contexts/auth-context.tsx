'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import type { User, LoginCredentials } from '@/lib/types';
import type { AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading, initialize, setUser, setSupabaseUser, setSupabaseSession, setLoading, signOut } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        setSupabaseUser(session.user);
        setSupabaseSession(session);

        // Fetch user data from our database via API route (bypasses RLS)
        try {
          const response = await fetch('/api/auth/user', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const { user: userData } = await response.json();
            const tenant = Array.isArray(userData.tenants) ? userData.tenants[0] : userData.tenants;
            
            const user: User = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              team_id: userData.tenant_id,
              team_name: tenant?.name,
              player_id: userData.player_id,
            };

            setUser(user);
          } else {
            console.error('Failed to fetch user data:', await response.text());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSupabaseUser(null);
        setSupabaseSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSupabaseUser, setSupabaseSession]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        // The onAuthStateChange listener will handle setting the user
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error during login:', error);
      const authError = error as AuthError;
      throw new Error(authError.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error during Google login:', error);
      const authError = error as AuthError;
      throw new Error(authError.message || 'Erro ao fazer login com Google');
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          scopes: 'email openid profile',
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error during Microsoft login:', error);
      const authError = error as AuthError;
      throw new Error(authError.message || 'Erro ao fazer login com Microsoft');
    }
  };

  const logout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
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
        loginWithGoogle,
        loginWithMicrosoft,
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

