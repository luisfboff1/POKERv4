-- ========================================
-- ATUALIZAÇÃO: SISTEMA DE ROLES HIERÁRQUICO
-- ========================================
-- Adicionar role de SUPER ADMIN e ajustar hierarquia

-- 1. Atualizar ENUM de roles na tabela users
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'super_admin') DEFAULT 'user' 
COMMENT 'user=jogador, admin=dono do grupo, super_admin=dono do sistema';

-- 2. Atualizar seu usuário para SUPER ADMIN
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'luisfboff@hotmail.com' AND tenant_id = 1;

-- 3. Criar view para estatísticas globais (apenas super_admin)
CREATE OR REPLACE VIEW super_admin_stats AS
SELECT 
    -- Estatísticas de tenants
    (SELECT COUNT(*) FROM tenants WHERE status = 'active') as active_tenants,
    (SELECT COUNT(*) FROM tenants WHERE status = 'pending') as pending_tenants,
    (SELECT COUNT(*) FROM tenants WHERE status = 'suspended') as suspended_tenants,
    
    -- Estatísticas de usuários
    (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_active_users,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as tenant_admins,
    (SELECT COUNT(*) FROM users WHERE role = 'user') as regular_users,
    (SELECT COUNT(*) FROM users WHERE role = 'super_admin') as super_admins,
    
    -- Estatísticas de sessões
    (SELECT COUNT(*) FROM sessions) as total_sessions,
    (SELECT COUNT(*) FROM sessions WHERE DATE(created_at) = CURDATE()) as sessions_today,
    (SELECT COUNT(*) FROM sessions WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as sessions_this_month,
    
    -- Estatísticas por plano
    (SELECT COUNT(*) FROM tenants WHERE plan = 'basic' AND status = 'active') as basic_plans,
    (SELECT COUNT(*) FROM tenants WHERE plan = 'premium' AND status = 'active') as premium_plans,
    (SELECT COUNT(*) FROM tenants WHERE plan = 'enterprise' AND status = 'active') as enterprise_plans,
    
    -- Receita estimada (simulada)
    (SELECT 
        SUM(CASE 
            WHEN plan = 'basic' THEN 29 
            WHEN plan = 'premium' THEN 59 
            WHEN plan = 'enterprise' THEN 99 
            ELSE 0 
        END) 
     FROM tenants WHERE status = 'active') as estimated_monthly_revenue;

-- 4. Criar view para listar todos os tenants (super_admin)
CREATE OR REPLACE VIEW all_tenants_view AS
SELECT 
    t.id,
    t.name,
    t.email,
    t.phone,
    t.company,
    t.status,
    t.plan,
    t.max_sessions_per_month,
    t.max_users,
    t.created_at,
    t.approved_at,
    t.approved_by,
    
    -- Estatísticas do tenant
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.is_active = 1) as active_users,
    (SELECT COUNT(*) FROM sessions s WHERE s.tenant_id = t.id) as total_sessions,
    (SELECT COUNT(*) FROM sessions s WHERE s.tenant_id = t.id AND MONTH(s.created_at) = MONTH(NOW()) AND YEAR(s.created_at) = YEAR(NOW())) as sessions_this_month,
    (SELECT MAX(s.created_at) FROM sessions s WHERE s.tenant_id = t.id) as last_session_date,
    
    -- Admin do tenant
    (SELECT u.name FROM users u WHERE u.tenant_id = t.id AND u.role = 'admin' LIMIT 1) as admin_name,
    (SELECT u.email FROM users u WHERE u.tenant_id = t.id AND u.role = 'admin' LIMIT 1) as admin_email,
    (SELECT u.last_login FROM users u WHERE u.tenant_id = t.id AND u.role = 'admin' LIMIT 1) as admin_last_login

FROM tenants t
ORDER BY t.created_at DESC;

-- 5. Criar tabela de convites
CREATE TABLE IF NOT EXISTS user_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    invited_by_user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    invite_token VARCHAR(255) NOT NULL,
    status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_invite_token (invite_token),
    INDEX idx_email (email),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Procedure para limpar convites expirados
DELIMITER //
CREATE PROCEDURE CleanExpiredInvites()
BEGIN
    UPDATE user_invites 
    SET status = 'expired' 
    WHERE status = 'pending' AND expires_at < NOW();
    
    SELECT ROW_COUNT() as expired_invites;
END //
DELIMITER ;

-- ========================================
-- VERIFICAÇÕES FINAIS
-- ========================================

-- Verificar se roles foram atualizados
SELECT 'ROLES ATUALIZADOS:' as status;
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Verificar super admin
SELECT 'SUPER ADMIN:' as status;
SELECT name, email, role FROM users WHERE role = 'super_admin';

-- Verificar views criadas
SELECT 'VIEWS CRIADAS:' as status;
SHOW TABLES LIKE '%view%';

-- Verificar estatísticas globais
SELECT 'ESTATÍSTICAS GLOBAIS:' as status;
SELECT * FROM super_admin_stats;
