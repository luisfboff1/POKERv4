-- ========================================
-- SCRIPT DE TESTE DA ESTRUTURA SAAS
-- ========================================
-- Execute após setup_saas.sql para testar se tudo está funcionando

-- ========================================
-- 1. TESTAR CRIAÇÃO DE TENANTS
-- ========================================
INSERT INTO tenants (name, email, status, plan) VALUES 
('Empresa Teste A', 'teste.a@email.com', 'active', 'basic'),
('Empresa Teste B', 'teste.b@email.com', 'pending', 'premium');

-- ========================================
-- 2. TESTAR CRIAÇÃO DE USUÁRIOS
-- ========================================
INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES 
(2, 'João Silva', 'joao@teste.a.com', '$2y$10$teste123', 'admin'),
(2, 'Maria Santos', 'maria@teste.a.com', '$2y$10$teste456', 'user'),
(3, 'Pedro Costa', 'pedro@teste.b.com', '$2y$10$teste789', 'admin');

-- ========================================
-- 3. TESTAR CRIAÇÃO DE SESSÕES
-- ========================================
INSERT INTO sessions (tenant_id, date, players_data, recommendations) VALUES 
(2, '2024-01-15', '{"players": [{"name": "João", "buyIn": 100}]}', '{"recommendations": "teste"}'),
(2, '2024-01-16', '{"players": [{"name": "Maria", "buyIn": 150}]}', '{"recommendations": "teste2"}'),
(3, '2024-01-17', '{"players": [{"name": "Pedro", "buyIn": 200}]}', '{"recommendations": "teste3"}');

-- ========================================
-- 4. VERIFICAÇÕES E CONSULTAS
-- ========================================

-- Verificar tenants criados
SELECT 'TENANTS CRIADOS:' as teste;
SELECT id, name, email, status, plan, created_at FROM tenants ORDER BY id;

-- Verificar usuários criados
SELECT 'USUÁRIOS CRIADOS:' as teste;
SELECT u.id, u.name, u.email, u.role, t.name as tenant_name 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
ORDER BY u.id;

-- Verificar sessões com tenant
SELECT 'SESSÕES COM TENANT:' as teste;
SELECT s.id, s.tenant_id, s.date, t.name as tenant_name, s.created_at 
FROM sessions s 
JOIN tenants t ON s.tenant_id = t.id 
ORDER BY s.id;

-- ========================================
-- 5. TESTAR FILTROS POR TENANT
-- ========================================

-- Sessões do tenant 2 apenas
SELECT 'SESSÕES DO TENANT 2:' as teste;
SELECT * FROM sessions WHERE tenant_id = 2;

-- Sessões do tenant 3 apenas
SELECT 'SESSÕES DO TENANT 3:' as teste;
SELECT * FROM sessions WHERE tenant_id = 3;

-- ========================================
-- 6. TESTAR VIEWS
-- ========================================

-- Estatísticas por tenant
SELECT 'ESTATÍSTICAS POR TENANT:' as teste;
SELECT * FROM tenant_stats;

-- Sessões com informações do tenant
SELECT 'SESSÕES COM INFO DO TENANT:' as teste;
SELECT * FROM tenant_sessions LIMIT 5;

-- ========================================
-- 7. TESTAR STORED PROCEDURES
-- ========================================

-- Testar aprovação de tenant
CALL ApproveTenant(3, 'luisfboff@hotmail.com');

-- Verificar se foi aprovado
SELECT 'TENANT APÓS APROVAÇÃO:' as teste;
SELECT id, name, status, approved_at, approved_by FROM tenants WHERE id = 3;

-- Testar limites do tenant
CALL CheckTenantLimits(2, @can_create, @current_sessions, @max_sessions);
SELECT 
    'VERIFICAÇÃO DE LIMITES:' as teste,
    @can_create as pode_criar_sessao,
    @current_sessions as sessoes_atuais,
    @max_sessions as limite_maximo;

-- ========================================
-- 8. TESTAR CONSTRAINTS E INTEGRIDADE
-- ========================================

-- Tentar criar usuário com tenant inexistente (deve falhar)
SELECT 'TESTANDO CONSTRAINT - DEVE FALHAR:' as teste;
-- INSERT INTO users (tenant_id, name, email, password_hash) VALUES (999, 'Teste', 'teste@fail.com', 'hash');

-- Tentar criar sessão com tenant inexistente (deve falhar)
-- INSERT INTO sessions (tenant_id, date, players_data) VALUES (999, NOW(), '{}');

-- ========================================
-- 9. LIMPEZA DOS DADOS DE TESTE
-- ========================================

-- Remover dados de teste (descomente se quiser limpar)
/*
DELETE FROM sessions WHERE tenant_id IN (2, 3);
DELETE FROM users WHERE tenant_id IN (2, 3);
DELETE FROM tenants WHERE id IN (2, 3);
*/

-- ========================================
-- 10. RELATÓRIO FINAL
-- ========================================
SELECT 
    'TESTE CONCLUÍDO' as status,
    NOW() as data_teste,
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM sessions) as total_sessions;

-- Verificar se todas as tabelas foram criadas
SELECT 
    TABLE_NAME as tabela_criada,
    TABLE_ROWS as total_registros
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('tenants', 'users', 'sessions', 'user_sessions', 'audit_logs')
ORDER BY TABLE_NAME;
