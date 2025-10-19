import { SignJWT, jwtVerify } from 'jose';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { supabaseServer } from './supabaseServer';

const JWT_SECRET = process.env.JWT_SECRET || 'poker_jwt_secret_2025_super_secure_key_luisfboff_production';
const JWT_EXPIRY = '24h';

interface JWTPayload {
  user_id: number;
  tenant_id: number;
  email: string;
  name: string;
  role: string;
  tenant_name?: string;
  tenant_plan?: string;
  player_id?: number;
  iat?: number;
  exp?: number;
  iss?: string;
}

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

const encodeSecret = () => new TextEncoder().encode(JWT_SECRET);

export const generateToken = async (userData: {
  id: number;
  tenant_id: number;
  email: string;
  name: string;
  role: string;
  tenant_name?: string;
  tenant_plan?: string;
  player_id?: number;
}): Promise<string> => {
  const token = await new SignJWT({
    user_id: userData.id,
    tenant_id: userData.tenant_id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    tenant_name: userData.tenant_name || '',
    tenant_plan: userData.tenant_plan || 'basic',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer('poker_saas_system')
    .setExpirationTime(JWT_EXPIRY)
    .sign(encodeSecret());

  return token;
};

export const validateToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const cleanToken = token.replace('Bearer ', '');
    const { payload } = await jwtVerify(cleanToken, encodeSecret());

    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
};

export const getTokenFromHeaders = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  return authHeader.replace('Bearer ', '');
};

export const getTokenFromHeadersServerComponent = async (): Promise<string | null> => {
  const headersList = await headers();
  const authHeader = headersList.get('authorization') || headersList.get('Authorization');

  if (!authHeader) {
    return null;
  }

  return authHeader.replace('Bearer ', '');
};

export const requireAuth = async (req: NextRequest): Promise<AuthUser> => {
  const token = getTokenFromHeaders(req);

  if (!token) {
    throw new Error('Token de autenticação necessário');
  }

  const payload = await validateToken(token);

  if (!payload) {
    throw new Error('Token inválido ou expirado');
  }

  const isTokenValid = await checkTokenInDatabase(token);

  if (!isTokenValid) {
    throw new Error('Token foi invalidado');
  }

  const userWithTenant = await fetchUserWithTenant(payload.user_id);

  if (!userWithTenant) {
    throw new Error('Usuário não encontrado ou inativo');
  }

  if (userWithTenant.tenant_status !== 'active') {
    throw new Error('Tenant inativo ou pendente de aprovação');
  }

  return userWithTenant;
};

const checkTokenInDatabase = async (token: string): Promise<boolean> => {
  try {
    const tokenHash = await hashToken(token);
    const currentTime = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('user_sessions')
      .select('id')
      .eq('session_token', tokenHash)
      .gt('expires_at', currentTime)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking token in database:', error);
    return false;
  }
};

const fetchUserWithTenant = async (userId: number): Promise<AuthUser | null> => {
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
      .eq('id', userId)
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
    console.error('Error fetching user with tenant:', error);
    return null;
  }
};

export const saveUserSession = async (
  userId: number,
  tenantId: number,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<number> => {
  try {
    const tokenHash = await hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabaseServer
      .from('user_sessions')
      .insert([
        {
          user_id: userId,
          tenant_id: tenantId,
          session_token: tokenHash,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      ])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save session: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error saving user session:', error);
    throw error;
  }
};

export const invalidateSession = async (token: string): Promise<boolean> => {
  try {
    const tokenHash = await hashToken(token);

    const { error } = await supabaseServer
      .from('user_sessions')
      .delete()
      .eq('session_token', tokenHash);

    if (error) {
      throw new Error(`Failed to invalidate session: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
};

const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

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
