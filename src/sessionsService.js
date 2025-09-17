// Serviço para gerenciar sessões de poker
import { supabase } from './supabaseClient';

// Salvar sessão completa
export const saveSession = async (sessionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { players, settlements, note, currency } = sessionData;
    
    // Calcular totais
    const totalBuyIns = players.reduce((sum, p) => 
      sum + p.buyIns.reduce((a, b) => a + b, 0), 0);
    const totalCashOuts = players.reduce((sum, p) => sum + (p.cashOut || 0), 0);

    // 1. Criar/atualizar sessão
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .upsert({
        id: sessionData.id || undefined,
        date_iso: sessionData.dateISO || new Date().toISOString(),
        label: note || null,
        snapshot: {
          players: players.map(p => ({
            id: p.id,
            name: p.name,
            buyIns: p.buyIns,
            cashOut: p.cashOut || 0
          })),
          settlements: settlements || []
        },
        created_by_email: user.email,
        currency: currency || 'BRL',
        total_buy_ins: totalBuyIns,
        total_cash_outs: totalCashOuts,
        player_count: players.length
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // 2. Criar/atualizar jogadores
    const playerIds = {};
    for (const player of players) {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .upsert({
          name: player.name,
          created_by_email: user.email
        }, { onConflict: 'name,created_by_email' })
        .select()
        .single();

      if (playerError) throw playerError;
      playerIds[player.name] = playerData.id;
    }

    // 3. Criar participações na sessão
    await supabase
      .from('session_participations')
      .delete()
      .eq('session_id', session.id);

    for (const player of players) {
      const totalBuyIn = player.buyIns.reduce((a, b) => a + b, 0);
      const netResult = (player.cashOut || 0) - totalBuyIn;

      const { error: participationError } = await supabase
        .from('session_participations')
        .insert({
          session_id: session.id,
          player_id: playerIds[player.name],
          buy_ins: player.buyIns,
          cash_out: player.cashOut || 0,
          net_result: netResult
        });

      if (participationError) throw participationError;
    }

    // 4. Criar settlements
    if (settlements && settlements.length > 0) {
      await supabase
        .from('settlements')
        .delete()
        .eq('session_id', session.id);

      for (const settlement of settlements) {
        const fromPlayerId = playerIds[settlement.from];
        const toPlayerId = playerIds[settlement.to];

        if (fromPlayerId && toPlayerId) {
          const { error: settlementError } = await supabase
            .from('settlements')
            .insert({
              session_id: session.id,
              from_player_id: fromPlayerId,
              to_player_id: toPlayerId,
              amount: settlement.amount,
              is_paid: settlement.paid || false,
              is_recommended: settlement.recommended || false
            });

          if (settlementError) throw settlementError;
        }
      }
    }

    // 5. Atualizar estatísticas dos jogadores
    for (const playerId of Object.values(playerIds)) {
      await supabase.rpc('update_player_stats', { player_uuid: playerId });
    }

    return session;
  } catch (err) {
    console.error('Erro ao salvar sessão:', err);
    throw err;
  }
};

// Carregar sessões do usuário
export const loadUserSessions = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        session_participations (
          *,
          players (name)
        ),
        settlements (
          *,
          from_player:players!settlements_from_player_id_fkey (name),
          to_player:players!settlements_to_player_id_fkey (name)
        )
      `)
      .eq('created_by_email', user.email)
      .order('date_iso', { ascending: false });

    if (error) throw error;

    return data.map(session => ({
      id: session.id,
      dateISO: session.date_iso,
      label: session.label,
      currency: session.currency,
      players: session.session_participations.map(p => ({
        id: p.player_id,
        name: p.players.name,
        buyIns: p.buy_ins,
        cashOut: p.cash_out,
        net: p.net_result
      })),
      settlements: session.settlements.map(s => ({
        from: s.from_player.name,
        to: s.to_player.name,
        amount: s.amount,
        paid: s.is_paid,
        recommended: s.is_recommended
      })),
      totals: {
        totalBuyIn: session.total_buy_ins,
        totalCashOut: session.total_cash_outs,
        playerCount: session.player_count
      }
    }));
  } catch (err) {
    console.error('Erro ao carregar sessões:', err);
    throw err;
  }
};

// Carregar ranking de jogadores
export const loadPlayerRanking = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('player_stats')
      .select(`
        *,
        players (name)
      `)
      .eq('players.created_by_email', user.email)
      .order('total_net', { ascending: false });

    if (error) throw error;

    return data.map(stat => ({
      name: stat.players.name,
      participations: stat.total_sessions,
      totalBuyIns: stat.total_buy_ins,
      totalCashOut: stat.total_cash_outs,
      net: stat.total_net,
      biggestWin: stat.biggest_win,
      biggestLoss: stat.biggest_loss,
      winRate: stat.win_rate,
      lastPlayed: stat.last_played
    }));
  } catch (err) {
    console.error('Erro ao carregar ranking:', err);
    throw err;
  }
};

// Deletar sessão
export const deleteSession = async (sessionId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('created_by_email', user.email);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao deletar sessão:', err);
    throw err;
  }
};

// Atualizar status de pagamento
export const updateSettlementPaid = async (sessionId, settlementIndex, isPaid) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar o settlement específico
    const { data: settlements, error: fetchError } = await supabase
      .from('settlements')
      .select('id')
      .eq('session_id', sessionId)
      .order('created_at');

    if (fetchError) throw fetchError;

    if (settlements && settlements[settlementIndex]) {
      const { error: updateError } = await supabase
        .from('settlements')
        .update({ 
          is_paid: isPaid,
          paid_at: isPaid ? new Date().toISOString() : null
        })
        .eq('id', settlements[settlementIndex].id);

      if (updateError) throw updateError;
    }

    return true;
  } catch (err) {
    console.error('Erro ao atualizar pagamento:', err);
    throw err;
  }
};

// Buscar jogadores por nome
export const searchPlayers = async (query) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('players')
      .select('name')
      .eq('created_by_email', user.email)
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) throw error;

    return data.map(p => p.name);
  } catch (err) {
    console.error('Erro ao buscar jogadores:', err);
    return [];
  }
};
