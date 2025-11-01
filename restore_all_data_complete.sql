-- ===================================================================
-- RESTAURAÇÃO COMPLETA - TODOS OS DADOS DO BACKUP
-- ===================================================================
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jhodhxvvhohygijqcxbo/sql/new
-- ===================================================================

-- 1. LIMPAR DADOS EXISTENTES (mantém estrutura)
-- ===================================================================
TRUNCATE TABLE poker.audit_logs CASCADE;
TRUNCATE TABLE poker.player_transfers CASCADE;
TRUNCATE TABLE poker.sessions CASCADE;
TRUNCATE TABLE poker.players CASCADE;
TRUNCATE TABLE poker.users CASCADE;
TRUNCATE TABLE poker.user_invites CASCADE;
TRUNCATE TABLE poker.tenants CASCADE;

-- 2. RESTAURAR TENANT
-- ===================================================================
INSERT INTO poker.tenants (id, name, slug, contact_email, created_at, updated_at, is_active, max_users, max_players, subscription_status)
VALUES (1, 'Casa Luis', 'casa-luis', 'luisfboff@hotmail.com', '2025-10-19 21:26:02.895736+00', '2025-10-19 21:26:02.895736+00', true, 10, 50, 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. RESTAURAR USUÁRIO
-- ===================================================================
-- IMPORTANTE: A migration add_user_tenants_multi_home_game.sql adicionou current_tenant_id
-- e criou a tabela user_tenants para suporte multi-tenant

INSERT INTO poker.users (id, tenant_id, name, email, password_hash, role, created_at, updated_at, is_active, player_id, current_tenant_id, supabase_user_id)
VALUES (
  1,
  1,
  'Luis Fernando Boff',
  'luis.boff@evcomx.com.br',
  '$2b$10$wZG1S9Ij6WFZpDAZpKrI3Ok4c7V12H/Oo.LlxiQlKB96wn8e.qz6m',
  'admin',
  '2025-10-19 21:26:02.979882+00',
  '2025-11-01 21:49:38.982885+00',
  true,
  1, -- player_id vinculado ao jogador "luis"
  1, -- current_tenant_id para multi-tenant
  (SELECT id FROM auth.users WHERE email = 'luisfboff@hotmail.com' LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  player_id = 1,
  current_tenant_id = 1,
  supabase_user_id = (SELECT id FROM auth.users WHERE email = 'luisfboff@hotmail.com' LIMIT 1);

-- 3.1 RESTAURAR USER_TENANTS (tabela criada pela migration multi-tenant)
-- ===================================================================
-- Esta tabela é necessária para a nova arquitetura multi-tenant
INSERT INTO poker.user_tenants (user_id, tenant_id, role, player_id, is_active, created_at, updated_at)
VALUES (
  1, -- user_id
  1, -- tenant_id
  'admin', -- role
  1, -- player_id vinculado
  true,
  '2025-10-19 21:26:02.979882+00',
  NOW()
)
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  player_id = 1,
  role = 'admin',
  is_active = true;

-- 4. RESTAURAR JOGADORES (13 jogadores)
-- ===================================================================
INSERT INTO poker.players (id, tenant_id, name, nickname, phone, notes, is_active, created_at, updated_at, user_id, total_sessions, total_buyin, total_cashout, total_profit, win_rate, avg_session_time, best_session, worst_session, last_played) VALUES
(1, 1, 'luis', NULL, NULL, NULL, true, '2025-10-19 21:26:46.315109+00', '2025-10-25 21:30:04.046861+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(7, 1, 'maschio', NULL, NULL, NULL, true, '2025-10-21 22:37:11.07885+00', '2025-10-22 12:26:59.532709+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(8, 1, 'luiggi', NULL, NULL, NULL, true, '2025-10-21 22:37:41.519137+00', '2025-10-24 00:16:17.716298+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(9, 1, 'folle', NULL, NULL, NULL, true, '2025-10-21 22:37:47.440392+00', '2025-10-30 20:09:58.347643+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(10, 1, 'jean', NULL, NULL, NULL, true, '2025-10-21 22:37:51.428925+00', '2025-10-22 12:26:59.236714+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(11, 1, 'charles', NULL, NULL, NULL, true, '2025-10-21 22:38:01.430448+00', '2025-10-30 20:09:57.600733+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(12, 1, 'fernando', NULL, NULL, NULL, true, '2025-10-21 22:38:05.496143+00', '2025-10-30 20:09:57.953789+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(13, 1, 'cristian', NULL, NULL, NULL, true, '2025-10-21 23:43:16.832832+00', '2025-10-30 20:09:57.979309+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(14, 1, 'debona', NULL, NULL, NULL, true, '2025-10-21 23:43:24.497473+00', '2025-10-30 20:09:58.563779+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(15, 1, 'Brugger', NULL, NULL, NULL, true, '2025-10-24 00:16:28.075491+00', '2025-10-30 20:09:57.73933+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(16, 1, 'Baiano', NULL, NULL, NULL, true, '2025-10-24 00:16:37.878403+00', '2025-10-30 20:09:58.658521+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(17, 1, 'Giba', NULL, NULL, NULL, true, '2025-10-24 00:16:44.829406+00', '2025-10-25 21:30:04.32083+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL),
(18, 1, 'Vitinho', NULL, NULL, NULL, true, '2025-10-24 00:17:08.884708+00', '2025-10-25 21:30:04.006629+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. RESTAURAR SESSÕES (2 sessões com JSONB completo)
-- ===================================================================

-- Sessão #4 (2025-10-21) - 9 jogadores
INSERT INTO poker.sessions (
  id, tenant_id, date, location, status, created_by, created_at, updated_at, 
  approved_at, closed_at, players_data, recommendations, paid_transfers, 
  session_fee, janta_fee, rake_percentage, total_buyin, total_cashout, total_profit, players_count
) VALUES (
  4,
  1,
  '2025-10-21',
  'casa',
  'closed',
  1,
  '2025-10-22 12:30:17.877626+00',
  '2025-10-24 00:19:44.349708+00',
  NULL,
  NULL,
  '[{"id": "10", "name": "jean", "buyin": 50, "balance": -50, "cashout": 0, "janta_paid": true, "session_paid": false}, {"id": "13", "name": "cristian", "buyin": 100, "balance": 101.5, "cashout": 201.5, "janta_paid": true, "session_paid": false}, {"id": "14", "name": "debona", "buyin": 50, "balance": 180.5, "cashout": 230.5, "janta_paid": true, "session_paid": false}, {"id": "9", "name": "folle", "buyin": 150, "balance": -150, "cashout": 0, "janta_paid": true, "session_paid": false}, {"id": "12", "name": "fernando", "buyin": 100, "balance": -54, "cashout": 46, "janta_paid": true, "session_paid": false}, {"id": "11", "name": "charles", "buyin": 50, "balance": 57.5, "cashout": 107.5, "janta_paid": true, "session_paid": false}, {"id": "8", "name": "luiggi", "buyin": 200, "balance": -135, "cashout": 65, "janta_paid": true, "session_paid": false}, {"id": "1", "name": "luis", "buyin": 50, "balance": 33.5, "cashout": 83.5, "janta_paid": true, "session_paid": false}, {"id": "7", "name": "maschio", "buyin": 50, "balance": 16, "cashout": 66, "janta_paid": true, "session_paid": false}]'::jsonb,
  '[{"to": "debona", "from": "folle", "amount": 150}, {"to": "debona", "from": "luiggi", "amount": 30.5}, {"to": "cristian", "from": "luiggi", "amount": 101.5}, {"to": "charles", "from": "luiggi", "amount": 3}, {"to": "charles", "from": "fernando", "amount": 54}, {"to": "charles", "from": "jean", "amount": 0.5}, {"to": "luis", "from": "jean", "amount": 33.5}, {"to": "maschio", "from": "jean", "amount": 16}]'::jsonb,
  '{"jean_luis": true, "folle_debona": true, "jean_charles": true, "jean_maschio": true, "luiggi_debona": true, "luiggi_charles": true, "luiggi_cristian": true, "fernando_charles": true}'::jsonb,
  0.00,
  0.00,
  0.00,
  650.00,
  800.00,
  0.00,
  9
) ON CONFLICT (id) DO NOTHING;

-- Sessão #5 (2025-09-17) - 9 jogadores
INSERT INTO poker.sessions (
  id, tenant_id, date, location, status, created_by, created_at, updated_at, 
  approved_at, closed_at, players_data, recommendations, paid_transfers, 
  session_fee, janta_fee, rake_percentage, total_buyin, total_cashout, total_profit, players_count
) VALUES (
  5,
  1,
  '2025-09-17',
  'casa',
  'approved',
  1,
  '2025-10-24 00:18:53.498683+00',
  '2025-10-24 00:19:06.705777+00',
  NULL,
  NULL,
  '[{"id": "13", "name": "cristian", "buyin": 50, "balance": 67.5, "cashout": 117.5, "janta_paid": false, "session_paid": false}, {"id": "12", "name": "fernando", "buyin": 100, "balance": -82.5, "cashout": 17.5, "janta_paid": false, "session_paid": false}, {"id": "1", "name": "luis", "buyin": 50, "balance": 179, "cashout": 229, "janta_paid": false, "session_paid": false}, {"id": "8", "name": "luiggi", "buyin": 100, "balance": -50, "cashout": 50, "janta_paid": false, "session_paid": false}, {"id": "14", "name": "debona", "buyin": 100, "balance": -100, "cashout": 0, "janta_paid": false, "session_paid": false}, {"id": "15", "name": "Brugger", "buyin": 50, "balance": -50, "cashout": 0, "janta_paid": false, "session_paid": false}, {"id": "16", "name": "Baiano", "buyin": 50, "balance": 65, "cashout": 115, "janta_paid": false, "session_paid": false}, {"id": "17", "name": "Giba", "buyin": 50, "balance": 71, "cashout": 121, "janta_paid": false, "session_paid": false}, {"id": "18", "name": "Vitinho", "buyin": 100, "balance": -100, "cashout": 0, "janta_paid": false, "session_paid": false}]'::jsonb,
  '[{"to": "luis", "from": "debona", "amount": 100}, {"to": "luis", "from": "Vitinho", "amount": 79}, {"to": "Giba", "from": "Vitinho", "amount": 21}, {"to": "Giba", "from": "fernando", "amount": 50}, {"to": "cristian", "from": "fernando", "amount": 32.5}, {"to": "cristian", "from": "luiggi", "amount": 35}, {"to": "Baiano", "from": "luiggi", "amount": 15}, {"to": "Baiano", "from": "Brugger", "amount": 50}]'::jsonb,
  '{"debona_luis": true, "Vitinho_Giba": true, "Vitinho_luis": true, "fernando_Giba": true, "luiggi_Baiano": true, "Brugger_Baiano": true, "luiggi_cristian": true, "fernando_cristian": true}'::jsonb,
  0.00,
  0.00,
  0.00,
  650.00,
  650.00,
  0.00,
  9
) ON CONFLICT (id) DO NOTHING;

-- 6. ATUALIZAR SEQUENCES
-- ===================================================================
SELECT setval('poker.tenants_id_seq', 1, true);
SELECT setval('poker.users_id_seq', 1, true);
SELECT setval('poker.players_id_seq', 18, true);
SELECT setval('poker.sessions_id_seq', 5, true);

-- 7. VERIFICAÇÃO FINAL
-- ===================================================================
SELECT 
  'TENANTS' as tabela,
  COUNT(*) as registros
FROM poker.tenants

UNION ALL

SELECT 
  'USERS' as tabela,
  COUNT(*) as registros
FROM poker.users

UNION ALL

SELECT 
  'USER_TENANTS' as tabela,
  COUNT(*) as registros
FROM poker.user_tenants

UNION ALL

SELECT 
  'PLAYERS' as tabela,
  COUNT(*) as registros
FROM poker.players

UNION ALL

SELECT 
  'SESSIONS' as tabela,
  COUNT(*) as registros
FROM poker.sessions

UNION ALL

SELECT 
  'AUDIT_LOGS' as tabela,
  COUNT(*) as registros
FROM poker.audit_logs;

-- Verificar vinculação player_id (CRÍTICO PARA O GRÁFICO APARECER)
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  u.player_id as player_id_users_table,
  u.current_tenant_id,
  ut.player_id as player_id_user_tenants_table,
  ut.role,
  p.name as player_name
FROM poker.users u
LEFT JOIN poker.user_tenants ut ON ut.user_id = u.id AND ut.tenant_id = u.current_tenant_id
LEFT JOIN poker.players p ON p.id = COALESCE(ut.player_id, u.player_id)
WHERE u.id = 1;

-- Verificar sessões com detalhes
SELECT 
  id,
  date,
  location,
  status,
  jsonb_array_length(players_data) as players_count,
  jsonb_array_length(recommendations) as transfers_count,
  total_buyin,
  total_cashout
FROM poker.sessions
ORDER BY date DESC;
