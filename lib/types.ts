// ===== USER & AUTH =====
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'player';
  team_id: number;
  team_name?: string;
  player_id?: number; // Vinculação com jogador para dashboard personalizado
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  team_id?: number;
}

// ===== PLAYER =====
export interface Player {
  id: number;
  user_id?: number; // Opcional pois jogadores podem não ter usuário
  name: string;
  email?: string;
  role?: string;
  status: 'active' | 'inactive';
  team_id: number;
  team_name?: string;
  // Campos estatísticos da nova tabela players
  total_sessions?: number;
  total_buyin?: number;
  total_cashout?: number;
}

// ===== SESSION =====
export interface Session {
  id: number;
  date: string;
  location: string;
  status: 'pending' | 'approved' | 'closed';
  created_by: number;
  created_by_name?: string;
  created_at: string;
  team_id: number;
  players_data?: SessionPlayerData[];
  recommendations?: TransferRecommendation[];
}

// Player data persisted with a historical session (subset of LivePlayer plus payment flags)
export interface SessionPlayerData {
  id?: number | string; // Pode ser string se originado de sessão live sem persistir ainda
  name: string;
  buyin?: number; // total buy-in acumulado
  cashout?: number; // valor retirado
  session_paid?: boolean; // pagou taxa / sessão
  janta_paid?: boolean; // pagou janta
  // Campos adicionais futuros (ex: rake, bounty) podem ser adicionados aqui
}

// ===== LIVE SESSION (for real-time game management) =====
export interface LivePlayer {
  id: string;
  name: string;
  email?: string;
  buyin: number;
  totalBuyin: number;
  cashout: number;
  janta: number;
  rebuys: number[];
  isExisting?: boolean; // se é um jogador cadastrado ou novo
  // Campos de pagamento
  session_paid?: boolean; // Se pagou a sessão
  janta_paid?: boolean; // Se pagou a janta
}

export interface LiveSession {
  id?: number;
  date: string;
  location: string;
  status: 'creating' | 'players' | 'active' | 'cashout' | 'finished';
  players: LivePlayer[];
  created_at?: string;
  finished_at?: string;
}

export interface TransferRecommendation {
  from: string;
  to: string;
  amount: number;
  isPaid?: boolean; // Status de pagamento da transferência
}

export interface PlayerBalance {
  player_id: number;
  player_name: string;
  buyin: number;
  cashout: number;
  balance: number;
}

export interface SessionDetail extends Session {
  players: PlayerBalance[];
  total_buyin: number;
  total_cashout: number;
  total_balance: number;
}

// ===== TENANT =====
export interface Tenant {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'basic' | 'premium' | 'enterprise';
  created_at: string;
  users_count?: number;
  users?: TenantUser[];
}

export interface TenantUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'player';
  is_active: boolean;
}

// ===== INVITE =====
export interface Invite {
  id: number;
  email: string;
  role: string;
  team_id: number;
  team_name?: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: number;
  invited_by_name?: string;
  created_at: string;
  expires_at: string;
}

// ===== API RESPONSE =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Payload para criação de sessão (lado cliente)
export interface CreateSessionPayload {
  date: string;
  location: string;
  players_data?: SessionPlayerData[];
  recommendations?: TransferRecommendation[];
  paid_transfers?: Record<string, boolean>;
}

