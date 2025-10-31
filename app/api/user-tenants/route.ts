import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';
import type { UserTenant } from '@/lib/types';

/**
 * GET /api/user-tenants
 * Get all tenants for the authenticated user
 */
export async function GET(req: NextRequest) {
  const authData = await requireAuth(req);
  if (!authData.authenticated) {
    return NextResponse.json(authData.response, { status: 401 });
  }

  try {
    // Get user's tenants using the helper function
    const { data: userTenants, error } = await supabaseServer.rpc('get_user_tenants', {
      user_email: authData.user.email
    });

    if (error) {
      console.error('Error fetching user tenants:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar home games do usuário' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: userTenants as UserTenant[] 
    });
  } catch (error) {
    console.error('Error in GET /api/user-tenants:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-tenants
 * Switch user's active tenant
 * Body: { tenant_id: number }
 */
export async function POST(req: NextRequest) {
  const authData = await requireAuth(req);
  if (!authData.authenticated) {
    return NextResponse.json(authData.response, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenant_id } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'tenant_id é obrigatório' },
        { status: 400 }
      );
    }

    // Use the helper function to switch tenant
    const { data: success, error } = await supabaseServer.rpc('switch_user_tenant', {
      user_email: authData.user.email,
      new_tenant_id: tenant_id
    });

    if (error || !success) {
      console.error('Error switching tenant:', error);
      return NextResponse.json(
        { success: false, error: 'Você não tem acesso a este home game' },
        { status: 403 }
      );
    }

    // Get updated user data
    const { data: userData, error: userError } = await supabaseServer
      .from('poker.users')
      .select(`
        *,
        tenants:poker.tenants!poker_users_current_tenant_id_fkey(name)
      `)
      .eq('email', authData.user.email)
      .single();

    if (userError) {
      console.error('Error fetching updated user:', userError);
    }

    return NextResponse.json({ 
      success: true, 
      data: userData,
      message: 'Home game alterado com sucesso' 
    });
  } catch (error) {
    console.error('Error in POST /api/user-tenants:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
