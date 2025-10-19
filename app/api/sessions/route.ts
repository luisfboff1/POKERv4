import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkPlanLimits } from '@/lib/auth-helpers';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';
import type { SessionPlayerData, TransferRecommendation } from '@/lib/types';

interface CreateSessionBody {
  date: string;
  location?: string;
  players_data?: SessionPlayerData[];
  recommendations?: TransferRecommendation[];
  paid_transfers?: Record<string, boolean>;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { data: sessions, error } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('date', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    const formattedSessions = sessions.map((session: Record<string, unknown>) => ({
      ...session,
      players_data: session.players_data || [],
      recommendations: session.recommendations || [],
      paid_transfers: session.paid_transfers || {},
    }));

    return NextResponse.json({
      success: true,
      data: formattedSessions,
    });
  } catch (error) {
    console.error('Error in GET /api/sessions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json() as CreateSessionBody;

    const limits = await checkPlanLimits(user.tenant_id, 'sessions_monthly');

    if (!limits.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Limite de sessões mensais atingido (${limits.limit}). Upgrade seu plano para continuar.`,
        },
        { status: 403 }
      );
    }

    const sessionDate = body.date || new Date().toISOString().split('T')[0];
    const location = body.location || 'Local não informado';
    const playersData = body.players_data || [];
    const recommendations = body.recommendations || [];
    const paidTransfers = body.paid_transfers || {};

    const { data: newSession, error: insertError } = await supabaseServer
      .from('sessions')
      .insert([
        {
          tenant_id: user.tenant_id,
          created_by: user.id,
          date: sessionDate,
          location,
          players_data: playersData,
          recommendations,
          paid_transfers: paidTransfers,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create session: ${insertError.message}`);
    }

    await updatePlayersStats(user.tenant_id);

    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'create_session',
      table_name: 'sessions',
      record_id: newSession.id,
      new_data: body as unknown as Record<string, unknown>,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newSession.id,
        limits,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/sessions:', error);
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

    const upsertPromises = Object.values(playerStats).map((stats) => {
      const normalizedName = normalizePlayerName(stats.name);

      return supabaseServer
        .from('players')
        .upsert(
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
        );
    });

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
