-- ========================================
-- MIGRAÇÃO SEGURA DE DADOS EXISTENTES
-- ========================================
-- Execute este script APÓS o setup_saas.sql
-- se você já tiver dados no sistema atual

-- ========================================
-- 1. BACKUP DE SEGURANÇA
-- ========================================
-- IMPORTANTE: Faça backup antes de executar!
-- mysqldump -u [usuario] -p [nome_banco] > backup_antes_migracao.sql

-- ========================================
-- 2. VERIFICAR SE JÁ EXISTE COLUNA TENANT_ID
-- ========================================
-- Este script verifica se a migração já foi feita
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'sessions' 
AND COLUMN_NAME = 'tenant_id';

-- ========================================
-- 3. CRIAR TENANT ADMIN SE NÃO EXISTIR
-- ========================================
INSERT IGNORE INTO tenants (
    id,
    name, 
    email, 
    status, 
    plan, 
    max_sessions_per_month, 
    max_users, 
    approved_at, 
    approved_by
) VALUES (
    1,
    'Luis Boff - Admin',
    'luisfboff@hotmail.com',
    'active',
    'enterprise',
    999999,
    999999,
    NOW(),
    'system'
);

-- ========================================
-- 4. MIGRAÇÃO CONDICIONAL DA TABELA SESSIONS
-- ========================================
-- Só executa se a coluna tenant_id NÃO existir
SET @sql = CASE 
    WHEN @col_exists = 0 THEN 
        'ALTER TABLE sessions ADD COLUMN tenant_id INT NOT NULL DEFAULT 1 AFTER id'
    ELSE 
        'SELECT "Coluna tenant_id já existe" as status'
END;

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- 5. ADICIONAR FOREIGN KEY SE NECESSÁRIO
-- ========================================
-- Verificar se a FK já existe
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'sessions'
AND CONSTRAINT_NAME LIKE '%tenant%';

SET @sql = CASE 
    WHEN @fk_exists = 0 THEN 
        'ALTER TABLE sessions ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
    ELSE 
        'SELECT "Foreign Key já existe" as status'
END;

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- 6. ATUALIZAR SESSÕES EXISTENTES
-- ========================================
-- Garantir que todas as sessões existentes pertencem ao tenant admin (ID 1)
UPDATE sessions 
SET tenant_id = 1 
WHERE tenant_id = 0 OR tenant_id IS NULL;

-- ========================================
-- 7. CRIAR USUÁRIO ADMIN PADRÃO
-- ========================================
-- IMPORTANTE: Você precisa gerar um hash de senha real!
-- Use: password_hash('sua_senha', PASSWORD_DEFAULT) no PHP
-- Ou online: https://phppasswordhash.com/

INSERT IGNORE INTO users (
    tenant_id,
    name,
    email,
    password_hash,
    role,
    is_active
) VALUES (
    1,
    'Luis Boff',
    'luisfboff@hotmail.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- TROCAR ESTA SENHA!
    'admin',
    TRUE
);

-- ========================================
-- 8. VERIFICAÇÕES FINAIS
-- ========================================

-- Contar registros migrados
SELECT 
    'MIGRAÇÃO CONCLUÍDA' as status,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM sessions WHERE tenant_id = 1) as sessions_migradas,
    NOW() as data_migracao;

-- Verificar estrutura da tabela sessions
DESCRIBE sessions;

-- ========================================
-- 9. PRÓXIMOS PASSOS APÓS A MIGRAÇÃO
-- ========================================
/*
1. GERAR SENHA SEGURA:
   - Acesse: https://phppasswordhash.com/
   - Digite sua senha
   - Copie o hash gerado
   - Execute: UPDATE users SET password_hash = 'HASH_AQUI' WHERE email = 'luisfboff@hotmail.com';

2. TESTAR LOGIN:
   - Criar endpoint de teste para verificar se a senha funciona
   - Testar criação de sessão com tenant_id

3. BACKUP FINAL:
   - Fazer novo backup após migração bem-sucedida

4. IMPLEMENTAR APIs:
   - Sistema de autenticação
   - Middleware de tenant
   - Atualizar endpoints existentes
*/
