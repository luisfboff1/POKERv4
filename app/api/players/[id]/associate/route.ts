import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';
import bcrypt from 'bcryptjs';

interface AssociateEmailBody {
  email: string;
  password?: string; // Required only if creating a new user
  createAccount?: boolean; // If true, create a new account; if false, link to existing
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const resolvedParams = await params;
    const playerId = parseInt(resolvedParams.id);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await req.json() as AssociateEmailBody;
    const email = body.email?.trim();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Email muito longo' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verify player exists and belongs to user's tenant
    const { data: player, error: playerError } = await supabaseServer
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { success: false, error: 'Jogador não encontrado' },
        { status: 404 }
      );
    }

    // Check if player is already associated with a user
    if (player.user_id) {
      return NextResponse.json(
        { success: false, error: 'Jogador já está associado a uma conta' },
        { status: 400 }
      );
    }

    // Check if email already exists in the system
    const { data: existingUser, error: userCheckError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing user: ${userCheckError.message}`);
    }

    // Case 1: Email exists - link to existing user
    if (existingUser) {
      // Check if user is in the same tenant
      if (existingUser.tenant_id !== user.tenant_id) {
        return NextResponse.json(
          { success: false, error: 'Email pertence a outra organização' },
          { status: 400 }
        );
      }

      // Check if user already has a player associated
      if (existingUser.player_id) {
        return NextResponse.json(
          { success: false, error: 'Email já possui um jogador associado' },
          { status: 400 }
        );
      }

      // Link player to existing user
      const { error: updatePlayerError } = await supabaseServer
        .from('players')
        .update({ user_id: existingUser.id, updated_at: new Date().toISOString() })
        .eq('id', playerId);

      if (updatePlayerError) {
        throw new Error(`Failed to link player to user: ${updatePlayerError.message}`);
      }

      // Update user to reference player
      const { error: updateUserError } = await supabaseServer
        .from('users')
        .update({ player_id: playerId, updated_at: new Date().toISOString() })
        .eq('id', existingUser.id);

      if (updateUserError) {
        throw new Error(`Failed to update user: ${updateUserError.message}`);
      }

      // Create audit log
      await createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action: 'player_linked_to_user',
        new_data: {
          player_id: playerId,
          player_name: player.name,
          user_id: existingUser.id,
          email: email,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        user_agent: req.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({
        success: true,
        message: 'Jogador associado à conta existente com sucesso',
        data: {
          player_id: playerId,
          user_id: existingUser.id,
          email: email,
        },
      });
    }

    // Case 2: Email doesn't exist - create new user account
    if (!body.createAccount) {
      return NextResponse.json(
        { success: false, error: 'Email não encontrado. Deseja criar uma nova conta?', needsConfirmation: true },
        { status: 404 }
      );
    }

    // Validate password for new account
    const password = body.password?.trim();
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: player.name,
        tenant_id: user.tenant_id,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { success: false, error: authError?.message || 'Falha ao criar conta' },
        { status: 500 }
      );
    }

    // Hash password for our database
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in our database
    const { data: newUser, error: newUserError } = await supabaseServer
      .from('users')
      .insert([{
        tenant_id: user.tenant_id,
        name: player.name,
        email: email,
        password_hash: passwordHash,
        role: 'player',
        is_active: true,
        player_id: playerId,
      }])
      .select()
      .single();

    if (newUserError || !newUser) {
      console.error('Error creating user:', newUserError);
      // Rollback: delete auth user
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: 'Falha ao criar conta de usuário' },
        { status: 500 }
      );
    }

    // Link player to new user
    const { error: updatePlayerError } = await supabaseServer
      .from('players')
      .update({ user_id: newUser.id, updated_at: new Date().toISOString() })
      .eq('id', playerId);

    if (updatePlayerError) {
      console.error('Error linking player to user:', updatePlayerError);
      // Rollback: delete user and auth user
      await supabaseServer.from('users').delete().eq('id', newUser.id);
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to link player to new user: ${updatePlayerError.message}`);
    }

    // Create audit log
    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'player_account_created',
      new_data: {
        player_id: playerId,
        player_name: player.name,
        user_id: newUser.id,
        email: email,
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Conta criada e associada ao jogador com sucesso',
      data: {
        player_id: playerId,
        user_id: newUser.id,
        email: email,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/players/[id]/associate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
