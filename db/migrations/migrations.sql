-- =============================================
-- SCRIPT DE MIGRAÇÃO E ATUALIZAÇÕES
-- =============================================
-- Para aplicar mudanças incrementais no banco
-- =============================================

-- =============================================
-- V1.1 - Adição de campos para vinculação jogador-usuário
-- =============================================

-- Adicionar campos de vinculação (se não existirem)
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `player_id` int(11) DEFAULT NULL COMMENT 'Vinculação com jogador (futuro)';

ALTER TABLE `players` 
ADD COLUMN IF NOT EXISTS `user_id` int(11) DEFAULT NULL COMMENT 'Vinculação com usuário (futuro)';

ALTER TABLE `user_invites` 
ADD COLUMN IF NOT EXISTS `player_id` int(11) DEFAULT NULL COMMENT 'Jogador a ser vinculado ao aceitar';

-- Adicionar foreign keys (ignorar erro se já existirem)
-- Usar versão simplificada sem information_schema

-- FK users->players
-- ALTER TABLE `users` ADD CONSTRAINT `users_player_fk` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE SET NULL;

-- FK players->users  
-- ALTER TABLE `players` ADD CONSTRAINT `players_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- FK invites->players
-- ALTER TABLE `user_invites` ADD CONSTRAINT `invites_player_fk` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE SET NULL;

-- Nota: Descomente as linhas acima apenas se as constraints não existirem
-- Em produção, execute uma por vez e ignore erros de constraint já existente

-- =============================================
-- V1.2 - Campos adicionais para configurações
-- =============================================

-- Adicionar configurações de tenant
ALTER TABLE `tenants` 
ADD COLUMN IF NOT EXISTS `settings` json DEFAULT NULL COMMENT 'Configurações personalizadas do tenant',
ADD COLUMN IF NOT EXISTS `timezone` varchar(50) DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS `currency` varchar(3) DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS `default_session_fee` decimal(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS `default_janta_fee` decimal(8,2) DEFAULT 0.00;

-- Adicionar campos de preferências do usuário
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `preferences` json DEFAULT NULL COMMENT 'Preferências do usuário',
ADD COLUMN IF NOT EXISTS `avatar_url` varchar(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `phone` varchar(50) DEFAULT NULL;

-- =============================================
-- V1.3 - Índices para melhor performance
-- =============================================

-- Verificar e criar índices se não existirem
CREATE INDEX IF NOT EXISTS `users_player_id_idx` ON `users` (`player_id`);
CREATE INDEX IF NOT EXISTS `players_user_id_idx` ON `players` (`user_id`);
CREATE INDEX IF NOT EXISTS `invites_player_id_idx` ON `user_invites` (`player_id`);
CREATE INDEX IF NOT EXISTS `sessions_tenant_status_idx` ON `sessions` (`tenant_id`, `status`);
CREATE INDEX IF NOT EXISTS `audit_logs_tenant_action_idx` ON `audit_logs` (`tenant_id`, `action`);

-- =============================================
-- V1.4 - Views atualizadas
-- =============================================

-- Atualizar view de tenants com novos campos
CREATE OR REPLACE VIEW `all_tenants_view` AS
SELECT 
  t.*,
  COUNT(DISTINCT u.id) as users_count,
  COUNT(DISTINCT p.id) as players_count,
  COUNT(DISTINCT s.id) as sessions_count,
  COALESCE(SUM(s.total_buyin), 0) as total_volume,
  MAX(s.date) as last_session_date,
  (SELECT name FROM users WHERE tenant_id = t.id AND role IN ('admin', 'super_admin') ORDER BY id LIMIT 1) as admin_name,
  COUNT(DISTINCT CASE WHEN u.player_id IS NOT NULL THEN u.id END) as linked_users_count
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = 1
LEFT JOIN players p ON t.id = p.tenant_id AND p.is_active = 1
LEFT JOIN sessions s ON t.id = s.tenant_id
GROUP BY t.id;

-- View para jogadores com usuários vinculados
CREATE OR REPLACE VIEW `players_with_users` AS
SELECT 
  p.*,
  u.id as user_id,
  u.email as user_email,
  u.last_login,
  CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as has_user_account
FROM players p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.is_active = 1;

-- =============================================
-- V1.5 - Função para sincronizar estatísticas
-- =============================================

DELIMITER //
CREATE FUNCTION IF NOT EXISTS CalculatePlayerWinRate(player_id INT) 
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total_sessions INT DEFAULT 0;
    DECLARE winning_sessions INT DEFAULT 0;
    DECLARE win_rate DECIMAL(5,2) DEFAULT 0.00;
    
    -- Contar total de sessões do jogador
    SELECT COUNT(*) INTO total_sessions
    FROM sessions s
    WHERE JSON_CONTAINS(s.players_data, JSON_OBJECT('id', player_id))
    AND s.status = 'closed';
    
    -- Contar sessões com lucro
    SELECT COUNT(*) INTO winning_sessions
    FROM sessions s
    WHERE JSON_CONTAINS(s.players_data, JSON_OBJECT('id', player_id))
    AND s.status = 'closed'
    AND JSON_EXTRACT(s.players_data, CONCAT('$[', JSON_SEARCH(s.players_data, 'one', player_id, NULL, '$.id'), '].cashout')) > 
        JSON_EXTRACT(s.players_data, CONCAT('$[', JSON_SEARCH(s.players_data, 'one', player_id, NULL, '$.id'), '].buyin'));
    
    -- Calcular win rate
    IF total_sessions > 0 THEN
        SET win_rate = (winning_sessions / total_sessions) * 100;
    END IF;
    
    RETURN win_rate;
END//
DELIMITER ;

-- =============================================
-- V1.6 - Procedure para limpeza de dados antigos
-- =============================================

DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanupOldData()
BEGIN
    -- Limpar logs de auditoria mais antigos que 1 ano
    DELETE FROM audit_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
    
    -- Limpar convites expirados há mais de 30 dias
    DELETE FROM user_invites 
    WHERE status = 'expired' 
    AND expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Log da limpeza
    INSERT INTO audit_logs (action, table_name, new_data, created_at)
    VALUES ('cleanup_old_data', 'system', JSON_OBJECT('cleanup_date', NOW()), NOW());
END//
DELIMITER ;

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

-- Verificar se migrações foram aplicadas
-- Teste simples sem usar information_schema
SELECT 'Verificando estrutura...' as Status;

-- Testar se colunas existem fazendo SELECT
-- Se der erro, significa que a coluna não existe ainda
SELECT 
    COUNT(*) as users_with_player_id
FROM users 
WHERE player_id IS NOT NULL OR player_id IS NULL;

SELECT 
    COUNT(*) as players_with_user_id  
FROM players 
WHERE user_id IS NOT NULL OR user_id IS NULL;

SELECT 'Migração concluída com sucesso!' as Status;