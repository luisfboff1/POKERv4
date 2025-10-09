-- EXECUTE ESTE SQL DIRETAMENTE NA BASE DE DADOS DE PRODUÇÃO
-- Para corrigir o problema de paid_transfers não sendo salvos

-- Verificar se colunas existem (execute uma de cada vez)
SHOW COLUMNS FROM sessions LIKE 'recommendations';
SHOW COLUMNS FROM sessions LIKE 'paid_transfers';

-- Se alguma das colunas não existir, execute os comandos abaixo:

-- Adicionar coluna recommendations (se não existir)
ALTER TABLE `sessions` 
ADD COLUMN `recommendations` JSON DEFAULT NULL COMMENT 'Recomendações de transferências calculadas';

-- Adicionar coluna paid_transfers (se não existir)  
ALTER TABLE `sessions` 
ADD COLUMN `paid_transfers` JSON DEFAULT NULL COMMENT 'Status de pagamento das transferências';

-- Criar índices para performance (opcional)
CREATE INDEX `idx_sessions_recommendations` ON `sessions`(`recommendations`(50));
CREATE INDEX `idx_sessions_paid_transfers` ON `sessions`(`paid_transfers`(50));

-- Atualizar sessões existentes para ter valores padrão (opcional)
UPDATE `sessions` 
SET 
  `recommendations` = JSON_ARRAY(),
  `paid_transfers` = JSON_OBJECT()
WHERE 
  `recommendations` IS NULL 
  OR `paid_transfers` IS NULL;

-- Verificar se funcionou (deve mostrar as novas colunas)
DESCRIBE sessions;