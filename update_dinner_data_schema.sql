-- Atualizar schema da tabela dinner_data para suportar sistema independente
-- Adicionar campo updated_at para rastrear quando a janta foi editada

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dinner_data' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE dinner_data 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna players para armazenar dados dos jogadores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dinner_data' 
        AND column_name = 'players'
    ) THEN
        ALTER TABLE dinner_data 
        ADD COLUMN players JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Atualizar registros existentes para ter updated_at igual a created_at
UPDATE dinner_data 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_dinner_data_created_at ON dinner_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dinner_data_updated_at ON dinner_data(updated_at DESC);

-- Comentários para documentar a tabela
COMMENT ON TABLE dinner_data IS 'Tabela para armazenar dados de jantas independentes das sessões de poker';
COMMENT ON COLUMN dinner_data.session_id IS 'ID único da janta (pode ser independente de sessões de poker)';
COMMENT ON COLUMN dinner_data.total_amount IS 'Valor total da janta';
COMMENT ON COLUMN dinner_data.payer IS 'ID do jogador que pagou a janta';
COMMENT ON COLUMN dinner_data.division_type IS 'Tipo de divisão: equal (igual) ou custom (personalizada)';
COMMENT ON COLUMN dinner_data.custom_amounts IS 'Valores personalizados por jogador (JSON)';
COMMENT ON COLUMN dinner_data.payments IS 'Status de pagamentos por jogador (JSON)';
COMMENT ON COLUMN dinner_data.players IS 'Dados dos jogadores participantes (JSON com id e name)';
COMMENT ON COLUMN dinner_data.created_at IS 'Data de criação original da janta (não muda)';
COMMENT ON COLUMN dinner_data.updated_at IS 'Data da última edição da janta';
