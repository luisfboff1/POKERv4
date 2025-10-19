import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';
import { generateToken, saveUserSession } from '@/lib/auth-helpers';

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

    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select(`
        id,
        tenant_id,
        name,
        email,
        password_hash,
        role,
        is_active,
        last_login,
        player_id,
        tenants (
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
        new_data: { email, reason: 'user_not_found' },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        user_agent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
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

    const isPasswordValid = await compare(password, user.password_hash);

    if (!isPasswordValid) {
      await createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action: 'failed_login',
        new_data: { email, reason: 'wrong_password' },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        user_agent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    await supabaseServer
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const token = await generateToken({
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_name: tenant?.name,
      tenant_plan: tenant?.plan,
      player_id: user.player_id,
    });

    const sessionId = await saveUserSession(
      user.id,
      user.tenant_id,
      token,
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      req.headers.get('user-agent') || undefined
    );

    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'successful_login',
      new_data: { session_id: sessionId },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Login realizado com sucesso',
        token,
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
        expires_in: 24 * 60 * 60,
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
