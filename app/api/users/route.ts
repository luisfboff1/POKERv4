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
        (users || []).map(async (u: any) => {
          const { data: userTenants } = await supabaseServer.rpc('get_user_tenants', {
            user_email: u.email
          });

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.is_active ? 'active' : 'inactive',
            team_id: u.current_tenant_id,
            tenants: userTenants || [],
          };
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
        .select(`
          user_id,
          role,
          is_active,
          users:poker.users!poker_user_tenants_user_id_fkey(
            id,
            name,
            email,
            role,
            is_active
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching tenant users:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar usuários do grupo' },
          { status: 500 }
        );
      }

      const formattedUsers = userTenants.map((ut: any) => ({
        id: ut.users.id,
        name: ut.users.name,
        email: ut.users.email,
        role: ut.role, // Role in this specific tenant
        global_role: ut.users.role, // Global role
        status: ut.users.is_active ? 'active' : 'inactive',
        team_id: user.tenant_id,
        tenants: [{ tenant_id: user.tenant_id, role: ut.role }],
      }));

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
