import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/tenants
 * Get all tenants (Super Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    console.log('[GET /api/tenants] User authenticated:', { 
      email: user.email, 
      role: user.role,
      id: user.id 
    });

    // Only super admins can list all tenants
    if (user.role !== 'super_admin') {
      console.log('[GET /api/tenants] Access denied - not super_admin, role is:', user.role);
      return NextResponse.json(
        { success: false, error: 'Apenas super administradores podem listar todos os grupos' },
        { status: 403 }
      );
    }

    console.log('[GET /api/tenants] Fetching tenants for super admin:', user.email);

    // Buscar todos os tenants
    const { data: tenants, error: tenantsError } = await supabaseServer
      .from('tenants')
      .select('*')
      .order('name');

    if (tenantsError) {
      console.error('[GET /api/tenants] Error fetching tenants:', tenantsError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar grupos' },
        { status: 500 }
      );
    }

    // Buscar contagem de usuários para cada tenant
    const tenantsWithCount = await Promise.all(
      (tenants || []).map(async (tenant) => {
        // Buscar usuários ativos deste tenant
        const { data: userTenants, error: countError } = await supabaseServer
          .from('user_tenants')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true);

        if (countError) {
          console.error('[GET /api/tenants] Error counting users for tenant:', tenant.id);
          console.error('[GET /api/tenants] Error details:', JSON.stringify(countError, null, 2));
        } else {
          console.log('[GET /api/tenants] Count for tenant', tenant.id, ':', userTenants?.length || 0);
        }

        return {
          ...tenant,
          users_count: userTenants?.length || 0
        };
      })
    );

    console.log('[GET /api/tenants] Found tenants:', tenantsWithCount?.length || 0);
    console.log('[GET /api/tenants] Sample tenant with count:', tenantsWithCount?.[0]);

    return NextResponse.json({
      success: true,
      data: tenantsWithCount
    });
  } catch (error) {
    console.error('[GET /api/tenants] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 401 }
    );
  }
}

/**
 * POST /api/tenants
 * Create a new tenant (Super Admin only)
 * Body: { name: string, email?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Only super admins can create tenants
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas super administradores podem criar grupos' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email } = body;

    console.log('[POST /api/tenants] Creating tenant:', { name, email, user: user.email });

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Nome do grupo deve ter pelo menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Use provided email or super admin's email as fallback
    const tenantEmail = email || user.email;

    if (!tenantEmail) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório para criar um grupo' },
        { status: 400 }
      );
    }

    // Check if tenant name already exists
    const { data: existingTenant, error: checkError } = await supabaseServer
      .from('tenants')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[POST /api/tenants] Error checking tenant existence:', checkError);
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar nome do grupo' },
        { status: 500 }
      );
    }

    if (existingTenant) {
      console.log('[POST /api/tenants] Tenant name already exists:', name.trim());
      return NextResponse.json(
        { success: false, error: 'Já existe um grupo com este nome' },
        { status: 409 }
      );
    }

    // Note: Email validation removed - users can participate in multiple tenants
    // Each tenant can have its own contact email

    console.log('[POST /api/tenants] Creating tenant with data:', {
      name: name.trim(),
      email: tenantEmail,
      plan: 'basic',
      status: 'active'
    });

    // Create the tenant
    const { data: newTenant, error: createError } = await supabaseServer
      .from('tenants')
      .insert({
        name: name.trim(),
        email: tenantEmail,
        plan: 'basic',
        status: 'active',
        max_users: 10,
        max_sessions_per_month: 50,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('[POST /api/tenants] Error creating tenant:', createError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar grupo' },
        { status: 500 }
      );
    }

    console.log('[POST /api/tenants] Tenant created successfully:', newTenant);

    // Add the creator as admin of the new tenant
    const { error: userTenantError } = await supabaseServer
      .from('user_tenants')
      .insert({
        user_id: user.id,
        tenant_id: newTenant.id,
        role: 'admin',
        is_active: true
      });

    if (userTenantError) {
      console.error('[POST /api/tenants] Error adding user to tenant:', userTenantError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      data: newTenant,
      message: 'Grupo criado com sucesso'
    });
  } catch (error) {
    console.error('[POST /api/tenants] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao processar requisição' },
      { status: 401 }
    );
  }
}