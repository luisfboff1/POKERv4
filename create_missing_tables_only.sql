-- Script para criar apenas as tabelas que faltam (sem recriar triggers existentes)
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar e criar tabela de jogadores
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_email TEXT NOT NULL,
  UNIQUE(name, created_by_email)
);

-- 2. Verificar e criar tabela de participações em sessões
CREATE TABLE IF NOT EXISTS session_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  buy_ins JSONB DEFAULT '[]'::jsonb,
  cash_out DECIMAL(10,2) DEFAULT 0,
  net_result DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- 3. Verificar e criar tabela de settlements
CREATE TABLE IF NOT EXISTS settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  from_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  to_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  is_recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 4. Verificar e criar tabela de recomendações de pagamento
CREATE TABLE IF NOT EXISTS payment_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  from_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  to_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Verificar e criar tabela de estatísticas de jogadores
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_buy_ins DECIMAL(10,2) DEFAULT 0,
  total_cash_outs DECIMAL(10,2) DEFAULT 0,
  total_net DECIMAL(10,2) DEFAULT 0,
  biggest_win DECIMAL(10,2) DEFAULT 0,
  biggest_loss DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id)
);

-- 6. Adicionar colunas à tabela sessions se não existirem
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_buy_ins DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_cash_outs DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS player_count INTEGER DEFAULT 0;

-- 7. Criar índices apenas se não existirem
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

-- 8. Configurar RLS apenas se não estiver habilitado
DO $$
BEGIN
  -- Habilitar RLS se não estiver habilitado
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'players' AND relrowsecurity = true) THEN
    ALTER TABLE players ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'session_participations' AND relrowsecurity = true) THEN
    ALTER TABLE session_participations ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'settlements' AND relrowsecurity = true) THEN
    ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'payment_recommendations' AND relrowsecurity = true) THEN
    ALTER TABLE payment_recommendations ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'player_stats' AND relrowsecurity = true) THEN
    ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 9. Criar políticas RLS apenas se não existirem
DO $$
BEGIN
  -- Políticas para players
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own players' AND tablename = 'players') THEN
    CREATE POLICY "Users can view own players" ON players
      FOR SELECT USING (created_by_email = auth.email());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own players' AND tablename = 'players') THEN
    CREATE POLICY "Users can manage own players" ON players
      FOR ALL USING (created_by_email = auth.email());
  END IF;

  -- Políticas para session_participations
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

  -- Políticas para settlements
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

  -- Políticas para payment_recommendations
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

  -- Políticas para player_stats
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

-- 10. Verificar se o admin principal existe
INSERT INTO user_permissions (email, role, is_approved, approved_at)
VALUES ('luisfboff@hotmail.com', 'admin', TRUE, NOW())
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_approved = TRUE,
  approved_at = NOW();

-- 11. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas criadas com sucesso!';
  RAISE NOTICE '📊 Tabelas disponíveis: user_permissions, sessions, players, session_participations, settlements, payment_recommendations, player_stats';
  RAISE NOTICE '👤 Admin principal: luisfboff@hotmail.com';
  RAISE NOTICE '🚀 Sistema pronto para uso!';
END $$;
