import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { supabaseServer } from './supabaseServer';

interface AuthUser {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  tenant_name: string;
  tenant_status: string;
  tenant_plan: string;
  max_sessions_per_month?: number;
  max_users?: number;
  player_id?: number;
}

/**
 * Extract Supabase access token from request headers
 */
export const getTokenFromHeaders = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  return authHeader.replace('Bearer ', '');
};

/**
 * Extract Supabase access token from server component headers
 */
export const getTokenFromHeadersServerComponent = async (): Promise<string | null> => {
  const headersList = await headers();
  const authHeader = headersList.get('authorization') || headersList.get('Authorization');

  if (!authHeader) {
    return null;
  }

  return authHeader.replace('Bearer ', '');
};

/**
 * Validate Supabase token and fetch user data
 * This is the ONLY authentication method - no custom JWT fallback
 */
export const requireAuth = async (req: NextRequest): Promise<AuthUser> => {
  const token = getTokenFromHeaders(req);

  if (!token) {
    throw new Error('Token de autenticação necessário');
  }

  // Validate Supabase access token
  const { data: { user: supabaseUser }, error: supabaseError } = await supabaseServer.auth.getUser(token);

  if (supabaseError || !supabaseUser) {
    throw new Error('Token inválido ou expirado');
  }

  // Fetch user from database with tenant info
  const userWithTenant = await fetchUserByEmail(supabaseUser.email!);

  if (!userWithTenant) {
    throw new Error('Usuário não encontrado ou inativo');
  }

  if (userWithTenant.tenant_status !== 'active') {
    throw new Error('Tenant inativo ou pendente de aprovação');
  }

  return userWithTenant;
};

/**
 * Fetch user by email with tenant information
 */
const fetchUserByEmail = async (email: string): Promise<AuthUser | null> => {
  try {
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select(`
        id,
        tenant_id,
        name,
        email,
        role,
        is_active,
        player_id,
        tenants (
          name,
          status,
          plan,
          max_sessions_per_month,
          max_users
        )
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return null;
    }

    const tenant = Array.isArray(user.tenants) ? user.tenants[0] : user.tenants;

    return {
      id: user.id,
      tenant_id: user.tenant_id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      tenant_name: tenant?.name || '',
      tenant_status: tenant?.status || '',
      tenant_plan: tenant?.plan || 'basic',
      max_sessions_per_month: tenant?.max_sessions_per_month,
      max_users: tenant?.max_users,
      player_id: user.player_id,
    };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
};

/**
 * Check if user has required role (role hierarchy validation)
 */
export const requireRole = (user: AuthUser, requiredRole: string): boolean => {
  const roleHierarchy: Record<string, number> = {
    player: 1,
    admin: 2,
    super_admin: 3,
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 999;

  if (userLevel < requiredLevel) {
    throw new Error('Permissões insuficientes');
  }

  return true;
};

/**
 * Check tenant plan limits (sessions monthly or users)
 */
export const checkPlanLimits = async (
  tenantId: number,
  limitType: 'sessions_monthly' | 'users'
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}> => {
  try {
    if (limitType === 'sessions_monthly') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: sessionCount, error: sessionError } = await supabaseServer
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfMonth.toISOString());

      if (sessionError) {
        throw new Error(`Failed to count sessions: ${sessionError.message}`);
      }

      const { data: tenant, error: tenantError } = await supabaseServer
        .from('tenants')
        .select('max_sessions_per_month')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        throw new Error(`Failed to get tenant limits: ${tenantError.message}`);
      }

      const current = sessionCount || 0;
      const limit = tenant.max_sessions_per_month || 50;

      return {
        allowed: current < limit,
        current,
        limit,
        remaining: Math.max(0, limit - current),
      };
    }

    if (limitType === 'users') {
      const { count: userCount, error: userError } = await supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (userError) {
        throw new Error(`Failed to count users: ${userError.message}`);
      }

      const { data: tenant, error: tenantError } = await supabaseServer
        .from('tenants')
        .select('max_users')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        throw new Error(`Failed to get tenant limits: ${tenantError.message}`);
      }

      const current = userCount || 0;
      const limit = tenant.max_users || 10;

      return {
        allowed: current < limit,
        current,
        limit,
        remaining: Math.max(0, limit - current),
      };
    }

    return { allowed: true, current: 0, limit: 999999, remaining: 999999 };
  } catch (error) {
    console.error('Error checking plan limits:', error);
    return { allowed: false, current: 0, limit: 0, remaining: 0 };
  }
};
