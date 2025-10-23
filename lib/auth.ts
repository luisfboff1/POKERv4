import { supabase } from './supabaseClient';

// ===== FUNÇÕES DE AUTH COM SUPABASE =====
// Migrado para usar Supabase Auth em vez de JWT localStorage

export async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session?.access_token ?? null;
  } catch (error) {
    console.error('Error in getToken:', error);
    return null;
  }
}

// Legacy functions - kept for backward compatibility but use Supabase now
export function saveToken(_token: string): void {
  console.warn('saveToken is deprecated - Supabase handles token management automatically');
}

export function removeToken(): void {
  console.warn('removeToken is deprecated - use supabase.auth.signOut() instead');
}

