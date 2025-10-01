import { useState, useEffect } from 'react';
import type { LiveSession } from '@/lib/types';

const CACHE_KEY = 'current_session_cache';

export function useSessionState() {
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [step, setStep] = useState<'create' | 'players' | 'active' | 'cashout' | 'transfers'>('create');

  // Funções de cache
  const saveToCache = (session: LiveSession) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...session, lastSaved: new Date().toISOString() }));
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  };

  const loadFromCache = (): LiveSession | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const session = JSON.parse(cached);
        const lastSaved = new Date(session.lastSaved);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) return session;
      }
    } catch (error) {
      console.error('Erro ao carregar do cache:', error);
    }
    return null;
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem('session_data');
      localStorage.removeItem('current_session');
      localStorage.removeItem('poker_session_cache');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  useEffect(() => {
    const cachedSession = loadFromCache();
    if (cachedSession) {
      setCurrentSession(cachedSession);
      switch (cachedSession.status) {
        case 'creating': setStep('create'); break;
        case 'players': setStep('players'); break;
        case 'active': setStep('active'); break;
        case 'cashout': setStep('cashout'); break;
        case 'finished': setStep('transfers'); break;
        default: setStep('create');
      }
    }
  }, []);

  useEffect(() => {
    if (currentSession) saveToCache(currentSession);
  }, [currentSession]);

  return {
    currentSession,
    setCurrentSession,
    step,
    setStep,
    clearCache
  };
}
