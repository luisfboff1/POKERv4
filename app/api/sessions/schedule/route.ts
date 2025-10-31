import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/sessions/schedule
 * Schedule a future poker session
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[/api/sessions/schedule] Starting request...');
    const user = await requireAuth(req);
    console.log('[/api/sessions/schedule] Authenticated user:', { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id });

    // Only admins can schedule sessions
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      console.log('[/api/sessions/schedule] Access denied - user is not admin');
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem agendar sessões' },
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log('[/api/sessions/schedule] Request body:', body);
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
    console.log('[/api/sessions/schedule] Creating session with data:', {
      tenant_id: user.tenant_id,
      created_by: user.id,
      date: scheduledDateTime.toISOString().split('T')[0],
      scheduled_date: scheduledDateTime.toISOString(),
      location,
      max_players: max_players || null,
    });
    
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
      console.error('[/api/sessions/schedule] Error creating scheduled session:', {
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint,
        code: sessionError.code,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao criar sessão agendada' },
        { status: 500 }
      );
    }
    console.log('[/api/sessions/schedule] Session created successfully:', session);

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
    console.error('[/api/sessions/schedule] EXCEPTION in POST /api/sessions/schedule:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    return NextResponse.json(
      { success: false, error: 'Erro ao criar sessão agendada' },
      { status: 500 }
    );
  }
}
