import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  supabaseSession: SupabaseSession | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSupabaseUser: (user: SupabaseUser | null) => void;
  setSupabaseSession: (session: SupabaseSession | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      supabaseUser: null,
      supabaseSession: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setSupabaseUser: (supabaseUser) => set({ supabaseUser }),
      setSupabaseSession: (supabaseSession) => set({ supabaseSession }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({ 
            user: null, 
            supabaseUser: null, 
            supabaseSession: null 
          });
        } catch (error) {
          console.error('Error signing out:', error);
          throw error;
        }
      },

      initialize: async () => {
        if (get().initialized) return;

        try {
          set({ loading: true });

          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            set({ loading: false, initialized: true });
            return;
          }

          if (session) {
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

                set({
                  user,
                  supabaseUser: session.user,
                  supabaseSession: session,
                });
              } else {
                console.error('Failed to fetch user data:', await response.text());
              }
            } catch (fetchError) {
              console.error('Error fetching user data:', fetchError);
            }
          }

          set({ loading: false, initialized: true });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ loading: false, initialized: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
