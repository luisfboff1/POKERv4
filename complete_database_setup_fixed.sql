-- Script completo para criar todas as tabelas do Poker Settlements (versão corrigida)
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de permissões de usuários (já deve existir)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- 2. Tabela de sessões de poker (expandir a existente)
-- Primeiro, vamos verificar se a tabela sessions existe e adicionar colunas se necessário
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_buy_ins DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_cash_outs DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS player_count INTEGER DEFAULT 0;

-- 3. Tabela de jogadores (para histórico e ranking)
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT, -- opcional, para contato
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_email TEXT NOT NULL,
  UNIQUE(name, created_by_email) -- mesmo nome pode existir para diferentes usuários
);

-- 4. Tabela de participações em sessões
CREATE TABLE IF NOT EXISTS session_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  buy_ins JSONB DEFAULT '[]'::jsonb, -- array de valores de buy-ins
  cash_out DECIMAL(10,2) DEFAULT 0,
  net_result DECIMAL(10,2) DEFAULT 0, -- cash_out - total_buy_ins
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- 5. Tabela de settlements (transferências otimizadas)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  from_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  to_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  is_recommended BOOLEAN DEFAULT FALSE, -- se foi uma recomendação manual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 6. Tabela de recomendações de pagamento
CREATE TABLE IF NOT EXISTS payment_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  from_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  to_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT, -- motivo da recomendação
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de estatísticas de jogadores (para ranking)
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_buy_ins DECIMAL(10,2) DEFAULT 0,
  total_cash_outs DECIMAL(10,2) DEFAULT 0,
  total_net DECIMAL(10,2) DEFAULT 0,
  biggest_win DECIMAL(10,2) DEFAULT 0,
  biggest_loss DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0, -- porcentagem de sessões vencedoras
  last_played TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id)
);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by_email);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date_iso);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_created_by ON players(created_by_email);
CREATE INDEX IF NOT EXISTS idx_session_participations_session ON session_participations(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participations_player ON session_participations(player_id);
CREATE INDEX IF NOT EXISTS idx_settlements_session ON settlements(session_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_player ON settlements(from_player_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_player ON settlements(to_player_id);
CREATE INDEX IF NOT EXISTS idx_payment_recommendations_session ON payment_recommendations(session_id);

-- 9. Inserir o administrador principal
INSERT INTO user_permissions (email, role, is_approved, approved_at)
VALUES ('luisfboff@hotmail.com', 'admin', TRUE, NOW())
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_approved = TRUE,
  approved_at = NOW();

-- 10. Funções auxiliares
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at (apenas se não existirem)
DO $$
BEGIN
  -- Trigger para user_permissions
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_permissions_updated_at') THEN
    CREATE TRIGGER update_user_permissions_updated_at
      BEFORE UPDATE ON user_permissions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger para players
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_players_updated_at') THEN
    CREATE TRIGGER update_players_updated_at
      BEFORE UPDATE ON players
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger para player_stats
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_player_stats_updated_at') THEN
    CREATE TRIGGER update_player_stats_updated_at
      BEFORE UPDATE ON player_stats
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 11. Função para calcular estatísticas de jogador
CREATE OR REPLACE FUNCTION update_player_stats(player_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_sessions_count INTEGER;
  total_buy_ins_sum DECIMAL(10,2);
  total_cash_outs_sum DECIMAL(10,2);
  total_net_sum DECIMAL(10,2);
  biggest_win_val DECIMAL(10,2);
  biggest_loss_val DECIMAL(10,2);
  win_rate_val DECIMAL(5,2);
  last_played_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular estatísticas
  SELECT 
    COUNT(*),
    COALESCE(SUM(sp.net_result), 0),
    COALESCE(MAX(sp.net_result), 0),
    COALESCE(MIN(sp.net_result), 0),
    MAX(s.date_iso)
  INTO 
    total_sessions_count,
    total_net_sum,
    biggest_win_val,
    biggest_loss_val,
    last_played_date
  FROM session_participations sp
  JOIN sessions s ON sp.session_id = s.id
  WHERE sp.player_id = player_uuid;

  -- Calcular win rate
  SELECT 
    CASE 
      WHEN total_sessions_count > 0 THEN 
        (COUNT(*) * 100.0 / total_sessions_count)
      ELSE 0 
    END
  INTO win_rate_val
  FROM session_participations sp
  WHERE sp.player_id = player_uuid AND sp.net_result > 0;

  -- Inserir ou atualizar estatísticas
  INSERT INTO player_stats (
    player_id, total_sessions, total_net, biggest_win, biggest_loss, 
    win_rate, last_played
  ) VALUES (
    player_uuid, total_sessions_count, total_net_sum, biggest_win_val, 
    biggest_loss_val, win_rate_val, last_played_date
  )
  ON CONFLICT (player_id) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_net = EXCLUDED.total_net,
    biggest_win = EXCLUDED.biggest_win,
    biggest_loss = EXCLUDED.biggest_loss,
    win_rate = EXCLUDED.win_rate,
    last_played = EXCLUDED.last_played,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 12. Função para verificar permissões
CREATE OR REPLACE FUNCTION check_user_permission(user_email TEXT, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissions 
    WHERE email = user_email 
    AND is_approved = TRUE 
    AND (
      role = 'admin' OR 
      (required_role = 'viewer' AND role IN ('viewer', 'editor', 'admin')) OR
      (required_role = 'editor' AND role IN ('editor', 'admin'))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Configurar RLS (Row Level Security)
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para user_permissions (apenas se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own permissions' AND tablename = 'user_permissions') THEN
    CREATE POLICY "Users can view own permissions" ON user_permissions
      FOR SELECT USING (auth.email() = email);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all permissions' AND tablename = 'user_permissions') THEN
    CREATE POLICY "Admins can view all permissions" ON user_permissions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM user_permissions up 
          WHERE up.email = auth.email() 
          AND up.role = 'admin' 
          AND up.is_approved = TRUE
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage permissions' AND tablename = 'user_permissions') THEN
    CREATE POLICY "Admins can manage permissions" ON user_permissions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_permissions up 
          WHERE up.email = auth.email() 
          AND up.role = 'admin' 
          AND up.is_approved = TRUE
        )
      );
  END IF;
END $$;

-- Políticas para players
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own players' AND tablename = 'players') THEN
    CREATE POLICY "Users can view own players" ON players
      FOR SELECT USING (created_by_email = auth.email());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own players' AND tablename = 'players') THEN
    CREATE POLICY "Users can manage own players" ON players
      FOR ALL USING (created_by_email = auth.email());
  END IF;
END $$;

-- Políticas para sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view sessions based on permissions' AND tablename = 'sessions') THEN
    CREATE POLICY "Users can view sessions based on permissions" ON sessions
      FOR SELECT USING (
        created_by_email = auth.email() OR
        is_public = TRUE OR
        EXISTS (
          SELECT 1 FROM user_permissions up 
          WHERE up.email = auth.email() 
          AND up.is_approved = TRUE
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage sessions based on permissions' AND tablename = 'sessions') THEN
    CREATE POLICY "Users can manage sessions based on permissions" ON sessions
      FOR ALL USING (
        created_by_email = auth.email() OR
        EXISTS (
          SELECT 1 FROM user_permissions up 
          WHERE up.email = auth.email() 
          AND up.role IN ('editor', 'admin')
          AND up.is_approved = TRUE
        )
      );
  END IF;
END $$;

-- Políticas para session_participations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view session participations' AND tablename = 'session_participations') THEN
    CREATE POLICY "Users can view session participations" ON session_participations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM sessions s 
          WHERE s.id = session_participations.session_id 
          AND (s.created_by_email = auth.email() OR s.is_public = TRUE)
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage session participations' AND tablename = 'session_participations') THEN
    CREATE POLICY "Users can manage session participations" ON session_participations
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM sessions s 
          WHERE s.id = session_participations.session_id 
          AND s.created_by_email = auth.email()
        )
      );
  END IF;
END $$;

-- Políticas para settlements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view settlements' AND tablename = 'settlements') THEN
    CREATE POLICY "Users can view settlements" ON settlements
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM sessions s 
          WHERE s.id = settlements.session_id 
          AND (s.created_by_email = auth.email() OR s.is_public = TRUE)
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage settlements' AND tablename = 'settlements') THEN
    CREATE POLICY "Users can manage settlements" ON settlements
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM sessions s 
          WHERE s.id = settlements.session_id 
          AND s.created_by_email = auth.email()
        )
      );
  END IF;
END $$;

-- Políticas para payment_recommendations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view payment recommendations' AND tablename = 'payment_recommendations') THEN
    CREATE POLICY "Users can view payment recommendations" ON payment_recommendations
      FOR SELECT USING (
        created_by_email = auth.email() OR
        EXISTS (
          SELECT 1 FROM sessions s 
          WHERE s.id = payment_recommendations.session_id 
          AND s.created_by_email = auth.email()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage payment recommendations' AND tablename = 'payment_recommendations') THEN
    CREATE POLICY "Users can manage payment recommendations" ON payment_recommendations
      FOR ALL USING (created_by_email = auth.email());
  END IF;
END $$;

-- Políticas para player_stats
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view player stats' AND tablename = 'player_stats') THEN
    CREATE POLICY "Users can view player stats" ON player_stats
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM players p 
          WHERE p.id = player_stats.player_id 
          AND p.created_by_email = auth.email()
        )
      );
  END IF;
END $$;

-- 14. Função para aprovar usuário
CREATE OR REPLACE FUNCTION approve_user(user_email TEXT, new_role TEXT, approved_by_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  approver_id UUID;
BEGIN
  -- Verificar se quem está aprovando é admin
  SELECT user_id INTO approver_id 
  FROM user_permissions 
  WHERE email = approved_by_email AND role = 'admin' AND is_approved = TRUE;
  
  IF approver_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Aprovar o usuário
  UPDATE user_permissions 
  SET 
    is_approved = TRUE,
    role = new_role,
    approved_by = approver_id,
    approved_at = NOW()
  WHERE email = user_email;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Função para rejeitar usuário
CREATE OR REPLACE FUNCTION reject_user(user_email TEXT, rejected_by_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rejecter_id UUID;
BEGIN
  -- Verificar se quem está rejeitando é admin
  SELECT user_id INTO rejecter_id 
  FROM user_permissions 
  WHERE email = rejected_by_email AND role = 'admin' AND is_approved = TRUE;
  
  IF rejecter_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remover o usuário
  DELETE FROM user_permissions WHERE email = user_email;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Comentários nas tabelas
COMMENT ON TABLE user_permissions IS 'Controle de permissões e aprovação de usuários';
COMMENT ON TABLE sessions IS 'Sessões de poker com dados resumidos';
COMMENT ON TABLE players IS 'Jogadores únicos por usuário';
COMMENT ON TABLE session_participations IS 'Participação de jogadores em sessões específicas';
COMMENT ON TABLE settlements IS 'Transferências otimizadas entre jogadores';
COMMENT ON TABLE payment_recommendations IS 'Recomendações manuais de pagamento';
COMMENT ON TABLE player_stats IS 'Estatísticas consolidadas dos jogadores';

-- 17. Verificar se tudo foi criado corretamente
DO $$
BEGIN
  RAISE NOTICE '✅ Todas as tabelas foram criadas com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: user_permissions, sessions, players, session_participations, settlements, payment_recommendations, player_stats';
  RAISE NOTICE '🔐 RLS configurado para todas as tabelas';
  RAISE NOTICE '👤 Admin principal: luisfboff@hotmail.com';
  RAISE NOTICE '🚀 Sistema pronto para uso!';
END $$;
