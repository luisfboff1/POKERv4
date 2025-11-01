import { getToken } from './auth';
import { supabase } from './supabaseClient';
import type { ApiResponse, SessionPlayerData, TransferRecommendation } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      console.error('Erro ao parsear JSON:', await response.text());
      throw new ApiError('Resposta inválida do servidor', response.status);
    }

    if (!response.ok) {
      console.error('Erro da API:', data);

      // Handle expired token (401 Unauthorized)
      if (response.status === 401) {
        // Try to refresh the token
        try {
          const { data: { session }, error } = await supabase.auth.refreshSession();

          if (!error && session?.access_token) {
            // Retry the request with the new token
            const retryHeaders: HeadersInit = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              ...options.headers,
            };

            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
              ...options,
              headers: retryHeaders,
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              return retryData;
            }
          }
        } catch (refreshError) {
          console.error('Erro ao renovar token:', refreshError);
        }

        // If refresh failed or retry failed, sign out
        await supabase.auth.signOut();

        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
      }

      throw new ApiError(
        data.error || data.message || 'Erro na requisição',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Erro de conexão:', error);
    throw new ApiError('Erro de conexão com o servidor', 500);
  }
}

// ===== AUTH =====
export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: { name: string; email: string; password: string; company: string; phone: string; plan?: string }) =>
      fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    verify: () => fetchAPI('/auth/verify'),

    logout: () =>
      fetchAPI('/auth/logout', {
        method: 'POST',
      }),
  },

  // ===== SESSIONS =====
  sessions: {
    list: () => fetchAPI('/sessions'),

    get: (id: number) => fetchAPI(`/sessions/${id}`),

    create: (data: { date: string; location: string; players_data?: SessionPlayerData[]; recommendations?: TransferRecommendation[]; paid_transfers?: Record<string, boolean> }) =>
      fetchAPI('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    schedule: (data: { scheduled_date: string; location: string; max_players?: number; player_ids?: number[] }) =>
      fetchAPI('/sessions/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getConfirmations: (sessionId: number) =>
      fetchAPI(`/sessions/${sessionId}/confirmations`),

    confirmPlayer: (sessionId: number, playerId: number, confirmed: boolean = true) =>
      fetchAPI(`/sessions/${sessionId}/confirmations`, {
        method: 'POST',
        body: JSON.stringify({ player_id: playerId, confirmed }),
      }),

    removeConfirmation: (sessionId: number, playerId: number) =>
      fetchAPI(`/sessions/${sessionId}/confirmations?player_id=${playerId}`, {
        method: 'DELETE',
      }),

    update: (id: number, data: Partial<{ date: string; location: string; players_data: SessionPlayerData[] }>) =>
      fetchAPI(`/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updatePayments: (id: number, playersData: Pick<SessionPlayerData, 'id' | 'name' | 'janta_paid'>[], paidTransfers?: Record<string, boolean>) =>
      fetchAPI(`/sessions/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          players_data: playersData,
          paid_transfers: paidTransfers
        }),
      }),

    delete: (id: number) =>
      fetchAPI(`/sessions/${id}`, {
        method: 'DELETE',
      }),

    approve: (id: number) =>
      fetchAPI('/approve.php', {
        method: 'POST',
        body: JSON.stringify({ session_id: id }),
      }),
  },

  // ===== PLAYERS =====
  players: {
    list: () => fetchAPI('/players'),

    get: (id: number) => fetchAPI(`/players/${id}`),

    create: (name: string, email?: string) =>
      fetchAPI('/players', {
        method: 'POST',
        body: JSON.stringify({ name, email }),
      }),

    update: (id: number, data: Record<string, unknown>) =>
      fetchAPI(`/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      fetchAPI(`/players/${id}`, {
        method: 'DELETE',
      }),

    syncStats: () =>
      fetchAPI('/sync_players_stats.php', {
        method: 'POST',
      }),
  },

  // ===== INVITES =====
  invites: {
    list: () => fetchAPI('/invites'),

    create: (email: string, role: string, name?: string, playerData?: {
      playerLinkType?: string;
      selectedPlayerId?: string | null;
      newPlayerData?: { name: string; nickname: string; phone: string } | null;
    }) => {
      const payload = {
        email,
        role,
        name,
        ...(playerData || {})
      };
      console.log('DEBUG api.ts - Enviando payload:', payload);
      return fetchAPI('/invites', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    accept: (token: string, password: string, name: string) =>
      fetchAPI('/invites/accept', {
        method: 'POST',
        body: JSON.stringify({ token, password, name }),
      }),

    delete: (id: number) =>
      fetchAPI(`/invites/${id}`, {
        method: 'DELETE',
      }),
  },

  // ===== TENANTS (Super Admin) =====
  tenants: {
    list: () => fetchAPI('/tenants'),
    
    create: (name: string, email?: string) =>
      fetchAPI('/tenants', {
        method: 'POST',
        body: JSON.stringify({ name, email }),
      }),
    
    details: (id: number) => 
      fetchAPI(`/super_admin.php?action=tenant_details&tenant_id=${id}`),
  },

  // ===== AGENT (PokerBot) =====
  agent: {
    getStatus: () => fetchAPI('/agent.php?action=status'),
    
    startSession: (data: Record<string, unknown>) =>
      fetchAPI('/agent.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'start', ...data }),
      }),
    
    analyze: (sessionId: number) =>
      fetchAPI('/agent.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'analyze', session_id: sessionId }),
      }),
  },

  // ===== USER TENANTS (Multi-tenant) =====
  userTenants: {
    list: () => fetchAPI('/user-tenants'),
    
    switch: (tenant_id: number) =>
      fetchAPI('/user-tenants', {
        method: 'POST',
        body: JSON.stringify({ tenant_id }),
      }),
  },

  // ===== USERS (Admin/Super Admin) =====
  users: {
    list: () => fetchAPI('/users'),

    updateRole: (userId: number, role: string, tenantId?: number) =>
      fetchAPI(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role, tenantId }),
      }),
  },
};

