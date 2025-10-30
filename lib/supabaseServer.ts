import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || supabaseUrl.includes('YOUR_SUPABASE')) {
  console.warn(
    'Missing Supabase server environment variables. ' +
    'Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local'
  );
}

const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'placeholder-key';

export const supabaseServer = createClient(
  supabaseUrl && !supabaseUrl.includes('YOUR_SUPABASE') ? supabaseUrl : dummyUrl,
  supabaseServiceRoleKey && !supabaseServiceRoleKey.includes('YOUR_SUPABASE') ? supabaseServiceRoleKey : dummyKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'poker',
    },
  }
);

export const executeWithServiceRole = async <T>(
  operation: (client: typeof supabaseServer) => Promise<T>
): Promise<T> => {
  try {
    return await operation(supabaseServer);
  } catch (operationError) {
    console.error('Service role operation failed:', operationError);
    throw operationError;
  }
};

export const getTenantById = async (tenantId: number) => {
  const { data, error } = await supabaseServer
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch tenant: ${error.message}`);
  }

  return data;
};

export const getAllTenants = async () => {
  const { data, error } = await supabaseServer
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tenants: ${error.message}`);
  }

  return data;
};

export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data;
};

export const createUser = async (userData: {
  tenant_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  is_active?: boolean;
}) => {
  const { data, error } = await supabaseServer
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
};

export const updateUser = async (userId: number, updates: Record<string, unknown>) => {
  const { data, error } = await supabaseServer
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
};

export const createAuditLog = async (logData: {
  tenant_id?: number;
  user_id?: number;
  action: string;
  table_name?: string;
  record_id?: number;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}) => {
  const { error } = await supabaseServer
    .from('audit_logs')
    .insert([logData]);

  if (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const getSessionsByTenant = async (tenantId: number, limit = 100) => {
  const { data, error } = await supabaseServer
    .from('sessions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }

  return data;
};

export const getPlayersByTenant = async (tenantId: number) => {
  const { data, error } = await supabaseServer
    .from('players')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch players: ${error.message}`);
  }

  return data;
};

export const updatePlayerStats = async (
  playerId: number,
  stats: {
    total_sessions?: number;
    total_buyin?: number;
    total_cashout?: number;
    total_profit?: number;
    win_rate?: number;
    last_played?: string;
  }
) => {
  const { error } = await supabaseServer
    .from('players')
    .update(stats)
    .eq('id', playerId);

  if (error) {
    console.error('Failed to update player stats:', error);
    throw error;
  }
};

export const cleanExpiredInvites = async () => {
  const { error } = await supabaseServer
    .from('user_invites')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to clean expired invites:', error);
  }
};

export const cleanExpiredSessions = async () => {
  const { error } = await supabaseServer
    .from('user_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to clean expired sessions:', error);
  }
};
