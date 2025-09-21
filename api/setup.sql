-- ========================================
-- SETUP ATUALIZADO PARA SISTEMA SAAS
-- ========================================
-- IMPORTANTE: Para migração completa, use api/setup_saas.sql
-- Este arquivo mantém compatibilidade com sistema atual

-- Criar tabela de tenants (clientes)
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
    plan ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic',
    max_sessions_per_month INT DEFAULT 50,
    approved_at TIMESTAMP NULL,
    approved_by VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de sessões (atualizada com tenant_id)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    date DATE DEFAULT (CURRENT_DATE),
    players_data JSON COMMENT 'Dados dos jogadores: buy-ins, cash-out, janta, etc.',
    recommendations JSON COMMENT 'Recomendações de pagamento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_tenant_date (tenant_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir tenant admin padrão
INSERT IGNORE INTO tenants (
    id, name, email, status, plan, 
    max_sessions_per_month, approved_at, approved_by
) VALUES (
    1, 'Admin', 'luisfboff@hotmail.com', 'active', 'enterprise',
    999999, NOW(), 'system'
);