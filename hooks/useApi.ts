'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Session, SessionDetail, Player, Invite, CreateSessionPayload, SessionPlayerData, Tenant } from '@/lib/types';

// Hook genérico para chamadas de API
export function useApi<T>(
  apiCall: () => Promise<any>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiCall();
      setData(response.data || null);
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

// Hook específico para sessões
export function useSessions() {
  const { data, loading, error, refetch } = useApi<Session[]>(
    () => api.sessions.list(),
    []
  );

  const createSession = async (sessionData: CreateSessionPayload) => {
    try {
      await api.sessions.create(sessionData);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const deleteSession = async (id: number) => {
    try {
      await api.sessions.delete(id);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const approveSession = async (id: number) => {
    try {
      await api.sessions.approve(id);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const updateSessionPayments = async (id: number, playersData: Pick<SessionPlayerData,'id'|'name'|'janta_paid'>[], paidTransfers?: Record<string, boolean>) => {
    try {
      await api.sessions.updatePayments(id, playersData, paidTransfers);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  return {
    sessions: data || [],
    loading,
    error,
    refetch,
    createSession,
    deleteSession,
    approveSession,
    updateSessionPayments,
  };
}

// Hook específico para jogadores
export function usePlayers() {
  const { data, loading, error, refetch } = useApi<Player[]>(
    () => api.players.list(),
    []
  );

  const createPlayer = async (name: string, email?: string) => {
    try {
      const result = await api.players.create(name, email);
      await refetch();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updatePlayer = async (id: number, playerData: Record<string, unknown>) => {
    try {
      await api.players.update(id, playerData);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const deletePlayer = async (id: number) => {
    try {
      await api.players.delete(id);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  return {
    players: data || [],
    loading,
    error,
    refetch,
    createPlayer,
    updatePlayer,
    deletePlayer,
  };
}

// Hook específico para convites
export function useInvites() {
  const { data, loading, error, refetch } = useApi<Invite[]>(
    () => api.invites.list(),
    []
  );

  const createInvite = async (email: string, role: string, name?: string, playerData?: {
    playerLinkType?: string;
    selectedPlayerId?: string | null;
    newPlayerData?: { name: string; nickname: string; phone: string } | null;
  }) => {
    try {
      await api.invites.create(email, role, name, playerData);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const deleteInvite = async (id: number) => {
    try {
      await api.invites.delete(id);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  return {
    invites: data || [],
    loading,
    error,
    refetch,
    createInvite,
    deleteInvite,
  };
}

// Hook específico para tenants (super admin)
export function useTenants() {
  const { data, loading, error, refetch } = useApi<{tenants: Tenant[]}>(
    () => api.tenants.list(),
    []
  );

  return {
    tenants: (data?.tenants as Tenant[]) || [],
    loading,
    error,
    refetch,
  };
}

// Hook específico para usuários (admin/super admin)
export function useUsers() {
  const { data, loading, error, refetch } = useApi<any[]>(
    () => api.users.list(),
    []
  );

  const updateUserRole = async (userId: number, role: string, tenantId?: number) => {
    try {
      await api.users.updateRole(userId, role, tenantId);
      await refetch();
      return true;
    } catch (err) {
      throw err;
    }
  };

  return {
    users: data || [],
    loading,
    error,
    refetch,
    updateUserRole,
  };
}

// Hook para buscar jogadores de um tenant específico
export function usePlayersForTenant() {
  const { data, loading, error, refetch } = useApi<Player[]>(
    () => api.players.list(),
    []
  );

  // Filtrar jogadores que ainda não têm usuário vinculado
  const availablePlayers = (data || []).filter(player => !player.user_id);

  return {
    players: data || [],
    availablePlayers,
    loading,
    error,
    refetch,
  };
}

// Hook para estatísticas do dashboard
export function useDashboardStats() {
  const { sessions } = useSessions();
  const { players } = usePlayers();

  const stats = {
    totalSessions: sessions.length,
    totalPlayers: players.length,
    recentSessions: sessions.slice(0, 5),
    pendingSessions: sessions.filter(s => s.status === 'pending').length,
  };

  return stats;
}