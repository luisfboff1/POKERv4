// ===== USER & AUTH =====
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'player';
  team_id: number;
  team_name?: string;
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
  user_id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  team_id: number;
  team_name?: string;
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

