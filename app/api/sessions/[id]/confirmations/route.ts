import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/sessions/[id]/confirmations
 * Get confirmations for a session
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'ID de sessão inválido' },
        { status: 400 }
      );
    }

    // Verify session belongs to user's tenant
    const { data: session, error: sessionError } = await supabaseServer
      .from('poker.sessions')
      .select('id, tenant_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    if (session.tenant_id !== user.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Get confirmations first
    const { data: confirmations, error } = await supabaseServer
      .from('poker.session_confirmations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching confirmations:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar confirmações' },
        { status: 500 }
      );
    }

    // Define type for raw confirmation data
    interface RawConfirmation {
      id: number;
      session_id: number;
      player_id: number;
      confirmed: boolean;
      confirmed_at: string | null;
      created_at: string;
    }

    // Get player information for each confirmation
    const formattedConfirmations = await Promise.all(
      (confirmations || []).map(async (c: RawConfirmation) => {
        const { data: player } = await supabaseServer
          .from('poker.players')
          .select('id, name, nickname')
          .eq('id', c.player_id)
          .single();

        return {
          id: c.id,
          session_id: c.session_id,
          player_id: c.player_id,
          player_name: player?.name || 'Desconhecido',
          player_nickname: player?.nickname,
          confirmed: c.confirmed,
          confirmed_at: c.confirmed_at,
          created_at: c.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedConfirmations,
    });
  } catch (error) {
    console.error('Error in GET /api/sessions/[id]/confirmations:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions/[id]/confirmations
 * Confirm player presence (by admin or player themselves)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'ID de sessão inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { player_id, confirmed } = body;

    if (player_id === undefined) {
      return NextResponse.json(
        { success: false, error: 'player_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verify session belongs to user's tenant
    const { data: session, error: sessionError } = await supabaseServer
      .from('poker.sessions')
      .select('id, tenant_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    if (session.tenant_id !== user.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Check if player belongs to tenant
    const { data: player, error: playerError } = await supabaseServer
      .from('poker.players')
      .select('id, tenant_id')
      .eq('id', player_id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { success: false, error: 'Jogador não encontrado' },
        { status: 404 }
      );
    }

    if (player.tenant_id !== user.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Jogador não pertence ao seu grupo' },
        { status: 403 }
      );
    }

    // Upsert confirmation (create or update)
    const confirmationData = {
      session_id: sessionId,
      player_id: player_id,
      confirmed: confirmed === true, // Explicit boolean check
      confirmed_at: confirmed === true ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: confirmation, error: confirmError } = await supabaseServer
      .from('poker.session_confirmations')
      .upsert([confirmationData], {
        onConflict: 'session_id,player_id',
      })
      .select()
      .single();

    if (confirmError) {
      console.error('Error updating confirmation:', confirmError);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar confirmação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: confirmation,
      message: confirmed === true ? 'Presença confirmada' : 'Confirmação cancelada',
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/[id]/confirmations:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[id]/confirmations
 * Remove a confirmation entry
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'ID de sessão inválido' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('player_id');

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'player_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verify session belongs to user's tenant (admin only)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem remover confirmações' },
        { status: 403 }
      );
    }

    const { data: session, error: sessionError } = await supabaseServer
      .from('poker.sessions')
      .select('id, tenant_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    if (session.tenant_id !== user.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabaseServer
      .from('poker.session_confirmations')
      .delete()
      .eq('session_id', sessionId)
      .eq('player_id', parseInt(playerId));

    if (deleteError) {
      console.error('Error deleting confirmation:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Erro ao remover confirmação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmação removida com sucesso',
    });
  } catch (error) {
    console.error('Error in DELETE /api/sessions/[id]/confirmations:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
