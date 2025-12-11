import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';
import type { UpdateRankingPeriodPayload } from '@/lib/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/ranking-periods/[id] - Get a specific ranking period
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const user = await requireAuth(req);
    const params = await context.params;
    const periodId = parseInt(params.id);

    if (isNaN(periodId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const { data: period, error } = await supabaseServer
      .from('ranking_periods')
      .select('*')
      .eq('id', periodId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Período não encontrado' },
          { status: 404 }
        );
      }
      throw new Error(`Failed to fetch ranking period: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: period,
    });
  } catch (error) {
    console.error('Error in GET /api/ranking-periods/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/ranking-periods/[id] - Update a ranking period (admin only)
export async function PUT(req: NextRequest, context: RouteParams) {
  try {
    const user = await requireAuth(req);
    const params = await context.params;
    const periodId = parseInt(params.id);

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem atualizar períodos de ranking' },
        { status: 403 }
      );
    }

    if (isNaN(periodId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await req.json() as UpdateRankingPeriodPayload;

    // Validate date range if both dates are provided
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.end_date);

      if (endDate < startDate) {
        return NextResponse.json(
          { success: false, error: 'Data final deve ser posterior à data inicial' },
          { status: 400 }
        );
      }
    }

    // Check if period exists and belongs to user's tenant
    const { data: existingPeriod, error: fetchError } = await supabaseServer
      .from('ranking_periods')
      .select('*')
      .eq('id', periodId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existingPeriod) {
      return NextResponse.json(
        { success: false, error: 'Período não encontrado' },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being changed
    if (body.name && body.name !== existingPeriod.name) {
      const { data: duplicatePeriod } = await supabaseServer
        .from('ranking_periods')
        .select('id')
        .eq('tenant_id', user.tenant_id)
        .eq('name', body.name)
        .single();

      if (duplicatePeriod) {
        return NextResponse.json(
          { success: false, error: 'Já existe um período com este nome' },
          { status: 400 }
        );
      }
    }

    // Update the period
    const { data: updatedPeriod, error: updateError } = await supabaseServer
      .from('ranking_periods')
      .update({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.start_date !== undefined && { start_date: body.start_date }),
        ...(body.end_date !== undefined && { end_date: body.end_date }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
      })
      .eq('id', periodId)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update ranking period: ${updateError.message}`);
    }

    // Create audit log
    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'update_ranking_period',
      table_name: 'ranking_periods',
      record_id: periodId,
      new_data: body as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      data: updatedPeriod,
      message: 'Período de ranking atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error in PUT /api/ranking-periods/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/ranking-periods/[id] - Delete a ranking period (admin only)
export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const user = await requireAuth(req);
    const params = await context.params;
    const periodId = parseInt(params.id);

    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem excluir períodos de ranking' },
        { status: 403 }
      );
    }

    if (isNaN(periodId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Check if period exists and belongs to user's tenant
    const { data: existingPeriod, error: fetchError } = await supabaseServer
      .from('ranking_periods')
      .select('*')
      .eq('id', periodId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (fetchError || !existingPeriod) {
      return NextResponse.json(
        { success: false, error: 'Período não encontrado' },
        { status: 404 }
      );
    }

    // Delete the period
    const { error: deleteError } = await supabaseServer
      .from('ranking_periods')
      .delete()
      .eq('id', periodId)
      .eq('tenant_id', user.tenant_id);

    if (deleteError) {
      throw new Error(`Failed to delete ranking period: ${deleteError.message}`);
    }

    // Create audit log
    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'delete_ranking_period',
      table_name: 'ranking_periods',
      record_id: periodId,
      old_data: { name: existingPeriod.name },
    });

    return NextResponse.json({
      success: true,
      message: 'Período de ranking excluído com sucesso',
    });
  } catch (error) {
    console.error('Error in DELETE /api/ranking-periods/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
