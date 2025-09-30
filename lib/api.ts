import { getToken } from './auth';
import type { ApiResponse } from './types';

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
  const token = getToken();
  
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

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Erro na requisição',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Erro de conexão com o servidor', 500);
  }
}

// ===== AUTH =====
export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('/auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: { name: string; email: string; password: string }) =>
      fetchAPI('/register.php', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    verify: () => fetchAPI('/auth.php?action=verify'),

    logout: () => {
      // Remove token do localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    },
  },

  // ===== SESSIONS =====
  sessions: {
    list: () => fetchAPI('/session.php?action=list'),
    
    get: (id: number) => fetchAPI(`/session.php?action=get&id=${id}`),
    
    create: (data: unknown) =>
      fetchAPI('/session.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', ...data }),
      }),
    
    update: (id: number, data: unknown) =>
      fetchAPI('/session.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'update', id, ...data }),
      }),
    
    delete: (id: number) =>
      fetchAPI('/session.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id }),
      }),
    
    approve: (id: number) =>
      fetchAPI('/approve.php', {
        method: 'POST',
        body: JSON.stringify({ session_id: id }),
      }),
  },

  // ===== PLAYERS =====
  players: {
    list: () => fetchAPI('/players.php?action=list'),
    
    get: (id: number) => fetchAPI(`/players.php?action=get&id=${id}`),
    
    update: (id: number, data: unknown) =>
      fetchAPI('/players.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'update', id, ...data }),
      }),
  },

  // ===== INVITES =====
  invites: {
    list: () => fetchAPI('/invite.php?action=list'),
    
    create: (email: string, role: string) =>
      fetchAPI('/invite.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', email, role }),
      }),
    
    accept: (token: string, password: string, name: string) =>
      fetchAPI('/accept_invite.php', {
        method: 'POST',
        body: JSON.stringify({ token, password, name }),
      }),
    
    delete: (id: number) =>
      fetchAPI('/invite.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id }),
      }),
  },

  // ===== AGENT (PokerBot) =====
  agent: {
    getStatus: () => fetchAPI('/agent.php?action=status'),
    
    startSession: (data: unknown) =>
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
};

