import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LoginRequestBody;

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const email = body.email.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha não podem estar vazios' },
        { status: 400 }
      );
    }

    // Use Supabase Auth to sign in
    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      await createAuditLog({
        action: 'failed_login',
        new_data: { email, reason: authError?.message || 'authentication_failed' },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        user_agent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Fetch user from database with tenant info
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select(`
        id,
        tenant_id,
        name,
        email,
        role,
        is_active,
        player_id,
        tenants!users_tenant_id_fkey (
          name,
          status,
          plan
        )
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      await createAuditLog({
        action: 'failed_login',
        new_data: { email, reason: 'user_not_found_in_database' },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        user_agent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    const tenant = Array.isArray(user.tenants) ? user.tenants[0] : user.tenants;

    if (tenant?.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Conta pendente de aprovação ou suspensa' },
        { status: 403 }
      );
    }

    // Update last login
    await supabaseServer
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'successful_login',
      new_data: { supabase_user_id: authData.user.id },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Login realizado com sucesso',
        token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          tenant_name: tenant?.name,
          tenant_plan: tenant?.plan,
          player_id: user.player_id,
        },
        expires_in: authData.session.expires_in,
      },
    });
  } catch (error) {
    console.error('Error in login endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
