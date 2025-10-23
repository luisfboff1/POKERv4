import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * GET /api/invites - List all invites for current tenant
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Only admins and super_admins can list invites
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem listar convites' },
        { status: 403 }
      );
    }

    const { data: invites, error } = await supabaseServer
      .from('user_invites')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch invites: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: invites || [],
    });
  } catch (error) {
    console.error('Error in GET /api/invites:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invites - Create new invite
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Only admins and super_admins can send invites
    if (!['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem enviar convites' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, role, name, playerLinkType, selectedPlayerId, newPlayerData } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const inviteEmail = email.trim().toLowerCase();
    const inviteRole = (role || 'player').trim();
    const inviteName = (name || '').trim();

    // Check if email already exists
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('email')
      .eq('email', inviteEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email já possui uma conta' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabaseServer
      .from('user_invites')
      .select('*')
      .eq('email', inviteEmail)
      .eq('tenant_id', user.tenant_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: 'Já existe um convite pendente para este email' },
        { status: 400 }
      );
    }

    // Generate invite token
    const token = generateInviteToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Handle player linking
    let playerId = null;
    if (playerLinkType === 'existing' && selectedPlayerId) {
      playerId = parseInt(selectedPlayerId);
    } else if (playerLinkType === 'new' && newPlayerData) {
      // Create new player
      const { data: newPlayer, error: playerError } = await supabaseServer
        .from('players')
        .insert([{
          tenant_id: user.tenant_id,
          name: newPlayerData.name.trim(),
          nickname: newPlayerData.nickname?.trim() || null,
          phone: newPlayerData.phone?.trim() || null,
          is_active: true,
        }])
        .select()
        .single();

      if (playerError) {
        throw new Error(`Failed to create player: ${playerError.message}`);
      }

      playerId = newPlayer.id;
    }

    // Create invite
    const { data: invite, error: inviteError } = await supabaseServer
      .from('user_invites')
      .insert([{
        tenant_id: user.tenant_id,
        email: inviteEmail,
        name: inviteName || null,
        role: inviteRole,
        token: tokenHash,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
        player_id: playerId,
      }])
      .select()
      .single();

    if (inviteError) {
      throw new Error(`Failed to create invite: ${inviteError.message}`);
    }

    // TODO: Send invitation email
    // await sendInviteEmail(inviteEmail, inviteName, token);

    return NextResponse.json({
      success: true,
      data: {
        invite_id: invite.id,
        email: invite.email,
        status: invite.status,
        token, // Return unhashed token to send in email
        message: 'Convite enviado com sucesso',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/invites:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Generate a random invite token
 */
function generateInviteToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

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
