-- =============================================
-- DADOS DE EXEMPLO PARA DESENVOLVIMENTO
-- =============================================
-- Execute APENAS em ambiente de desenvolvimento
-- NÃO execute em produção
-- =============================================

-- Limpar dados existentes (CUIDADO!)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE player_transfers;
-- TRUNCATE TABLE audit_logs;
-- TRUNCATE TABLE user_invites;
-- TRUNCATE TABLE sessions;
-- TRUNCATE TABLE players;
-- DELETE FROM users WHERE id > 1;
-- DELETE FROM tenants WHERE id > 1;
-- SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- TENANTS DE EXEMPLO
-- =============================================

INSERT IGNORE INTO tenants (id, name, email, plan, status, max_users, max_sessions_per_month, approved_at) VALUES
(2, 'Grupo Poker Friends', 'admin@pokerfriends.com', 'basic', 'active', 10, 50, NOW()),
(3, 'Club dos Ases', 'contato@clubases.com.br', 'premium', 'active', 25, 100, NOW()),
(4, 'Royal Flush Gaming', 'info@royalflush.net', 'enterprise', 'active', 100, 500, NOW()),
(5, 'Noite de Poker SP', 'sp@noitepoker.com.br', 'basic', 'pending', 10, 50, NULL);

-- =============================================
-- USUÁRIOS DE EXEMPLO
-- =============================================

-- Senha padrão: "123456" (hash do bcrypt)
SET @default_password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

INSERT IGNORE INTO users (id, tenant_id, name, email, password_hash, role, is_active, phone) VALUES
-- Grupo Poker Friends (tenant_id = 2)
(2, 2, 'João Silva', 'joao@pokerfriends.com', @default_password, 'admin', 1, '11999999001'),
(3, 2, 'Maria Santos', 'maria@pokerfriends.com', @default_password, 'player', 1, '11999999002'),
(4, 2, 'Pedro Oliveira', 'pedro@pokerfriends.com', @default_password, 'player', 1, '11999999003'),

-- Club dos Ases (tenant_id = 3)
(5, 3, 'Carlos Mendes', 'carlos@clubases.com.br', @default_password, 'admin', 1, '11999999004'),
(6, 3, 'Ana Costa', 'ana@clubases.com.br', @default_password, 'player', 1, '11999999005'),
(7, 3, 'Roberto Lima', 'roberto@clubases.com.br', @default_password, 'player', 1, '11999999006'),

-- Royal Flush Gaming (tenant_id = 4)
(8, 4, 'Fernando Torres', 'fernando@royalflush.net', @default_password, 'admin', 1, '11999999007'),
(9, 4, 'Lucia Fernandes', 'lucia@royalflush.net', @default_password, 'player', 1, '11999999008'),
(10, 4, 'Marcos Pereira', 'marcos@royalflush.net', @default_password, 'player', 1, '11999999009');

-- =============================================
-- JOGADORES DE EXEMPLO
-- =============================================

INSERT IGNORE INTO players (id, tenant_id, name, nickname, phone, is_active, total_sessions, total_buyin, total_cashout, total_profit, win_rate) VALUES
-- Grupo Poker Friends
(1, 2, 'João Silva', 'Joãozinho', '11999999001', 1, 15, 1500.00, 1650.00, 150.00, 60.00),
(2, 2, 'Maria Santos', 'Mari', '11999999002', 1, 12, 1200.00, 1080.00, -120.00, 41.67),
(3, 2, 'Pedro Oliveira', 'Pedrão', '11999999003', 1, 18, 1800.00, 1890.00, 90.00, 55.56),
(4, 2, 'Lucas Cardoso', 'Lucky', '11999999010', 1, 8, 800.00, 920.00, 120.00, 62.50),

-- Club dos Ases
(5, 3, 'Carlos Mendes', 'Carlão', '11999999004', 1, 25, 5000.00, 5500.00, 500.00, 68.00),
(6, 3, 'Ana Costa', 'Aninha', '11999999005', 1, 20, 2000.00, 1850.00, -150.00, 45.00),
(7, 3, 'Roberto Lima', 'Beto', '11999999006', 1, 22, 2200.00, 2420.00, 220.00, 59.09),
(8, 3, 'Fernanda Souza', 'Fê', '11999999011', 1, 16, 1600.00, 1720.00, 120.00, 56.25),

-- Royal Flush Gaming
(9, 4, 'Fernando Torres', 'Nando', '11999999007', 1, 30, 15000.00, 16200.00, 1200.00, 66.67),
(10, 4, 'Lucia Fernandes', 'Lu', '11999999008', 1, 28, 14000.00, 13300.00, -700.00, 42.86),
(11, 4, 'Marcos Pereira', 'Marcão', '11999999009', 1, 32, 16000.00, 17600.00, 1600.00, 71.88),
(12, 4, 'Patricia Rocha', 'Pati', '11999999012', 1, 24, 12000.00, 12480.00, 480.00, 58.33);

-- =============================================
-- VINCULAR ALGUNS USUÁRIOS COM JOGADORES
-- =============================================

-- Vincular usuários que são também jogadores
UPDATE users SET player_id = 1 WHERE id = 2; -- João Silva
UPDATE users SET player_id = 2 WHERE id = 3; -- Maria Santos
UPDATE users SET player_id = 3 WHERE id = 4; -- Pedro Oliveira
UPDATE users SET player_id = 5 WHERE id = 5; -- Carlos Mendes
UPDATE users SET player_id = 6 WHERE id = 6; -- Ana Costa
UPDATE users SET player_id = 7 WHERE id = 7; -- Roberto Lima

UPDATE players SET user_id = 2 WHERE id = 1; -- João Silva
UPDATE players SET user_id = 3 WHERE id = 2; -- Maria Santos
UPDATE players SET user_id = 4 WHERE id = 3; -- Pedro Oliveira
UPDATE players SET user_id = 5 WHERE id = 5; -- Carlos Mendes
UPDATE players SET user_id = 6 WHERE id = 6; -- Ana Costa
UPDATE players SET user_id = 7 WHERE id = 7; -- Roberto Lima

-- =============================================
-- SESSÕES DE EXEMPLO
-- =============================================

INSERT IGNORE INTO sessions (id, tenant_id, date, location, status, created_by, players_data, total_buyin, total_cashout, players_count, approved_at, closed_at) VALUES
-- Sessões do Grupo Poker Friends
(1, 2, '2024-09-15', 'Casa do João', 'closed', 2, 
'[{"id": 1, "name": "João Silva", "buyin": 100, "cashout": 150}, {"id": 2, "name": "Maria Santos", "buyin": 100, "cashout": 80}, {"id": 3, "name": "Pedro Oliveira", "buyin": 100, "cashout": 120}]', 
300.00, 350.00, 3, NOW(), NOW()),

(2, 2, '2024-09-22', 'Casa do João', 'closed', 2,
'[{"id": 1, "name": "João Silva", "buyin": 150, "cashout": 140}, {"id": 2, "name": "Maria Santos", "buyin": 100, "cashout": 130}, {"id": 4, "name": "Lucas Cardoso", "buyin": 100, "cashout": 80}]',
350.00, 350.00, 3, NOW(), NOW()),

-- Sessões do Club dos Ases
(3, 3, '2024-09-10', 'Clube Recreativo', 'closed', 5,
'[{"id": 5, "name": "Carlos Mendes", "buyin": 200, "cashout": 280}, {"id": 6, "name": "Ana Costa", "buyin": 200, "cashout": 150}, {"id": 7, "name": "Roberto Lima", "buyin": 200, "cashout": 220}]',
600.00, 650.00, 3, NOW(), NOW()),

-- Sessões do Royal Flush Gaming
(4, 4, '2024-09-05', 'Salão Nobre', 'closed', 8,
'[{"id": 9, "name": "Fernando Torres", "buyin": 500, "cashout": 620}, {"id": 10, "name": "Lucia Fernandes", "buyin": 500, "cashout": 420}, {"id": 11, "name": "Marcos Pereira", "buyin": 500, "cashout": 580}]',
1500.00, 1620.00, 3, NOW(), NOW());

-- =============================================
-- CONVITES DE EXEMPLO
-- =============================================

INSERT IGNORE INTO user_invites (id, tenant_id, invited_by_user_id, email, name, role, invite_token, status, expires_at) VALUES
(1, 2, 2, 'novo.jogador@email.com', 'Novo Jogador', 'player', 'invite_example_token_1', 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY)),
(2, 3, 5, 'admin.assistente@clubases.com', 'Assistente Admin', 'admin', 'invite_example_token_2', 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY)),
(3, 4, 8, 'vip.player@royalflush.net', 'Jogador VIP', 'player', 'invite_example_token_3', 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- =============================================
-- LOGS DE AUDITORIA DE EXEMPLO
-- =============================================

INSERT IGNORE INTO audit_logs (tenant_id, user_id, action, table_name, record_id, new_data, ip_address) VALUES
(2, 2, 'create_session', 'sessions', 1, '{"location": "Casa do João", "players": 3}', '192.168.1.100'),
(2, 2, 'send_invite', 'user_invites', 1, '{"email": "novo.jogador@email.com"}', '192.168.1.100'),
(3, 5, 'create_session', 'sessions', 3, '{"location": "Clube Recreativo", "players": 3}', '192.168.1.101'),
(4, 8, 'create_session', 'sessions', 4, '{"location": "Salão Nobre", "players": 3}', '192.168.1.102');

-- =============================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- =============================================

-- Contar registros por tabela
SELECT 'Tenants' as Tabela, COUNT(*) as Total FROM tenants
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Players', COUNT(*) FROM players
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'Invites', COUNT(*) FROM user_invites
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM audit_logs;

-- Mostrar estatísticas por tenant
SELECT 
    t.name as 'Grupo',
    COUNT(DISTINCT u.id) as 'Usuários',
    COUNT(DISTINCT p.id) as 'Jogadores',
    COUNT(DISTINCT s.id) as 'Sessões',
    COALESCE(SUM(s.total_buyin), 0) as 'Volume Total'
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN players p ON t.id = p.tenant_id
LEFT JOIN sessions s ON t.id = s.tenant_id
GROUP BY t.id, t.name
ORDER BY t.id;

SELECT 'Dados de exemplo inseridos com sucesso!' as Status;