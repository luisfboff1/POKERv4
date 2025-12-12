import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';
import type { CreateRankingPeriodPayload } from '@/lib/types';

// GET /api/ranking-periods - List all ranking periods for the user's tenant
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { data: periods, error } = await supabaseServer
      .from('ranking_periods')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('start_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ranking periods: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: periods || [],
    });
  } catch (error) {
    console.error('Error in GET /api/ranking-periods:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/ranking-periods - Create a new ranking period (admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem criar períodos de ranking' },
        { status: 403 }
      );
    }

    const body = await req.json() as CreateRankingPeriodPayload;

    // Validate required fields
    if (!body.name || !body.start_date || !body.end_date) {
      return NextResponse.json(
        { success: false, error: 'Nome, data inicial e data final são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate date range
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'Data final deve ser posterior à data inicial' },
        { status: 400 }
      );
    }

    // Check for overlapping periods
    const { data: overlappingPeriods } = await supabaseServer
      .from('ranking_periods')
      .select('id, name, start_date, end_date')
      .eq('tenant_id', user.tenant_id)
      .or(`and(start_date.lte.${body.end_date},end_date.gte.${body.start_date})`);

    if (overlappingPeriods && overlappingPeriods.length > 0) {
      const conflict = overlappingPeriods[0];
      return NextResponse.json(
        {
          success: false,
          error: `Período se sobrepõe a "${conflict.name}" (${new Date(conflict.start_date).toLocaleDateString('pt-BR')} - ${new Date(conflict.end_date).toLocaleDateString('pt-BR')})`
        },
        { status: 400 }
      );
    }

    // Check for duplicate name in same tenant
    const { data: existingPeriod } = await supabaseServer
      .from('ranking_periods')
      .select('id')
      .eq('tenant_id', user.tenant_id)
      .eq('name', body.name)
      .single();

    if (existingPeriod) {
      return NextResponse.json(
        { success: false, error: 'Já existe um período com este nome' },
        { status: 400 }
      );
    }

    // Create the period
    const { data: newPeriod, error: insertError } = await supabaseServer
      .from('ranking_periods')
      .insert([
        {
          tenant_id: user.tenant_id,
          name: body.name,
          description: body.description || null,
          start_date: body.start_date,
          end_date: body.end_date,
          is_active: body.is_active !== undefined ? body.is_active : true,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      throw new Error(`Failed to create ranking period: ${insertError.message}${insertError.hint ? ` (Hint: ${insertError.hint})` : ''}`);
    }

    // Create audit log
    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'create_ranking_period',
      table_name: 'ranking_periods',
      record_id: newPeriod.id,
      new_data: { name: body.name, start_date: body.start_date, end_date: body.end_date },
    });

    return NextResponse.json({
      success: true,
      data: newPeriod,
      message: 'Período de ranking criado com sucesso',
    });
  } catch (error) {
    console.error('Error in POST /api/ranking-periods:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
