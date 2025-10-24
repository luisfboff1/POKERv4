import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabaseServer';

interface CreatePlayerBody {
  name: string;
  nickname?: string;
  phone?: string;
  notes?: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { data: players, error } = await supabaseServer
      .from('players')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch players: ${error.message}`);
    }

    const formattedPlayers = players.map((player: Record<string, unknown>) => ({
      id: player.id as number,
      name: player.name as string,
      nickname: (player.nickname as string) || '',
      phone: (player.phone as string) || '',
      notes: (player.notes as string) || '',
      role: 'player',
      status: player.is_active ? 'active' : 'inactive',
      team_id: player.tenant_id as number,
      total_sessions: (player.total_sessions as number) || 0,
      total_buyin: parseFloat((player.total_buyin as string) || '0') || 0,
      total_cashout: parseFloat((player.total_cashout as string) || '0') || 0,
      // Se o player tiver user_id, podemos buscar o email do user depois
      user_id: (player.user_id as number) || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedPlayers,
    });
  } catch (error) {
    console.error('Error in GET /api/players:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json() as CreatePlayerBody;

    const playerName = body.name?.trim();

    if (!playerName) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const { data: existingPlayer, error: checkError } = await supabaseServer
      .from('players')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .eq('name', playerName)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing player: ${checkError.message}`);
    }

    if (existingPlayer) {
      const updateData: Record<string, unknown> = {
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (body.nickname) updateData.nickname = body.nickname;
      if (body.phone) updateData.phone = body.phone;
      if (body.notes) updateData.notes = body.notes;

      const { error: updateError } = await supabaseServer
        .from('players')
        .update(updateData)
        .eq('id', existingPlayer.id);

      if (updateError) {
        throw new Error(`Failed to update existing player: ${updateError.message}`);
      }

      return NextResponse.json({
        success: true,
        data: {
          id: existingPlayer.id,
          name: existingPlayer.name,
          nickname: body.nickname || existingPlayer.nickname || '',
          phone: body.phone || existingPlayer.phone || '',
          notes: body.notes || existingPlayer.notes || '',
          role: 'player',
          status: 'active',
          team_id: user.tenant_id,
          user_id: existingPlayer.user_id || null,
          created: true,
        },
      });
    }

    const { data: newPlayer, error: insertError } = await supabaseServer
      .from('players')
      .insert([
        {
          tenant_id: user.tenant_id,
          name: playerName,
          nickname: body.nickname || null,
          phone: body.phone || null,
          notes: body.notes || null,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create player: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newPlayer.id,
        name: newPlayer.name,
        nickname: newPlayer.nickname || '',
        phone: newPlayer.phone || '',
        notes: newPlayer.notes || '',
        role: 'player',
        status: 'active',
        team_id: user.tenant_id,
        user_id: null,
        created: true,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/players:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
