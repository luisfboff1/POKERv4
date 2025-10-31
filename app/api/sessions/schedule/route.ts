import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/sessions/schedule
 * Schedule a future poker session
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Only admins can schedule sessions
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem agendar sessões' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { scheduled_date, location, max_players, player_ids } = body;

    if (!scheduled_date) {
      return NextResponse.json(
        { success: false, error: 'Data agendada é obrigatória' },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Local é obrigatório' },
        { status: 400 }
      );
    }

    // Validate scheduled date is in the future
    const scheduledDateTime = new Date(scheduled_date);
    if (scheduledDateTime <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'A data agendada deve ser no futuro' },
        { status: 400 }
      );
    }

    // Create the scheduled session
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .insert([
        {
          tenant_id: user.tenant_id,
          created_by: user.id,
          date: scheduledDateTime.toISOString().split('T')[0], // Store as date
          scheduled_date: scheduledDateTime.toISOString(), // Store full timestamp
          location: location,
          status: 'pending',
          max_players: max_players || null,
          players_data: [],
          recommendations: [],
        },
      ])
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating scheduled session:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar sessão agendada' },
        { status: 500 }
      );
    }

    // If player IDs are provided, create confirmation entries for them
    if (player_ids && Array.isArray(player_ids) && player_ids.length > 0) {
      const confirmations = player_ids.map((playerId: number) => ({
        session_id: session.id,
        player_id: playerId,
        confirmed: false,
      }));

      const { error: confirmError } = await supabaseServer
        .from('session_confirmations')
        .insert(confirmations);

      if (confirmError) {
        console.error('Error creating confirmations:', confirmError);
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Sessão agendada com sucesso',
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/schedule:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
