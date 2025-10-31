import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/users
 * Get all users (super_admin) or tenant users (admin)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Super admin can see all users
    if (user.role === 'super_admin') {
      const { data: users, error } = await supabaseServer
        .from('poker.users')
        .select(`
          id,
          name,
          email,
          role,
          is_active,
          current_tenant_id
        `)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar usuários' },
          { status: 500 }
        );
      }

      // Get user_tenants for each user to show all groups they belong to
      const usersWithTenants = await Promise.all(
        (users || []).map(async (u) => {
          try {
            const { data: userTenants, error: rpcError } = await supabaseServer.rpc('get_user_tenants', {
              user_email: u.email
            });

            if (rpcError) {
              console.error(`Error fetching tenants for user ${u.email}:`, rpcError);
            }

            return {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              status: u.is_active ? 'active' : 'inactive',
              team_id: u.current_tenant_id,
              tenants: userTenants || [],
            };
          } catch (err) {
            console.error(`Exception fetching tenants for user ${u.email}:`, err);
            return {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              status: u.is_active ? 'active' : 'inactive',
              team_id: u.current_tenant_id,
              tenants: [],
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: usersWithTenants,
      });
    }

    // Tenant admin can only see users from their tenant
    if (user.role === 'admin') {
      const { data: userTenants, error } = await supabaseServer
        .from('poker.user_tenants')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching tenant users:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar usuários do grupo' },
          { status: 500 }
        );
      }

      // Fetch user details for each user_tenant
      const formattedUsers = await Promise.all(
        (userTenants || []).map(async (ut) => {
          try {
            const { data: userData, error: userError } = await supabaseServer
              .from('poker.users')
              .select('id, name, email, role, is_active')
              .eq('id', ut.user_id)
              .single();

            if (userError) {
              console.error(`Error fetching user details for user_id ${ut.user_id}:`, userError);
            }

            return {
              id: userData?.id || ut.user_id,
              name: userData?.name || 'Desconhecido',
              email: userData?.email || '',
              role: ut.role, // Role in this specific tenant
              global_role: userData?.role, // Global role
              status: userData?.is_active ? 'active' : 'inactive',
              team_id: user.tenant_id,
              tenants: [{ tenant_id: user.tenant_id, role: ut.role }],
            };
          } catch (err) {
            console.error(`Exception fetching user details for user_id ${ut.user_id}:`, err);
            return {
              id: ut.user_id,
              name: 'Desconhecido',
              email: '',
              role: ut.role,
              global_role: undefined,
              status: 'inactive',
              team_id: user.tenant_id,
              tenants: [{ tenant_id: user.tenant_id, role: ut.role }],
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: formattedUsers,
      });
    }

    // Regular players cannot access this endpoint
    return NextResponse.json(
      { success: false, error: 'Acesso negado' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 401 }
    );
  }
}
