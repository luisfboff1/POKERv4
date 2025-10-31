import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/users
 * Get all users and players (super_admin) or tenant users/players (admin)
 * Returns both registered users and players without accounts
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[/api/users] Starting request...');
    const user = await requireAuth(req);
    console.log('[/api/users] Authenticated user:', { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id });

    // Super admin can see all users and players
    if (user.role === 'super_admin') {
      console.log('[/api/users] Super admin mode - fetching all players');
      // Get all players first
      const { data: players, error: playersError} = await supabaseServer
        .from('players')
        .select('id, name, nickname, user_id, tenant_id')
        .order('name', { ascending: true });

      if (playersError) {
        console.error('[/api/users] Error fetching players:', {
          message: playersError.message,
          details: playersError.details,
          hint: playersError.hint,
          code: playersError.code,
        });
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar usuários' },
          { status: 500 }
        );
      }
      console.log(`[/api/users] Fetched ${players?.length || 0} players`);

      // Get all users
      console.log('[/api/users] Fetching users...');
      const { data: users, error: usersError } = await supabaseServer
        .from('users')
        .select('id, name, email, role, is_active, current_tenant_id')
        .order('name', { ascending: true });

      if (usersError) {
        console.error('[/api/users] Error fetching users:', {
          message: usersError.message,
          details: usersError.details,
          hint: usersError.hint,
          code: usersError.code,
        });
      }
      console.log(`[/api/users] Fetched ${users?.length || 0} users`);

      // Create a map of users by ID for quick lookup
      const usersMap = new Map((users || []).map(u => [u.id, u]));

      // Combine players with their user info (if they have an account)
      const combined = await Promise.all(
        (players || []).map(async (player) => {
          const userAccount = player.user_id ? usersMap.get(player.user_id) : null;
          
          try {
            // Get tenant info if user has an account
            let userTenants = [];
            if (userAccount?.email) {
              const { data: tenants, error: rpcError } = await supabaseServer.rpc('get_user_tenants', {
                user_email: userAccount.email
              });
              if (!rpcError && tenants) {
                userTenants = tenants;
              }
            }

            return {
              id: player.id,
              user_id: player.user_id,
              name: player.name,
              nickname: player.nickname,
              email: userAccount?.email || '',
              role: userAccount?.role || 'player',
              has_account: !!player.user_id,
              status: userAccount?.is_active ? 'active' : 'inactive',
              team_id: player.tenant_id || userAccount?.current_tenant_id,
              tenants: userTenants,
            };
          } catch (err) {
            console.error(`Exception processing player ${player.id}:`, err);
            return {
              id: player.id,
              user_id: player.user_id,
              name: player.name,
              nickname: player.nickname,
              email: '',
              role: 'player',
              has_account: !!player.user_id,
              status: 'inactive',
              team_id: player.tenant_id,
              tenants: [],
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: combined,
      });
    }

    // Tenant admin can only see players from their tenant
    if (user.role === 'admin') {
      // Get all players from this tenant
      const { data: players, error: playersError } = await supabaseServer
        .from('players')
        .select('id, name, nickname, user_id, tenant_id')
        .eq('tenant_id', user.tenant_id)
        .order('name', { ascending: true });

      if (playersError) {
        console.error('Error fetching tenant players:', playersError);
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar usuários do grupo' },
          { status: 500 }
        );
      }

      // Fetch user details for each player that has a user account
      const formattedUsers = await Promise.all(
        (players || []).map(async (player) => {
          try {
            let userData = null;
            if (player.user_id) {
              const { data, error: userError } = await supabaseServer
                .from('users')
                .select('id, name, email, role, is_active')
                .eq('id', player.user_id)
                .single();

              if (userError) {
                console.error(`Error fetching user details for user_id ${player.user_id}:`, userError);
              } else {
                userData = data;
              }
            }

            return {
              id: player.id,
              user_id: player.user_id,
              name: player.name,
              nickname: player.nickname,
              email: userData?.email || '',
              role: userData?.role || 'player',
              has_account: !!player.user_id,
              global_role: userData?.role,
              status: userData?.is_active ? 'active' : 'inactive',
              team_id: user.tenant_id,
              tenants: [{ tenant_id: user.tenant_id, role: 'player' }],
            };
          } catch (err) {
            console.error(`Exception fetching user details for player ${player.id}:`, err);
            return {
              id: player.id,
              user_id: player.user_id,
              name: player.name,
              nickname: player.nickname,
              email: '',
              role: 'player',
              has_account: !!player.user_id,
              global_role: undefined,
              status: 'inactive',
              team_id: user.tenant_id,
              tenants: [{ tenant_id: user.tenant_id, role: 'player' }],
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
    console.error('[/api/users] EXCEPTION in GET /api/users:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}
