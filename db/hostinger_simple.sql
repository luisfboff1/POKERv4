-- =============================================
-- SCRIPT SIMPLIFICADO PARA HOSTINGER/MARIADB
-- =============================================
-- Versão específica para hostings com restrições
-- Remove dependências de information_schema
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
  UNIQUE KEY `email_unique` (`email`)
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
  `player_id` int(11) DEFAULT NULL COMMENT 'Vinculação com jogador',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  KEY `tenant_id_idx` (`tenant_id`)
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
  `user_id` int(11) DEFAULT NULL COMMENT 'Vinculação com usuário',
  `total_sessions` int(11) DEFAULT 0,
  `total_buyin` decimal(10,2) DEFAULT 0.00,
  `total_cashout` decimal(10,2) DEFAULT 0.00,
  `total_profit` decimal(10,2) DEFAULT 0.00,
  `win_rate` decimal(5,2) DEFAULT 0.00,
  `avg_session_time` int(11) DEFAULT 0,
  `best_session` decimal(10,2) DEFAULT 0.00,
  `worst_session` decimal(10,2) DEFAULT 0.00,
  `last_played` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `name_idx` (`name`)
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
  `players_data` json DEFAULT NULL,
  `session_fee` decimal(8,2) DEFAULT 0.00,
  `janta_fee` decimal(8,2) DEFAULT 0.00,
  `rake_percentage` decimal(5,2) DEFAULT 0.00,
  `total_buyin` decimal(10,2) DEFAULT 0.00,
  `total_cashout` decimal(10,2) DEFAULT 0.00,
  `total_profit` decimal(10,2) DEFAULT 0.00,
  `players_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `date_idx` (`date`),
  KEY `created_by_idx` (`created_by`)
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
  `player_id` int(11) DEFAULT NULL COMMENT 'Jogador a ser vinculado',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_unique` (`invite_token`),
  KEY `tenant_id_idx` (`tenant_id`),
  KEY `email_idx` (`email`),
  KEY `expires_at_idx` (`expires_at`)
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
  KEY `created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. VIEWS PARA RELATÓRIOS
-- =============================================

-- View para estatísticas de super admin
CREATE OR REPLACE VIEW `super_admin_stats` AS
SELECT 
  COUNT(DISTINCT t.id) as total_tenants,
  COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN u.id END) as active_users,
  COUNT(DISTINCT p.id) as total_players,
  COUNT(DISTINCT s.id) as total_sessions
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
  MAX(s.date) as last_session_date
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = 1
LEFT JOIN players p ON t.id = p.tenant_id AND p.is_active = 1
LEFT JOIN sessions s ON t.id = s.tenant_id
GROUP BY t.id;

-- =============================================
-- 8. DADOS INICIAIS
-- =============================================

-- Inserir tenant padrão para super admin
INSERT IGNORE INTO `tenants` (`id`, `name`, `email`, `plan`, `status`, `max_users`, `max_sessions_per_month`, `approved_at`) 
VALUES (1, 'Poker Manager Admin', 'luis.boff@evcomx.com.br', 'enterprise', 'active', 999, 999, NOW());

-- Inserir super admin (alterar senha depois!)
INSERT IGNORE INTO `users` (`id`, `tenant_id`, `name`, `email`, `password_hash`, `role`, `is_active`) 
VALUES (1, 1, 'Luis Fernando Boff', 'luis.boff@evcomx.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 1);

-- =============================================
-- 9. VERIFICAÇÃO FINAL
-- =============================================

SELECT 'Banco criado com sucesso!' as Status;
SELECT COUNT(*) as tenants_count FROM tenants;
SELECT COUNT(*) as users_count FROM users;
SELECT * FROM super_admin_stats;

-- =============================================
-- PRÓXIMOS PASSOS MANUAIS
-- =============================================

-- 1. ALTERE A SENHA DO SUPER ADMIN:
-- UPDATE users SET password_hash = 'NOVO_HASH_BCRYPT' WHERE id = 1;

-- 2. CONFIGURE AS VARIÁVEIS DE AMBIENTE (.env):
-- DB_HOST=seu_host
-- DB_NAME=seu_banco  
-- DB_USER=seu_usuario
-- DB_PASSWORD=sua_senha

-- 3. TESTE A CONEXÃO VIA PHP

-- =============================================
-- SCRIPT CONCLUÍDO
-- =============================================