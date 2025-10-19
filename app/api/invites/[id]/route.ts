import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { supabaseServer } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/invites/[id] - Cancel/delete an invite
 */
export async function DELETE(
  req: NextRequest,
  props: RouteParams
) {
  try {
    const user = await requireAuth(req);

    // Only admins can delete invites
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem cancelar convites' },
        { status: 403 }
      );
    }

    const params = await props.params;
    const inviteId = parseInt(params.id);

    if (isNaN(inviteId)) {
      return NextResponse.json(
        { success: false, error: 'ID de convite inválido' },
        { status: 400 }
      );
    }

    // Update invite status to cancelled
    const { error } = await supabaseServer
      .from('user_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId)
      .eq('tenant_id', user.tenant_id); // Ensure user can only cancel from their tenant

    if (error) {
      throw new Error(`Failed to cancel invite: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Convite cancelado com sucesso',
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/invites/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
