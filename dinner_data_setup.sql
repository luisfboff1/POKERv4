-- Criação da tabela dinner_data para gerenciar pagamentos da janta
CREATE TABLE IF NOT EXISTS dinner_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payer TEXT,
  division_type TEXT NOT NULL DEFAULT 'equal' CHECK (division_type IN ('equal', 'custom')),
  custom_amounts JSONB DEFAULT '{}',
  payments JSONB DEFAULT '{}',
  dinner_date DATE,
  session_type TEXT DEFAULT 'current' CHECK (session_type IN ('current', 'specific', 'independent')),
  selected_session TEXT,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dinner_data_session_id ON dinner_data(session_id);
CREATE INDEX IF NOT EXISTS idx_dinner_data_created_at ON dinner_data(created_at);
CREATE INDEX IF NOT EXISTS idx_dinner_data_date ON dinner_data(dinner_date);
CREATE INDEX IF NOT EXISTS idx_dinner_data_session_type ON dinner_data(session_type);
CREATE INDEX IF NOT EXISTS idx_dinner_data_selected_session ON dinner_data(selected_session);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_dinner_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_dinner_data_updated_at ON dinner_data;
CREATE TRIGGER trigger_update_dinner_data_updated_at
  BEFORE UPDATE ON dinner_data
  FOR EACH ROW
  EXECUTE FUNCTION update_dinner_data_updated_at();

-- RLS (Row Level Security) - permitir acesso apenas para usuários autenticados
ALTER TABLE dinner_data ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam todos os dados da janta
CREATE POLICY "Users can view all dinner data" ON dinner_data
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir que usuários autenticados insiram dados da janta
CREATE POLICY "Users can insert dinner data" ON dinner_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir que usuários autenticados atualizem dados da janta
CREATE POLICY "Users can update dinner data" ON dinner_data
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir que usuários autenticados deletem dados da janta
CREATE POLICY "Users can delete dinner data" ON dinner_data
  FOR DELETE USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE dinner_data IS 'Tabela para gerenciar pagamentos da janta por sessão ou data';
COMMENT ON COLUMN dinner_data.session_id IS 'ID da sessão de poker ou identificador único (dinner_YYYY-MM-DD)';
COMMENT ON COLUMN dinner_data.total_amount IS 'Valor total da janta';
COMMENT ON COLUMN dinner_data.payer IS 'ID do jogador que pagou a janta (opcional)';
COMMENT ON COLUMN dinner_data.division_type IS 'Tipo de divisão: equal (igual) ou custom (personalizada)';
COMMENT ON COLUMN dinner_data.custom_amounts IS 'Valores personalizados por jogador (JSON)';
COMMENT ON COLUMN dinner_data.payments IS 'Status de pagamento por jogador (JSON)';
COMMENT ON COLUMN dinner_data.dinner_date IS 'Data da janta (para jantas independentes)';
COMMENT ON COLUMN dinner_data.session_type IS 'Tipo de associação: current, specific ou independent';
COMMENT ON COLUMN dinner_data.selected_session IS 'ID da sessão selecionada (quando session_type = specific)';
COMMENT ON COLUMN dinner_data.is_saved IS 'Se a janta já foi salva (para controlar mudança de data)';
