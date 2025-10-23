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
        // Wait to ensure cookies are fully set before redirecting
        // This prevents race condition with middleware
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify session is readable multiple times to ensure cookies are set
        let verifiedSession = null;
        for (let i = 0; i < 3; i++) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            verifiedSession = session;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (verifiedSession) {
          // The onAuthStateChange listener will handle setting the user
          // Check if there's a redirect parameter in the URL
          const urlParams = new URLSearchParams(window.location.search);
          const redirectParam = urlParams.get('redirect');
          
          // Validate that redirect is a relative path starting with / and not a full URL
          // Only allow paths, not protocol-relative URLs or external domains
          let redirect = '/dashboard';
          if (redirectParam && typeof redirectParam === 'string') {
            // Must start with / and not with //
            if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
              // Additional check: ensure no protocol or domain
              if (!redirectParam.includes('://') && !redirectParam.includes('//')) {
                redirect = redirectParam;
              }
            }
          }
          
          // Use router.replace for seamless navigation
          // replace() doesn't add to history, preventing back button issues
          router.replace(redirect);
        }
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
      // Get redirect parameter from URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      
      // Validate and construct callback URL with redirect parameter
      let callbackUrl = `${window.location.origin}/api/auth/callback`;
      if (redirectParam && typeof redirectParam === 'string') {
        if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
          if (!redirectParam.includes('://') && !redirectParam.includes('//')) {
            callbackUrl += `?next=${encodeURIComponent(redirectParam)}`;
          }
        }
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
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
      // Get redirect parameter from URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      
      // Validate and construct callback URL with redirect parameter
      let callbackUrl = `${window.location.origin}/api/auth/callback`;
      if (redirectParam && typeof redirectParam === 'string') {
        if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
          if (!redirectParam.includes('://') && !redirectParam.includes('//')) {
            callbackUrl += `?next=${encodeURIComponent(redirectParam)}`;
          }
        }
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: callbackUrl,
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

