-- =============================================
-- SCRIPT COMPLETO PARA HOSTINGER/MARIADB
-- =============================================
-- Versão que cria todas as colunas necessárias
-- Evita erros adicionando colunas apenas se não existirem
-- =============================================

SET sql_mode = '';
SET foreign_key_checks = 0;

-- =============================================
-- 1. TENANTS - TABELA COMPLETA
-- =============================================
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `plan` varchar(20) DEFAULT 'basic',
  `status` varchar(20) DEFAULT 'pending',
  `max_users` int(11) DEFAULT 10,
  `max_sessions_per_month` int(11) DEFAULT 50,
  `approval_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `suspended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicionar colunas que podem estar faltando
ALTER TABLE `tenants` 
ADD COLUMN IF NOT EXISTS `company` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `approval_token` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `approved_by` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `suspended_at` timestamp NULL DEFAULT NULL;

-- =============================================
-- 2. USERS - TABELA COMPLETA
-- =============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) DEFAULT 'player',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `player_id` int(11) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicionar colunas que podem estar faltando
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `phone` varchar(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `login_attempts` int(11) DEFAULT 0,
ADD COLUMN IF NOT EXISTS `locked_until` timestamp NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `reset_token` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `reset_token_expires` timestamp NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `preferences` json DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `avatar_url` varchar(500) DEFAULT NULL;

-- =============================================
-- 3. PLAYERS - TABELA COMPLETA
-- =============================================
CREATE TABLE IF NOT EXISTS `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_normalized` varchar(255) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` int(11) DEFAULT NULL,
  `total_sessions` int(11) DEFAULT 0,
  `total_buyin` decimal(10,2) DEFAULT 0.00,
  `total_cashout` decimal(10,2) DEFAULT 0.00,
  `total_profit` decimal(10,2) DEFAULT 0.00,
  `win_rate` decimal(5,2) DEFAULT 0.00,
  `avg_session_time` int(11) DEFAULT 0,
  `best_session` decimal(10,2) DEFAULT 0.00,
  `worst_session` decimal(10,2) DEFAULT 0.00,
  `last_played` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicionar colunas que podem estar faltando
ALTER TABLE `players` 
ADD COLUMN IF NOT EXISTS `name_normalized` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `email` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `status` varchar(20) DEFAULT 'active';

-- Preencher name_normalized se estiver vazio
UPDATE `players` SET `name_normalized` = LOWER(name) WHERE `name_normalized` IS NULL OR `name_normalized` = '';

-- =============================================
-- 4. SESSIONS - TABELA COMPLETA
-- =============================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `location` varchar(255) NOT NULL DEFAULT 'Local não informado',
  `status` varchar(20) DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `players_data` longtext DEFAULT NULL,
  `recommendations` longtext DEFAULT NULL,
  `session_fee` decimal(8,2) DEFAULT 0.00,
  `janta_fee` decimal(8,2) DEFAULT 0.00,
  `rake_percentage` decimal(5,2) DEFAULT 0.00,
  `total_buyin` decimal(10,2) DEFAULT 0.00,
  `total_cashout` decimal(10,2) DEFAULT 0.00,
  `total_profit` decimal(10,2) DEFAULT 0.00,
  `players_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicionar colunas que podem estar faltando
ALTER TABLE `sessions` 
ADD COLUMN IF NOT EXISTS `recommendations` longtext DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `approved_by` int(11) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL;

-- =============================================
-- 5. USER_INVITES - TABELA COMPLETA
-- =============================================
CREATE TABLE IF NOT EXISTS `user_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `invited_by_user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'player',
  `invite_token` varchar(128) NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `expires_at` timestamp NOT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `player_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 6. USER_SESSIONS - TABELA COMPLETA
-- =============================================
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `refresh_token` varchar(255) DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `refresh_expires_at` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 7. AUDIT_LOGS - TABELA COMPLETA
-- =============================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(64) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_data` longtext DEFAULT NULL,
  `new_data` longtext DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 8. DADOS INICIAIS (SE NÃO EXISTIREM)
-- =============================================

-- Inserir tenant padrão
INSERT IGNORE INTO `tenants` (`id`, `name`, `email`, `plan`, `status`, `max_users`, `max_sessions_per_month`, `approved_at`) 
VALUES (1, 'Poker Manager Admin', 'luisfboff@hotmail.com', 'enterprise', 'active', 999, 999, NOW());

-- Inserir super admin
INSERT IGNORE INTO `users` (`id`, `tenant_id`, `name`, `email`, `password_hash`, `role`, `is_active`) 
VALUES (1, 1, 'Luis Boff', 'luisfboff@hotmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- =============================================
-- 9. ÍNDICES (SE NÃO EXISTIREM)
-- =============================================

-- Tenants
ALTER TABLE `tenants` ADD UNIQUE KEY IF NOT EXISTS `email_unique` (`email`);

-- Users
ALTER TABLE `users` ADD UNIQUE KEY IF NOT EXISTS `email_unique` (`email`);
ALTER TABLE `users` ADD KEY IF NOT EXISTS `tenant_id_idx` (`tenant_id`);
ALTER TABLE `users` ADD KEY IF NOT EXISTS `player_id_idx` (`player_id`);

-- Players
ALTER TABLE `players` ADD KEY IF NOT EXISTS `tenant_id_idx` (`tenant_id`);
ALTER TABLE `players` ADD KEY IF NOT EXISTS `name_idx` (`name`);
ALTER TABLE `players` ADD KEY IF NOT EXISTS `user_id_idx` (`user_id`);
ALTER TABLE `players` ADD UNIQUE KEY IF NOT EXISTS `tenant_name_unique` (`tenant_id`, `name_normalized`);

-- Sessions
ALTER TABLE `sessions` ADD KEY IF NOT EXISTS `tenant_id_idx` (`tenant_id`);
ALTER TABLE `sessions` ADD KEY IF NOT EXISTS `date_idx` (`date`);
ALTER TABLE `sessions` ADD KEY IF NOT EXISTS `created_by_idx` (`created_by`);
ALTER TABLE `sessions` ADD KEY IF NOT EXISTS `status_idx` (`status`);

-- User Invites
ALTER TABLE `user_invites` ADD UNIQUE KEY IF NOT EXISTS `token_unique` (`invite_token`);
ALTER TABLE `user_invites` ADD KEY IF NOT EXISTS `tenant_id_idx` (`tenant_id`);
ALTER TABLE `user_invites` ADD KEY IF NOT EXISTS `email_idx` (`email`);

-- User Sessions
ALTER TABLE `user_sessions` ADD KEY IF NOT EXISTS `user_id_idx` (`user_id`);
ALTER TABLE `user_sessions` ADD KEY IF NOT EXISTS `token_hash_idx` (`token_hash`);
ALTER TABLE `user_sessions` ADD KEY IF NOT EXISTS `expires_at_idx` (`expires_at`);

-- Audit Logs
ALTER TABLE `audit_logs` ADD KEY IF NOT EXISTS `tenant_id_idx` (`tenant_id`);
ALTER TABLE `audit_logs` ADD KEY IF NOT EXISTS `user_id_idx` (`user_id`);
ALTER TABLE `audit_logs` ADD KEY IF NOT EXISTS `action_idx` (`action`);
ALTER TABLE `audit_logs` ADD KEY IF NOT EXISTS `created_at_idx` (`created_at`);

-- =============================================
-- 10. VIEWS ÚTEIS
-- =============================================

CREATE OR REPLACE VIEW `players_with_users` AS
SELECT 
  p.*,
  u.id as user_account_id,
  u.email as user_email,
  u.last_login,
  CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as has_user_account
FROM players p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.is_active = 1;

CREATE OR REPLACE VIEW `all_tenants_view` AS
SELECT 
  t.*,
  COUNT(DISTINCT u.id) as users_count,
  COUNT(DISTINCT p.id) as players_count,
  COUNT(DISTINCT s.id) as sessions_count,
  COALESCE(SUM(s.total_buyin), 0) as total_volume,
  MAX(s.date) as last_session_date
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = 1
LEFT JOIN players p ON t.id = p.tenant_id AND p.is_active = 1
LEFT JOIN sessions s ON t.id = s.tenant_id
GROUP BY t.id;

-- =============================================
-- 11. VERIFICAÇÃO FINAL
-- =============================================

SELECT 'Banco atualizado com sucesso!' as Status;
SELECT COUNT(*) as tenants_count FROM tenants;
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as players_count FROM players;

-- Reativar verificações
SET foreign_key_checks = 1;

-- =============================================
-- PRÓXIMOS PASSOS
-- =============================================
-- 1. Teste o login com: luisfboff@hotmail.com / password
-- 2. Verifique se todas as funcionalidades estão funcionando
-- 3. Se necessário, importe dados de exemplo com sample_data.sql