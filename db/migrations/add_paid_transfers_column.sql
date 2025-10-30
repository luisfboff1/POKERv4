-- =============================================
-- MIGRATION: Adicionar controle de pagamentos de transferências
-- =============================================

-- Adicionar coluna para controlar quais transferências foram pagas
-- Será um JSON que mapeia cada transferência (from->to) com seu status de pagamento
ALTER TABLE `sessions` 
ADD COLUMN IF NOT EXISTS `paid_transfers` JSON DEFAULT NULL COMMENT 'Status de pagamento das transferências: {"from_to": true/false}';

-- Exemplo do JSON:
-- {
--   "João_Maria": true,     // João pagou para Maria
--   "Carlos_João": false    // Carlos ainda não pagou para João  
-- }

-- Índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS `idx_sessions_paid_transfers` ON `sessions`(`paid_transfers`(50));