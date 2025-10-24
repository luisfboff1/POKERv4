import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

interface UpdatePlayerBody {
  name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const resolvedParams = await params;
    const playerId = parseInt(resolvedParams.id);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const { data: player, error } = await supabaseServer
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Jogador não encontrado' },
          { status: 404 }
        );
      }
      throw new Error(`Failed to fetch player: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: player.id,
        name: player.name,
        nickname: player.nickname || '',
        email: player.email || '',
        phone: player.phone || '',
        notes: player.notes || '',
        role: 'player',
        status: player.is_active ? 'active' : 'inactive',
        team_id: player.tenant_id,
        user_id: player.user_id || null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/players/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const resolvedParams = await params;
    const playerId = parseInt(resolvedParams.id);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await req.json() as UpdatePlayerBody;

    // Validar dados
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o jogador existe e pertence ao tenant do usuário
    const { data: _existingPlayer, error: checkError } = await supabaseServer
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Jogador não encontrado' },
          { status: 404 }
        );
      }
      throw new Error(`Failed to check player: ${checkError.message}`);
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.nickname !== undefined) updateData.nickname = body.nickname.trim() || null;
    if (body.email !== undefined) updateData.email = body.email.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone.trim() || null;
    if (body.notes !== undefined) updateData.notes = body.notes.trim() || null;
    if (body.status !== undefined) updateData.is_active = body.status === 'active';

    // Atualizar jogador
    const { data: updatedPlayer, error: updateError } = await supabaseServer
      .from('players')
      .update(updateData)
      .eq('id', playerId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update player: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPlayer.id,
        name: updatedPlayer.name,
        nickname: updatedPlayer.nickname || '',
        email: updatedPlayer.email || '',
        phone: updatedPlayer.phone || '',
        notes: updatedPlayer.notes || '',
        role: 'player',
        status: updatedPlayer.is_active ? 'active' : 'inactive',
        team_id: updatedPlayer.tenant_id,
        user_id: updatedPlayer.user_id || null,
      },
      message: 'Jogador atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error in PUT /api/players/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const resolvedParams = await params;
    const playerId = parseInt(resolvedParams.id);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar se o jogador existe e pertence ao tenant do usuário
    const { data: _existingPlayer, error: checkError } = await supabaseServer
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Jogador não encontrado' },
          { status: 404 }
        );
      }
      throw new Error(`Failed to check player: ${checkError.message}`);
    }

    // Verificar se o jogador está vinculado a sessões
    // No Supabase, os jogadores estão armazenados em JSONB na coluna players_data
    const { data: sessionsWithPlayer, error: sessionsError } = await supabaseServer
      .from('sessions')
      .select('id, players_data')
      .eq('tenant_id', user.tenant_id)
      .not('players_data', 'is', null)
      .limit(1000); // Precisamos buscar mais para verificar no JSONB

    if (sessionsError) {
      throw new Error(`Failed to check sessions: ${sessionsError.message}`);
    }

    // Verificar se o player_id está presente em algum players_data
    const hasPlayerInSessions = sessionsWithPlayer?.some((session: { id: number; players_data?: unknown }) => {
      if (!session.players_data || !Array.isArray(session.players_data)) return false;
      return session.players_data.some((player: unknown) => {
        if (typeof player !== 'object' || player === null) return false;
        const p = player as { id?: number; player_id?: number };
        return p.id === playerId || p.player_id === playerId;
      });
    });

    // Se o jogador tiver sessões, apenas marcar como inativo
    if (hasPlayerInSessions) {
      const { error: updateError } = await supabaseServer
        .from('players')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', playerId);

      if (updateError) {
        throw new Error(`Failed to deactivate player: ${updateError.message}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Jogador desativado com sucesso (possui histórico de sessões)',
      });
    }

    // Se não tiver sessões, pode excluir permanentemente
    const { error: deleteError } = await supabaseServer
      .from('players')
      .delete()
      .eq('id', playerId);

    if (deleteError) {
      throw new Error(`Failed to delete player: ${deleteError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Jogador excluído com sucesso',
    });
  } catch (error) {
    console.error('Error in DELETE /api/players/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
