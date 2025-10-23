import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Hash token for secure storage
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * POST /api/invites/accept - Accept invitation and create account
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, name } = body;

    if (!token || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Token, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Hash the provided token to match against stored hash
    const tokenHash = await hashToken(token);

    // Find invite by hashed token
    const { data: invite, error: inviteError } = await supabaseServer
      .from('user_invites')
      .select('*')
      .eq('token', tokenHash)
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json(
        { success: false, error: 'Convite inválido ou expirado' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      await supabaseServer
        .from('user_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);

      return NextResponse.json(
        { success: false, error: 'Convite expirado' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user
    const { data: newUser, error: userError } = await supabaseServer
      .from('users')
      .insert([{
        tenant_id: invite.tenant_id,
        name: name.trim(),
        email: invite.email,
        password_hash: passwordHash,
        role: invite.role,
        is_active: true,
        player_id: invite.player_id,
      }])
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    // Update player if linked
    if (invite.player_id) {
      await supabaseServer
        .from('players')
        .update({ user_id: newUser.id })
        .eq('id', invite.player_id);
    }

    // Mark invite as accepted
    await supabaseServer
      .from('user_invites')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Conta criada com sucesso!',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    console.error('Error in POST /api/invites/accept:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
