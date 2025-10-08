-- ========================================
-- SETUP COMPLETO PARA SISTEMA SAAS POKER
-- ========================================
-- Este arquivo contém toda a estrutura necessária para transformar
-- o sistema atual em um SaaS multi-tenant

-- ========================================
-- 1. TABELA DE TENANTS/CLIENTES
-- ========================================
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Nome da empresa/cliente',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email principal do cliente',
    phone VARCHAR(20) NULL COMMENT 'Telefone de contato',
    company VARCHAR(255) NULL COMMENT 'Nome da empresa (opcional)',
    
    -- Status e aprovação
    status ENUM('pending', 'active', 'suspended', 'cancelled') DEFAULT 'pending' COMMENT 'Status do tenant',
    plan ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic' COMMENT 'Plano contratado',
    
    -- Controle de aprovação
    approval_token VARCHAR(255) NULL COMMENT 'Token para aprovação via email',
    approved_at TIMESTAMP NULL COMMENT 'Data de aprovação',
    approved_by VARCHAR(255) NULL COMMENT 'Quem aprovou (admin email)',
    
    -- Limites do plano
    max_sessions_per_month INT DEFAULT 50 COMMENT 'Limite de sessões por mês',
    max_users INT DEFAULT 1 COMMENT 'Limite de usuários',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_approval_token (approval_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 2. TABELA DE USUÁRIOS/LOGIN
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL COMMENT 'ID do tenant/cliente',
    
    -- Dados do usuário
    name VARCHAR(255) NOT NULL COMMENT 'Nome completo',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email de login',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash da senha',
    
    -- Controle de acesso
    role ENUM('admin', 'user') DEFAULT 'user' COMMENT 'Papel do usuário',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Usuário ativo/inativo',
    
    -- Tokens para reset de senha
    reset_token VARCHAR(255) NULL COMMENT 'Token para reset de senha',
    reset_token_expires TIMESTAMP NULL COMMENT 'Expiração do token de reset',
    
    -- Último acesso
    last_login TIMESTAMP NULL COMMENT 'Último login',
    login_attempts INT DEFAULT 0 COMMENT 'Tentativas de login falhadas',
    locked_until TIMESTAMP NULL COMMENT 'Conta bloqueada até',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 3. TABELA DE JOGADORES
-- ========================================
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL COMMENT 'ID do tenant/cliente',
    
    -- Dados do jogador
    name VARCHAR(255) NOT NULL COMMENT 'Nome do jogador',
    name_normalized VARCHAR(255) NOT NULL COMMENT 'Nome normalizado (lowercase, sem acentos)',
    email VARCHAR(255) NULL COMMENT 'Email do jogador (opcional)',
    phone VARCHAR(20) NULL COMMENT 'Telefone do jogador (opcional)',
    
    -- Estatísticas
    total_sessions INT DEFAULT 0 COMMENT 'Total de sessões participadas',
    total_buyin DECIMAL(10,2) DEFAULT 0 COMMENT 'Total investido em buy-ins',
    total_cashout DECIMAL(10,2) DEFAULT 0 COMMENT 'Total recebido em cash-outs',
    
    -- Status
    status ENUM('active', 'inactive') DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints e índices
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_per_tenant (tenant_id, name_normalized),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_name_normalized (name_normalized),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 4. MODIFICAR TABELA SESSIONS EXISTENTE
-- ========================================

-- Adicionar coluna tenant_id apenas se não existir
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sessions' AND COLUMN_NAME = 'tenant_id');
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sessions' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME = 'tenants');

-- Adicionar coluna se não existir
SET @sql := IF(@col_exists = 0, 'ALTER TABLE sessions ADD COLUMN tenant_id INT NOT NULL AFTER id;', 'SELECT "Coluna tenant_id já existe";');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Adicionar chave estrangeira se não existir
SET @sql := IF(@fk_exists = 0, 'ALTER TABLE sessions ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;', 'SELECT "Chave estrangeira já existe";');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Adicionar índice para performance
ALTER TABLE sessions ADD INDEX idx_tenant_id (tenant_id);
ALTER TABLE sessions ADD INDEX idx_tenant_date (tenant_id, date);

-- ========================================
-- 5. TABELA DE SESSÕES JWT (OPCIONAL)
-- ========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL COMMENT 'Hash do JWT token',
    expires_at TIMESTAMP NOT NULL COMMENT 'Expiração do token',
    ip_address VARCHAR(45) NULL COMMENT 'IP do usuário',
    user_agent TEXT NULL COMMENT 'User agent do browser',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 6. TABELA DE LOGS DE AUDITORIA
-- ========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'Ação realizada (login, create_session, etc)',
    table_name VARCHAR(50) NULL COMMENT 'Tabela afetada',
    record_id INT NULL COMMENT 'ID do registro afetado',
    old_data JSON NULL COMMENT 'Dados antigos',
    new_data JSON NULL COMMENT 'Dados novos',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 7. DADOS INICIAIS
-- ========================================

-- Inserir tenant principal (você como admin)
INSERT INTO tenants (
    name, 
    email, 
    status, 
    plan, 
    max_sessions_per_month, 
    max_users, 
    approved_at, 
    approved_by
) VALUES (
    'Luis Boff - Admin',
    'luisfboff@hotmail.com',
    'active',
    'enterprise',
    999999, -- Ilimitado
    999999, -- Ilimitado
    NOW(),
    'system'
) ON DUPLICATE KEY UPDATE
    status = 'active',
    plan = 'enterprise';

-- Criar usuário admin principal
INSERT INTO users (
    tenant_id,
    name,
    email,
    password_hash, -- Você vai precisar gerar isso
    role
) VALUES (
    1, -- ID do tenant criado acima
    'Luis Boff',
    'luisfboff@hotmail.com',
    '$2y$10$11b2733540d544aee69bb0fba559581177ce7a2a75b6ab0877159', -- Hash da senha Poker2025!
    'admin'
) ON DUPLICATE KEY UPDATE
    role = 'admin';

-- ========================================
-- 7. MIGRAÇÃO DE DADOS EXISTENTES
-- ========================================
-- Atualizar sessões existentes para pertencerem ao tenant admin
UPDATE sessions 
SET tenant_id = 1 
WHERE tenant_id IS NULL OR tenant_id = 0;

-- ========================================
-- 8. VIEWS ÚTEIS
-- ========================================

-- View para estatísticas de tenants
CREATE OR REPLACE VIEW tenant_stats AS
SELECT 
    t.id,
    t.name,
    t.email,
    t.status,
    t.plan,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT DATE_FORMAT(s.created_at, '%Y-%m')) as active_months,
    MAX(s.created_at) as last_session,
    t.created_at as tenant_since
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN sessions s ON t.id = s.tenant_id
GROUP BY t.id;

-- View para sessões por tenant (com filtro de data)
CREATE OR REPLACE VIEW tenant_sessions AS
SELECT 
    s.*,
    t.name as tenant_name,
    t.email as tenant_email,
    t.plan as tenant_plan,
    u.name as created_by_user
FROM sessions s
JOIN tenants t ON s.tenant_id = t.id
LEFT JOIN users u ON s.tenant_id = u.tenant_id AND u.role = 'admin';

-- ========================================
-- 9. STORED PROCEDURES ÚTEIS
-- ========================================

DELIMITER //

-- Procedure para aprovar tenant
CREATE PROCEDURE ApproveTenant(
    IN p_tenant_id INT,
    IN p_approved_by VARCHAR(255)
)
BEGIN
    UPDATE tenants 
    SET 
        status = 'active',
        approved_at = NOW(),
        approved_by = p_approved_by,
        approval_token = NULL
    WHERE id = p_tenant_id AND status = 'pending';
    
    SELECT ROW_COUNT() as affected_rows;
END //

-- Procedure para verificar limites do plano
CREATE PROCEDURE CheckTenantLimits(
    IN p_tenant_id INT,
    OUT p_can_create_session BOOLEAN,
    OUT p_current_sessions_this_month INT,
    OUT p_max_sessions INT
)
BEGIN
    DECLARE current_month_sessions INT DEFAULT 0;
    DECLARE max_sessions INT DEFAULT 0;
    
    -- Buscar limite do plano
    SELECT max_sessions_per_month INTO max_sessions
    FROM tenants WHERE id = p_tenant_id;
    
    -- Contar sessões do mês atual
    SELECT COUNT(*) INTO current_month_sessions
    FROM sessions 
    WHERE tenant_id = p_tenant_id 
    AND MONTH(created_at) = MONTH(NOW())
    AND YEAR(created_at) = YEAR(NOW());
    
    SET p_current_sessions_this_month = current_month_sessions;
    SET p_max_sessions = max_sessions;
    SET p_can_create_session = (current_month_sessions < max_sessions);
END //

DELIMITER ;

-- ========================================
-- FINALIZADO!
-- ========================================
-- Para aplicar este setup:
-- 1. Faça backup do banco atual
-- 2. Execute este script no seu MySQL
-- 3. Gere uma senha hash para o usuário admin
-- 4. Atualize a senha no registro do usuário admin
-- 
-- PRÓXIMOS PASSOS:
-- - Implementar APIs de autenticação
-- - Criar middleware de tenant
-- - Atualizar frontend com sistema de login
