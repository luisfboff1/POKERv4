import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * DELETE /api/tenants/[id]
 * Delete a tenant (Super Admin only)
 * 
 * CASCADING DELETES:
 * - All players associated with this tenant
 * - All sessions associated with this tenant
 * - All user_tenants entries for this tenant
 * - All player_transfers associated with sessions from this tenant
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const tenantId = parseInt(params.id);

    console.log('[DELETE /api/tenants] Request:', { 
      tenantId, 
      user: user.email, 
      role: user.role 
    });

    // Only super admins can delete tenants
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas super administradores podem excluir grupos' },
        { status: 403 }
      );
    }

    // Check if tenant exists
    const { data: tenant, error: tenantError } = await supabaseServer
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('[DELETE /api/tenants] Tenant not found:', tenantId);
      return NextResponse.json(
        { success: false, error: 'Grupo não encontrado' },
        { status: 404 }
      );
    }

    console.log('[DELETE /api/tenants] Deleting tenant:', tenant.name);

    // SECURITY: Prevent deletion of users' current tenant
    // Check if any users are currently using this tenant
    const { data: usersInTenant, error: usersError } = await supabaseServer
      .from('users')
      .select('id, email')
      .eq('current_tenant_id', tenantId);

    if (usersError) {
      console.error('[DELETE /api/tenants] Error checking users:', usersError);
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar usuários do grupo' },
        { status: 500 }
      );
    }

    if (usersInTenant && usersInTenant.length > 0) {
      console.log('[DELETE /api/tenants] Cannot delete - users currently using this tenant:', usersInTenant.length);
      return NextResponse.json(
        { 
          success: false, 
          error: `Não é possível excluir. ${usersInTenant.length} usuário(s) estão usando este grupo. Peça aos usuários para trocar de grupo primeiro.` 
        },
        { status: 400 }
      );
    }

    // CASCADE DELETE ORDER (to respect foreign key constraints):
    // 1. Delete player_transfers (references sessions)
    // 2. Delete sessions (references tenant_id and player_id)
    // 3. Delete user_tenants (references tenant_id and player_id)
    // 4. Delete players (references tenant_id)
    // 5. Delete tenant

    console.log('[DELETE /api/tenants] Step 1: Getting sessions for tenant:', tenantId);
    
    // Get all session IDs for this tenant
    const { data: sessions, error: sessionsError } = await supabaseServer
      .from('sessions')
      .select('id')
      .eq('tenant_id', tenantId);

    if (sessionsError) {
      console.error('[DELETE /api/tenants] Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar sessões do grupo' },
        { status: 500 }
      );
    }

    const sessionIds = (sessions || []).map(s => s.id);
    console.log('[DELETE /api/tenants] Found sessions:', sessionIds.length);

    // Step 1: Delete player_transfers for these sessions
    if (sessionIds.length > 0) {
      console.log('[DELETE /api/tenants] Step 1: Deleting player_transfers...');
      const { error: transfersError } = await supabaseServer
        .from('player_transfers')
        .delete()
        .in('session_id', sessionIds);

      if (transfersError) {
        console.error('[DELETE /api/tenants] Error deleting transfers:', transfersError);
        return NextResponse.json(
          { success: false, error: 'Erro ao excluir transferências' },
          { status: 500 }
        );
      }
    }

    // Step 2: Delete sessions
    console.log('[DELETE /api/tenants] Step 2: Deleting sessions...');
    const { error: sessionsDeleteError } = await supabaseServer
      .from('sessions')
      .delete()
      .eq('tenant_id', tenantId);

    if (sessionsDeleteError) {
      console.error('[DELETE /api/tenants] Error deleting sessions:', sessionsDeleteError);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir sessões do grupo' },
        { status: 500 }
      );
    }

    // Step 3: Delete user_tenants entries
    console.log('[DELETE /api/tenants] Step 3: Deleting user_tenants...');
    const { error: userTenantsError } = await supabaseServer
      .from('user_tenants')
      .delete()
      .eq('tenant_id', tenantId);

    if (userTenantsError) {
      console.error('[DELETE /api/tenants] Error deleting user_tenants:', userTenantsError);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir associações de usuários' },
        { status: 500 }
      );
    }

    // Step 4: Delete players
    console.log('[DELETE /api/tenants] Step 4: Deleting players...');
    const { error: playersError } = await supabaseServer
      .from('players')
      .delete()
      .eq('tenant_id', tenantId);

    if (playersError) {
      console.error('[DELETE /api/tenants] Error deleting players:', playersError);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir jogadores do grupo' },
        { status: 500 }
      );
    }

    // Step 5: Finally, delete the tenant
    console.log('[DELETE /api/tenants] Step 5: Deleting tenant...');
    const { error: tenantDeleteError } = await supabaseServer
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (tenantDeleteError) {
      console.error('[DELETE /api/tenants] Error deleting tenant:', tenantDeleteError);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir grupo' },
        { status: 500 }
      );
    }

    console.log('[DELETE /api/tenants] ✅ Tenant deleted successfully:', tenant.name);

    return NextResponse.json({
      success: true,
      message: `Grupo "${tenant.name}" excluído com sucesso`
    });

  } catch (error) {
    console.error('[DELETE /api/tenants] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao excluir grupo' },
      { status: 500 }
    );
  }
}
