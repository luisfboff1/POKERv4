-- Script para adicionar as colunas que estão faltando na tabela dinner_data
-- Execute este script se a tabela já existe mas não tem as novas colunas

-- Adicionar constraint única para session_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dinner_data_session_id_key' 
        AND conrelid = 'dinner_data'::regclass
    ) THEN
        ALTER TABLE dinner_data ADD CONSTRAINT dinner_data_session_id_key UNIQUE (session_id);
    END IF;
END $$;

-- Adicionar colunas que podem estar faltando
ALTER TABLE dinner_data 
ADD COLUMN IF NOT EXISTS dinner_date DATE;

ALTER TABLE dinner_data 
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'current' CHECK (session_type IN ('current', 'specific', 'independent'));

ALTER TABLE dinner_data 
ADD COLUMN IF NOT EXISTS selected_session TEXT;

ALTER TABLE dinner_data 
ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT false;

-- Atualizar valores padrão para registros existentes
UPDATE dinner_data 
SET session_type = 'current' 
WHERE session_type IS NULL;

UPDATE dinner_data 
SET is_saved = true 
WHERE is_saved IS NULL;

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_dinner_data_date ON dinner_data(dinner_date);
CREATE INDEX IF NOT EXISTS idx_dinner_data_session_type ON dinner_data(session_type);
CREATE INDEX IF NOT EXISTS idx_dinner_data_selected_session ON dinner_data(selected_session);

-- Comentários para as novas colunas
COMMENT ON COLUMN dinner_data.dinner_date IS 'Data da janta (para jantas independentes)';
COMMENT ON COLUMN dinner_data.session_type IS 'Tipo de associação: current, specific ou independent';
COMMENT ON COLUMN dinner_data.selected_session IS 'ID da sessão selecionada (quando session_type = specific)';
COMMENT ON COLUMN dinner_data.is_saved IS 'Se a janta já foi salva (para controlar mudança de data)';
