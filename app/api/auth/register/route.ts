import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, company, phone, plan } = body;

    // Validate required fields
    if (!name || !email || !password || !company) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists in our database (which will also check Supabase Auth indirectly)
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create tenant (company/organization) first
    const { data: tenant, error: tenantError } = await supabaseServer
      .from('tenants')
      .insert([{
        name: company,
        email: email,
        phone: phone || null,
        plan: plan || 'basic',
        status: 'active', // Auto-approve for now
        max_users: plan === 'enterprise' ? 100 : plan === 'premium' ? 50 : 10,
        max_sessions_per_month: plan === 'enterprise' ? -1 : plan === 'premium' ? 100 : 50,
        approved_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('Error creating tenant:', tenantError);
      return NextResponse.json(
        { success: false, message: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        full_name: name,
        tenant_id: tenant.id,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      // Rollback: delete the tenant
      await supabaseServer.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json(
        { success: false, message: authError?.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    // Hash password for our database
    const passwordHash = await bcrypt.hash(password, 10);

    // Create player record first (since user will reference it)
    const { data: player, error: playerError } = await supabaseServer
      .from('players')
      .insert([{
        tenant_id: tenant.id,
        name: name,
        nickname: null,
        phone: phone || null,
        is_active: true,
      }])
      .select()
      .single();

    if (playerError || !player) {
      console.error('Error creating player:', playerError);
      // Rollback: delete auth user and tenant
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      await supabaseServer.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json(
        { success: false, message: 'Failed to create player profile' },
        { status: 500 }
      );
    }

    // Create user in our database
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .insert([{
        tenant_id: tenant.id,
        name: name,
        email: email,
        password_hash: passwordHash,
        role: 'admin', // First user of a tenant is admin
        is_active: true,
        player_id: player.id,
      }])
      .select()
      .single();

    if (userError || !user) {
      console.error('Error creating user:', userError);
      // Rollback: delete auth user, player, and tenant
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      await supabaseServer.from('players').delete().eq('id', player.id);
      await supabaseServer.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json(
        { success: false, message: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Link player back to user
    await supabaseServer
      .from('players')
      .update({ user_id: user.id })
      .eq('id', player.id);

    // Create audit log
    await createAuditLog({
      tenant_id: tenant.id,
      user_id: user.id,
      action: 'user_registration',
      new_data: {
        email: email,
        name: name,
        plan: plan || 'basic',
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          user_id: user.id,
          tenant_id: tenant.id,
          email: email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
