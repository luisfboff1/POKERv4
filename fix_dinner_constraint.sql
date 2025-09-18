-- Script para corrigir a constraint única na tabela dinner_data
-- Execute este script para resolver o erro de ON CONFLICT

-- Adicionar constraint única para session_id se não existir
DO $$ 
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dinner_data_session_id_key' 
        AND conrelid = 'dinner_data'::regclass
    ) THEN
        -- Adicionar a constraint única
        ALTER TABLE dinner_data ADD CONSTRAINT dinner_data_session_id_key UNIQUE (session_id);
        RAISE NOTICE 'Constraint única adicionada para session_id';
    ELSE
        RAISE NOTICE 'Constraint única já existe para session_id';
    END IF;
END $$;

-- Verificar se a constraint foi criada
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'dinner_data'::regclass 
AND conname = 'dinner_data_session_id_key';
