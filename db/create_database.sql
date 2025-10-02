-- =============================================
-- POKER MANAGER - ESTRUTURA COMPLETA DO BANCO
-- =============================================
-- Script para criar todas as tabelas necessárias
-- Verifica se existe antes de criar (idempotente)
-- =============================================

-- Definir charset e collation padrão
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =============================================
-- 1. TABELA DE TENANTS (CLIENTES/GRUPOS)
-- =============================================
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'Nome do grupo/cliente',
  `email` varchar(255) NOT NULL COMMENT 'Email do responsável',
  `phone` varchar(50) DEFAULT NULL,
  `plan` enum('basic','premium','enterprise') DEFAULT 'basic',
  `status` enum('pending','active','suspended','cancelled') DEFAULT 'pending',
  `max_users` int(11) DEFAULT 10,
  `max_sessions_per_month` int(11) DEFAULT 50,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `suspended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  KEY `status_idx` (`status`),
  KEY `plan_idx` (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. TABELA DE USUÁRIOS (LOGIN/AUTENTICAÇÃO)
-- =============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','player') DEFAULT 'player',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `player_id` int(11) DEFAULT NULL COMMENT 'Vinculação com jogador (futuro)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `role_idx` (`role`),
  KEY `is_active_idx` (`is_active`),
  CONSTRAINT `users_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. TABELA DE JOGADORES (DADOS DE POKER)
-- =============================================
CREATE TABLE IF NOT EXISTS `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` int(11) DEFAULT NULL COMMENT 'Vinculação com usuário (futuro)',
  -- Estatísticas de poker
  `total_sessions` int(11) DEFAULT 0,
  `total_buyin` decimal(10,2) DEFAULT 0.00,
  `total_cashout` decimal(10,2) DEFAULT 0.00,
  `total_profit` decimal(10,2) DEFAULT 0.00,
  `win_rate` decimal(5,2) DEFAULT 0.00,
  `avg_session_time` int(11) DEFAULT 0 COMMENT 'Tempo médio em minutos',
  `best_session` decimal(10,2) DEFAULT 0.00,
  `worst_session` decimal(10,2) DEFAULT 0.00,
  `last_played` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `is_active_idx` (`is_active`),
  KEY `name_idx` (`name`),
  CONSTRAINT `players_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. TABELA DE SESSÕES
-- =============================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `location` varchar(255) NOT NULL DEFAULT 'Local não informado',
  `status` enum('pending','approved','closed') DEFAULT 'pending',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  -- Dados dos jogadores (JSON)
  `players_data` json DEFAULT NULL,
  -- Configurações da sessão
  `session_fee` decimal(8,2) DEFAULT 0.00,
  `janta_fee` decimal(8,2) DEFAULT 0.00,
  `rake_percentage` decimal(5,2) DEFAULT 0.00,
  -- Totais calculados
  `total_buyin` decimal(10,2) DEFAULT 0.00,
  `total_cashout` decimal(10,2) DEFAULT 0.00,
  `total_profit` decimal(10,2) DEFAULT 0.00,
  `players_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `date_idx` (`date`),
  KEY `status_idx` (`status`),
  KEY `created_by_idx` (`created_by`),
  CONSTRAINT `sessions_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sessions_creator_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. TABELA DE CONVITES
-- =============================================
CREATE TABLE IF NOT EXISTS `user_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `invited_by_user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `role` enum('admin','player') DEFAULT 'player',
  `invite_token` varchar(128) NOT NULL,
  `status` enum('pending','accepted','expired','cancelled') DEFAULT 'pending',
  `expires_at` timestamp NOT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Vinculação com jogador (futuro)
  `player_id` int(11) DEFAULT NULL COMMENT 'Jogador a ser vinculado ao aceitar',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_unique` (`invite_token`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `email_idx` (`email`),
  KEY `status_idx` (`status`),
  KEY `expires_at_idx` (`expires_at`),
  CONSTRAINT `invites_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invites_inviter_fk` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. TABELA DE LOGS DE AUDITORIA
-- =============================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(64) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `user_id_idx` (`user_id`),
  KEY `action_idx` (`action`),
  KEY `table_record_idx` (`table_name`, `record_id`),
  KEY `created_at_idx` (`created_at`),
  CONSTRAINT `audit_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. TABELA DE TRANSFERÊNCIAS/PAGAMENTOS
-- =============================================
CREATE TABLE IF NOT EXISTS `player_transfers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `from_player_id` int(11) DEFAULT NULL,
  `to_player_id` int(11) DEFAULT NULL,
  `from_player_name` varchar(255) NOT NULL,
  `to_player_name` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('transfer','session_fee','janta_fee','rake') DEFAULT 'transfer',
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `session_id_idx` (`session_id`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `from_player_idx` (`from_player_id`),
  KEY `to_player_idx` (`to_player_id`),
  KEY `status_idx` (`status`),
  CONSTRAINT `transfers_session_fk` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transfers_tenant_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transfers_from_player_fk` FOREIGN KEY (`from_player_id`) REFERENCES `players` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transfers_to_player_fk` FOREIGN KEY (`to_player_id`) REFERENCES `players` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 8. VIEWS ÚTEIS PARA RELATÓRIOS
-- =============================================

-- View para estatísticas de super admin
CREATE OR REPLACE VIEW `super_admin_stats` AS
SELECT 
  COUNT(DISTINCT t.id) as total_tenants,
  COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN u.id END) as active_users,
  COUNT(DISTINCT p.id) as total_players,
  COUNT(DISTINCT s.id) as total_sessions,
  COALESCE(SUM(s.total_buyin), 0) as total_volume,
  COUNT(DISTINCT CASE WHEN s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN s.id END) as sessions_last_30_days
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN players p ON t.id = p.tenant_id
LEFT JOIN sessions s ON t.id = s.tenant_id;

-- View para dados completos de tenants
CREATE OR REPLACE VIEW `all_tenants_view` AS
SELECT 
  t.*,
  COUNT(DISTINCT u.id) as users_count,
  COUNT(DISTINCT p.id) as players_count,
  COUNT(DISTINCT s.id) as sessions_count,
  COALESCE(SUM(s.total_buyin), 0) as total_volume,
  MAX(s.date) as last_session_date,
  (SELECT name FROM users WHERE tenant_id = t.id AND role IN ('admin', 'super_admin') ORDER BY id LIMIT 1) as admin_name
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = 1
LEFT JOIN players p ON t.id = p.tenant_id AND p.is_active = 1
LEFT JOIN sessions s ON t.id = s.tenant_id
GROUP BY t.id;

-- =============================================
-- 9. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =============================================

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS `sessions_tenant_date_idx` ON `sessions` (`tenant_id`, `date` DESC);
CREATE INDEX IF NOT EXISTS `players_tenant_active_idx` ON `players` (`tenant_id`, `is_active`);
CREATE INDEX IF NOT EXISTS `users_tenant_role_idx` ON `users` (`tenant_id`, `role`);
CREATE INDEX IF NOT EXISTS `invites_tenant_status_idx` ON `user_invites` (`tenant_id`, `status`);

-- =============================================
-- 10. DADOS INICIAIS (SUPER ADMIN)
-- =============================================

-- Inserir tenant padrão para super admin (se não existir)
INSERT IGNORE INTO `tenants` (`id`, `name`, `email`, `plan`, `status`, `max_users`, `max_sessions_per_month`, `approved_at`) 
VALUES (1, 'Poker Manager Admin', 'luis.boff@evcomx.com.br', 'enterprise', 'active', 999, 999, NOW());

-- Inserir super admin (se não existir)
INSERT IGNORE INTO `users` (`id`, `tenant_id`, `name`, `email`, `password_hash`, `role`, `is_active`) 
VALUES (1, 1, 'Luis Fernando Boff', 'luis.boff@evcomx.com.br', '$2y$10$example_hash_change_this', 'super_admin', 1);

-- =============================================
-- 11. TRIGGERS PARA MANTER ESTATÍSTICAS
-- =============================================

-- Trigger para atualizar estatísticas do player após inserir/atualizar sessão
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `update_player_stats_after_session` 
AFTER UPDATE ON `sessions` 
FOR EACH ROW 
BEGIN
    -- Só processa se os dados dos jogadores mudaram ou status mudou para 'closed'
    IF NEW.players_data != OLD.players_data OR (NEW.status = 'closed' AND OLD.status != 'closed') THEN
        -- Aqui poderia ter lógica para atualizar estatísticas dos players
        -- Por enquanto, deixamos vazio (será implementado via PHP)
        SET @dummy = 0;
    END IF;
END//
DELIMITER ;

-- =============================================
-- FINALIZAÇÃO
-- =============================================

-- Verificar se as principais tabelas existem
SELECT 'Tabelas criadas com sucesso!' as Status;

-- Verificar contagem de registros principais
SELECT 
    (SELECT COUNT(*) FROM tenants) as tenants_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM players) as players_count;

-- Testar views
SELECT COUNT(*) as tenants_view_count FROM all_tenants_view;
SELECT * FROM super_admin_stats;

-- =============================================
-- SCRIPT CONCLUÍDO COM SUCESSO
-- =============================================