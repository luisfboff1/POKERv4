import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';
import type { SessionPlayerData, TransferRecommendation } from '@/lib/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateSessionBody {
  date?: string;
  location?: string;
  players_data?: SessionPlayerData[];
  recommendations?: TransferRecommendation[];
  paid_transfers?: Record<string, boolean>;
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const params = await props.params;
    const sessionId = parseInt(params.id, 10);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const { data: session, error } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    const formattedSession = {
      ...session,
      players_data: session.players_data || [],
      recommendations: session.recommendations || [],
      paid_transfers: session.paid_transfers || {},
    };

    return NextResponse.json({
      success: true,
      data: formattedSession,
    });
  } catch (error) {
    console.error('Error in GET /api/sessions/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const params = await props.params;
    const sessionId = parseInt(params.id, 10);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const { data: existingSession, error: fetchError } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada ou acesso negado' },
        { status: 404 }
      );
    }

    const body = await req.json() as UpdateSessionBody;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.date !== undefined) updateData.date = body.date;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.players_data !== undefined) updateData.players_data = body.players_data;
    if (body.recommendations !== undefined) updateData.recommendations = body.recommendations;
    if (body.paid_transfers !== undefined) updateData.paid_transfers = body.paid_transfers;

    // Check if all payments are completed and update status accordingly
    const playersData = (body.players_data || existingSession.players_data) as SessionPlayerData[];
    const recommendations = (body.recommendations || existingSession.recommendations) as TransferRecommendation[];
    const paidTransfers = (body.paid_transfers || existingSession.paid_transfers) as Record<string, boolean>;

    const newStatus = checkSessionPaymentStatus(playersData, recommendations, paidTransfers);

    if (newStatus !== existingSession.status) {
      updateData.status = newStatus;
    }

    const { error: updateError } = await supabaseServer
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('tenant_id', user.tenant_id);

    if (updateError) {
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    await updatePlayersStats(user.tenant_id);

    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'update_session',
      table_name: 'sessions',
      record_id: sessionId,
      old_data: existingSession as Record<string, unknown>,
      new_data: body as Record<string, unknown>,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: { updated: true },
    });
  } catch (error) {
    console.error('Error in PUT /api/sessions/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const user = await requireAuth(req);
    const params = await props.params;
    const sessionId = parseInt(params.id, 10);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const { data: existingSession, error: fetchError } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada ou acesso negado' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseServer
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('tenant_id', user.tenant_id);

    if (deleteError) {
      throw new Error(`Failed to delete session: ${deleteError.message}`);
    }

    await updatePlayersStats(user.tenant_id);

    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'delete_session',
      table_name: 'sessions',
      record_id: sessionId,
      old_data: existingSession as Record<string, unknown>,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error in DELETE /api/sessions/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

const updatePlayersStats = async (tenantId: number): Promise<void> => {
  try {
    const { data: sessions, error: sessionsError } = await supabaseServer
      .from('sessions')
      .select('players_data')
      .eq('tenant_id', tenantId);

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions for stats: ${sessionsError.message}`);
    }

    const playerStats: Record<
      string,
      { name: string; sessions: number; buyin: number; cashout: number }
    > = {};

    sessions.forEach((session: Record<string, unknown>) => {
      const playersData = session.players_data as SessionPlayerData[];

      if (Array.isArray(playersData)) {
        playersData.forEach((player) => {
          const playerName = player.name;
          const normalizedName = normalizePlayerName(playerName);

          if (!playerStats[normalizedName]) {
            playerStats[normalizedName] = {
              name: playerName,
              sessions: 0,
              buyin: 0,
              cashout: 0,
            };
          }

          playerStats[normalizedName].sessions += 1;
          playerStats[normalizedName].buyin += player.buyin || 0;
          playerStats[normalizedName].cashout += player.cashout || 0;
        });
      }
    });

    const upsertPromises = Object.values(playerStats).map((stats) =>
      supabaseServer.from('players').upsert(
        {
          tenant_id: tenantId,
          name: stats.name,
          total_sessions: stats.sessions,
          total_buyin: stats.buyin,
          total_cashout: stats.cashout,
          total_profit: stats.cashout - stats.buyin,
          is_active: true,
        },
        {
          onConflict: 'tenant_id,name',
        }
      )
    );

    await Promise.all(upsertPromises);
  } catch (error) {
    console.error('Error updating player stats:', error);
  }
};

const normalizePlayerName = (name: string): string => {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

  return normalized;
};

/**
 * Check if all payments are completed and return appropriate status
 */
const checkSessionPaymentStatus = (
  playersData: SessionPlayerData[],
  recommendations: TransferRecommendation[],
  paidTransfers: Record<string, boolean>
): string => {
  // If there are no recommendations, status is completed
  if (!recommendations || recommendations.length === 0) {
    return 'completed';
  }

  // Check if all transfers are paid
  const allTransfersPaid = recommendations.every((rec) => {
    const transferKey = `${rec.from}-${rec.to}`;
    return paidTransfers[transferKey] === true;
  });

  // Check if all jantas are paid (if applicable)
  const allJantasPaid = playersData.every((player) => {
    // If player doesn't need to pay janta, skip
    if (!player.janta_paid && player.janta_paid !== false) {
      return true;
    }
    return player.janta_paid === true;
  });

  // If both transfers and jantas are paid, mark as completed
  if (allTransfersPaid && allJantasPaid) {
    return 'completed';
  }

  // Otherwise, keep as pending
  return 'pending';
};
