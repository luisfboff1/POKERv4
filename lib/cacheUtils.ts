export const CACHE_KEY = 'current_session_cache';

// Estrutura mínima esperada de sessão em cache (flexível)
export interface CachedSessionBase {
  id?: number | string;
  date?: string;
  location?: string;
  players_data?: unknown;
  [extra: string]: unknown;
}

export function saveToCache<T extends CachedSessionBase>(session: T) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...session, lastSaved: new Date().toISOString() }));
  } catch (error) {
    console.error('Erro ao salvar no cache:', error);
  }
}

export function loadFromCache<T extends CachedSessionBase>(): (T & { lastSaved: string }) | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const session = JSON.parse(cached) as T & { lastSaved: string };
      const lastSaved = new Date(session.lastSaved);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) return session;
    }
  } catch (error) {
    console.error('Erro ao carregar do cache:', error);
  }
  return null;
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem('session_data');
    localStorage.removeItem('current_session');
    localStorage.removeItem('poker_session_cache');
    localStorage.removeItem('user_data');
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
}
