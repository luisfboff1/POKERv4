import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * PATCH /api/users/[id]/role
 * Update user role (super_admin can change global role, admin can change tenant role)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuário inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { role, tenantId } = body;

    // Validate role
    const validRoles = ['super_admin', 'admin', 'player'];
    const validTenantRoles = ['admin', 'player'];

    if (!role || (!validRoles.includes(role) && !validTenantRoles.includes(role))) {
      return NextResponse.json(
        { success: false, error: 'Role inválido' },
        { status: 400 }
      );
    }

    // Super admin can change global user role
    if (user.role === 'super_admin') {
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Role global inválido' },
          { status: 400 }
        );
      }

      // Update global user role
      const { error: updateError } = await supabaseServer
        .from('users')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user role:', updateError);
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar role do usuário' },
          { status: 500 }
        );
      }

      // If changing to/from super_admin, update user_tenants as well
      if (role === 'super_admin' || role === 'admin') {
        // Get all user's tenants and update their role
        const { data: userTenants } = await supabaseServer
          .from('user_tenants')
          .select('id')
          .eq('user_id', userId);

        if (userTenants && userTenants.length > 0) {
          await supabaseServer
            .from('user_tenants')
            .update({ role: role === 'super_admin' ? 'admin' : role })
            .eq('user_id', userId);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Role atualizado com sucesso',
      });
    }

    // Tenant admin can only change tenant-specific roles for users in their tenant
    if (user.role === 'admin') {
      if (!validTenantRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Role de tenant inválido' },
          { status: 400 }
        );
      }

      const targetTenantId = tenantId || user.tenant_id;

      // Verify admin has access to this tenant
      if (targetTenantId !== user.tenant_id) {
        return NextResponse.json(
          { success: false, error: 'Você não tem permissão para modificar usuários deste grupo' },
          { status: 403 }
        );
      }

      // Update user's role in this specific tenant
      const { error: updateError } = await supabaseServer
        .from('user_tenants')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('tenant_id', targetTenantId);

      if (updateError) {
        console.error('Error updating user tenant role:', updateError);
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar role do usuário no grupo' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Role no grupo atualizado com sucesso',
      });
    }

    // Regular players cannot update roles
    return NextResponse.json(
      { success: false, error: 'Acesso negado' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/users/[id]/role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
