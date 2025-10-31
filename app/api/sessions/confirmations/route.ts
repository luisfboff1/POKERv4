import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/sessions/confirmations?player_id=X
 * Get session confirmations for a player
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('player_id');

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'player_id é obrigatório' },
        { status: 400 }
      );
    }

    // Get confirmations for the player
    const { data: confirmations, error } = await supabaseServer
      .from('session_confirmations')
      .select(`
        *,
        sessions:poker.sessions!inner(
          id,
          date,
          location,
          scheduled_date,
          max_players,
          status,
          team_id
        )
      `)
      .eq('player_id', parseInt(playerId))
      .eq('sessions.team_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching confirmations:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar confirmações' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: confirmations 
    });
  } catch (error) {
    console.error('Error in GET /api/sessions/confirmations:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 401 }
    );
  }
}

/**
 * POST /api/sessions/confirmations
 * Confirm or update confirmation for a session
 * Body: { session_id: number, player_id: number, confirmed: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    
    const body = await req.json();
    const { session_id, player_id, confirmed } = body;

    if (!session_id || !player_id || confirmed === undefined) {
      return NextResponse.json(
        { success: false, error: 'session_id, player_id e confirmed são obrigatórios' },
        { status: 400 }
      );
    }

    // Verify the session belongs to user's tenant
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .select('team_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    if (session.team_id !== user.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Você não tem acesso a esta sessão' },
        { status: 403 }
      );
    }

    // Upsert confirmation
    const { data: confirmation, error: confirmError } = await supabaseServer
      .from('session_confirmations')
      .upsert({
        session_id,
        player_id,
        confirmed,
        confirmed_at: confirmed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id,player_id'
      })
      .select()
      .single();

    if (confirmError) {
      console.error('Error upserting confirmation:', confirmError);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar confirmação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: confirmation,
      message: confirmed ? 'Presença confirmada!' : 'Confirmação removida' 
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/confirmations:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 401 }
    );
  }
}
