import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

// GET /api/sessions/backfill-periods
// Returns sessions without ranking_period_id and suggests matching periods
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem acessar esta funcionalidade' },
        { status: 403 }
      );
    }

    // Fetch sessions without ranking_period_id
    const { data: sessions, error: sessionsError } = await supabaseServer
      .from('sessions')
      .select('id, date, location, status, players_data, ranking_period_id')
      .eq('tenant_id', user.tenant_id)
      .is('ranking_period_id', null)
      .order('date', { ascending: false });

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Fetch all periods for this tenant
    const { data: periods, error: periodsError } = await supabaseServer
      .from('ranking_periods')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('start_date', { ascending: false });

    if (periodsError) {
      throw new Error(`Failed to fetch periods: ${periodsError.message}`);
    }

    // Match sessions to periods
    const suggestions = sessions.map(session => {
      const matchingPeriod = periods.find(period => {
        const sessionDate = new Date(session.date);
        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      return {
        session_id: session.id,
        session_date: session.date,
        session_location: session.location,
        session_status: session.status,
        player_count: Array.isArray(session.players_data) ? session.players_data.length : 0,
        suggested_period_id: matchingPeriod?.id || null,
        suggested_period_name: matchingPeriod?.name || null,
        suggested_period_range: matchingPeriod
          ? `${matchingPeriod.start_date} - ${matchingPeriod.end_date}`
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        total_unassigned: sessions.length,
        suggestions,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sessions/backfill-periods:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/sessions/backfill-periods
// Applies period assignments to sessions
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem executar esta ação' },
        { status: 403 }
      );
    }

    const body = await req.json() as { assignments: { session_id: number; period_id: number | null }[] };

    if (!body.assignments || !Array.isArray(body.assignments)) {
      return NextResponse.json(
        { success: false, error: 'Formato inválido. Esperado: { assignments: [...] }' },
        { status: 400 }
      );
    }

    // Apply assignments
    const updatePromises = body.assignments.map(({ session_id, period_id }) =>
      supabaseServer
        .from('sessions')
        .update({ ranking_period_id: period_id })
        .eq('id', session_id)
        .eq('tenant_id', user.tenant_id) // Security: ensure session belongs to tenant
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors updating sessions:', errors);
      return NextResponse.json(
        {
          success: false,
          error: `Falha ao atualizar ${errors.length} sessões`,
          details: errors.map(e => e.error?.message)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${body.assignments.length} sessões atualizadas com sucesso`,
      data: { updated_count: body.assignments.length },
    });
  } catch (error) {
    console.error('Error in POST /api/sessions/backfill-periods:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
