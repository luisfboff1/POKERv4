-- =============================================
-- SCRIPT ULTRA-BÁSICO PARA HOSTINGER/MARIADB
-- =============================================
-- Versão que evita COMPLETAMENTE information_schema
-- Para hostings com máxima restrição
-- =============================================

-- Definir charset (sem verificações)
SET sql_mode = '';
SET foreign_key_checks = 0;

-- =============================================
-- 1. TENANTS (CLIENTES/GRUPOS) - VERSÃO BÁSICA
-- =============================================
DROP TABLE IF EXISTS `tenants`;
CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `plan` varchar(20) DEFAULT 'basic',
  `status` varchar(20) DEFAULT 'pending',
  `max_users` int(11) DEFAULT 10,
  `max_sessions_per_month` int(11) DEFAULT 50,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `suspended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 2. USUÁRIOS (LOGIN/AUTENTICAÇÃO) - VERSÃO BÁSICA
-- =============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 3. JOGADORES (DADOS DE POKER) - VERSÃO BÁSICA
-- =============================================
DROP TABLE IF EXISTS `players`;
CREATE TABLE `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
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

-- =============================================
-- 4. SESSÕES - VERSÃO BÁSICA
-- =============================================
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `location` varchar(255) NOT NULL DEFAULT 'Local não informado',
  `status` varchar(20) DEFAULT 'pending',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `players_data` longtext DEFAULT NULL,
  `session_fee` decimal(8,2) DEFAULT 0.00,
  `janta_fee` decimal(8,2) DEFAULT 0.00,
  `rake_percentage` decimal(5,2) DEFAULT 0.00,
  `total_buyin` decimal(10,2) DEFAULT 0.00,
  `total_cashout` decimal(10,2) DEFAULT 0.00,
  `total_profit` decimal(10,2) DEFAULT 0.00,
  `players_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 5. CONVITES - VERSÃO BÁSICA
-- =============================================
DROP TABLE IF EXISTS `user_invites`;
CREATE TABLE `user_invites` (
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
-- 6. LOGS DE AUDITORIA - VERSÃO BÁSICA
-- =============================================
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
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
-- 7. DADOS INICIAIS
-- =============================================

-- Inserir tenant padrão para super admin
INSERT INTO `tenants` (`id`, `name`, `email`, `plan`, `status`, `max_users`, `max_sessions_per_month`, `approved_at`) 
VALUES (1, 'Poker Manager Admin', 'luis.boff@evcomx.com.br', 'enterprise', 'active', 999, 999, NOW());

-- Inserir super admin (alterar senha depois!)
INSERT INTO `users` (`id`, `tenant_id`, `name`, `email`, `password_hash`, `role`, `is_active`) 
VALUES (1, 1, 'Luis Fernando Boff', 'luis.boff@evcomx.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 1);

-- =============================================
-- 8. ADICIONAR ÍNDICES BÁSICOS (SEM VERIFICAÇÃO)
-- =============================================

-- Índices para tenants
ALTER TABLE `tenants` ADD UNIQUE KEY `email_unique` (`email`);

-- Índices para users
ALTER TABLE `users` ADD UNIQUE KEY `email_unique` (`email`);
ALTER TABLE `users` ADD KEY `tenant_id_idx` (`tenant_id`);

-- Índices para players
ALTER TABLE `players` ADD KEY `tenant_id_idx` (`tenant_id`);
ALTER TABLE `players` ADD KEY `name_idx` (`name`);

-- Índices para sessions
ALTER TABLE `sessions` ADD KEY `tenant_id_idx` (`tenant_id`);
ALTER TABLE `sessions` ADD KEY `date_idx` (`date`);
ALTER TABLE `sessions` ADD KEY `created_by_idx` (`created_by`);

-- Índices para user_invites
ALTER TABLE `user_invites` ADD UNIQUE KEY `token_unique` (`invite_token`);
ALTER TABLE `user_invites` ADD KEY `tenant_id_idx` (`tenant_id`);
ALTER TABLE `user_invites` ADD KEY `email_idx` (`email`);
ALTER TABLE `user_invites` ADD KEY `expires_at_idx` (`expires_at`);

-- Índices para audit_logs
ALTER TABLE `audit_logs` ADD KEY `tenant_id_idx` (`tenant_id`);
ALTER TABLE `audit_logs` ADD KEY `user_id_idx` (`user_id`);
ALTER TABLE `audit_logs` ADD KEY `action_idx` (`action`);
ALTER TABLE `audit_logs` ADD KEY `created_at_idx` (`created_at`);

-- =============================================
-- 9. VERIFICAÇÃO FINAL
-- =============================================

SELECT 'Banco criado com sucesso!' as Status;
SELECT COUNT(*) as tenants_count FROM tenants;
SELECT COUNT(*) as users_count FROM users;

-- Reativar verificações
SET foreign_key_checks = 1;

-- =============================================
-- PRÓXIMOS PASSOS MANUAIS
-- =============================================

-- 1. ALTERE A SENHA DO SUPER ADMIN:
-- UPDATE users SET password_hash = 'NOVO_HASH_BCRYPT' WHERE id = 1;

-- 2. CONFIGURE AS VARIÁVEIS DE AMBIENTE (.env):
-- DB_HOST=localhost
-- DB_NAME=u903000160_poker
-- DB_USER=u903000160_poker
-- DB_PASSWORD=sua_senha_hostinger

-- 3. TESTE A CONEXÃO VIA PHP

-- =============================================
-- SCRIPT ULTRA-BÁSICO CONCLUÍDO
-- =============================================