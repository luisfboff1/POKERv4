import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';
import type { SessionPlayerData, TransferRecommendation } from '@/lib/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdatePaymentsBody {
  players_data?: Array<Pick<SessionPlayerData, 'id' | 'name' | 'janta_paid'>>;
  paid_transfers?: Record<string, boolean>;
}

export async function POST(req: NextRequest, props: RouteParams) {
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

    const body = await req.json() as UpdatePaymentsBody;
    const currentPlayers = (existingSession.players_data as SessionPlayerData[]) || [];
    const updates = body.players_data || [];

    const playerIndex: Record<string, number> = {};
    currentPlayers.forEach((player, index) => {
      const key = player.id ? String(player.id) : player.name.toLowerCase();
      playerIndex[key] = index;
    });

    updates.forEach((update) => {
      const key = update.id ? String(update.id) : update.name.toLowerCase();

      if (playerIndex[key] !== undefined) {
        const index = playerIndex[key];

        if (update.janta_paid !== undefined) {
          currentPlayers[index].janta_paid = update.janta_paid;
        }
      }
    });

    const updateData: Record<string, unknown> = {
      players_data: currentPlayers,
      updated_at: new Date().toISOString(),
    };

    if (body.paid_transfers !== undefined) {
      updateData.paid_transfers = body.paid_transfers;
    }

    // Check if all payments are completed and update status accordingly
    const recommendations = (existingSession.recommendations as TransferRecommendation[]) || [];
    const paidTransfers = body.paid_transfers || (existingSession.paid_transfers as Record<string, boolean>) || {};

    const newStatus = checkSessionPaymentStatus(
      currentPlayers,
      recommendations,
      paidTransfers
    );

    if (newStatus !== existingSession.status) {
      updateData.status = newStatus;
    }

    const { error: updateError } = await supabaseServer
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('tenant_id', user.tenant_id);

    if (updateError) {
      throw new Error(`Failed to update payments: ${updateError.message}`);
    }

    await updatePlayersStats(user.tenant_id);

    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'update_session_payments',
      table_name: 'sessions',
      record_id: sessionId,
      old_data: existingSession,
      new_data: { players_data: updates, paid_transfers: body.paid_transfers },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        updated: true,
        players_data: currentPlayers,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/[id]/payments:', error);
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
    const transferKey = `${rec.from}_${rec.to}`;
    return paidTransfers[transferKey] === true;
  });

  // Check if all jantas are paid (if applicable)
  const allJantasPaid = playersData.every((player) => {
    // If player doesn't need to pay janta, skip
    if (player.janta_paid === undefined || player.janta_paid === null) {
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
