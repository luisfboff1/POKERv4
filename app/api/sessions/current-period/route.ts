import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

// GET /api/sessions/current-period
// Returns the current active period (if exists) for the authenticated user's tenant
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Call the database function to get the current period
    const { data: currentPeriod, error } = await supabaseServer
      .rpc('get_current_period', { p_tenant_id: user.tenant_id })
      .maybeSingle();

    if (error) {
      // No current period found (PGRST116 = no rows returned)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No current active period found',
        });
      }
      throw new Error(`Failed to get current period: ${error.message}`);
    }

    // Return the current period or null
    return NextResponse.json({
      success: true,
      data: currentPeriod,
    });
  } catch (error) {
    console.error('Error in GET /api/sessions/current-period:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
