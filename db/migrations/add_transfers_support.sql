-- =============================================
-- MIGRATION: Adicionar suporte completo a transferências
-- =============================================

-- Adicionar coluna recommendations se não existir
ALTER TABLE `sessions` 
ADD COLUMN IF NOT EXISTS `recommendations` JSON DEFAULT NULL COMMENT 'Recomendações de transferências calculadas';

-- Adicionar coluna para controlar quais transferências foram pagas
ALTER TABLE `sessions` 
ADD COLUMN IF NOT EXISTS `paid_transfers` JSON DEFAULT NULL COMMENT 'Status de pagamento das transferências: {"from_to": true/false}';

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS `idx_sessions_recommendations` ON `sessions`(`recommendations`(50));
CREATE INDEX IF NOT EXISTS `idx_sessions_paid_transfers` ON `sessions`(`paid_transfers`(50));

-- Atualizar sessões existentes que não têm essas colunas
UPDATE `sessions` 
SET 
  `recommendations` = JSON_ARRAY(),
  `paid_transfers` = JSON_OBJECT()
WHERE 
  `recommendations` IS NULL 
  OR `paid_transfers` IS NULL;

-- Exemplo dos JSONs:
-- recommendations: [{"from":"João","to":"Maria","amount":150}]
-- paid_transfers: {"João_Maria": true, "Carlos_João": false}