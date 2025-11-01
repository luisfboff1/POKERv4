-- RESTAURAÇÃO RÁPIDA - Apenas estrutura + dados essenciais
-- Execute: npx supabase db execute --file restore_via_cli.sql --linked

-- Criar tabelas essenciais
CREATE TABLE IF NOT EXISTS poker.tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    plan VARCHAR(20) DEFAULT 'basic',
    status VARCHAR(20) DEFAULT 'pending',
    max_users INTEGER DEFAULT 10,
    max_sessions_per_month INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS poker.users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    player_id INTEGER
);

CREATE TABLE IF NOT EXISTS poker.players (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    phone VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id INTEGER,
    total_sessions INTEGER DEFAULT 0,
    total_buyin NUMERIC(10,2) DEFAULT 0.00,
    total_cashout NUMERIC(10,2) DEFAULT 0.00,
    total_profit NUMERIC(10,2) DEFAULT 0.00,
    win_rate NUMERIC(5,2) DEFAULT 0.00,
    avg_session_time INTEGER DEFAULT 0,
    best_session NUMERIC(10,2) DEFAULT 0.00,
    worst_session NUMERIC(10,2) DEFAULT 0.00,
    last_played TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS poker.sessions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    location VARCHAR(255) DEFAULT 'Local não informado',
    status VARCHAR(20) DEFAULT 'pending',
    created_by INTEGER NOT NULL REFERENCES poker.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    players_data JSONB,
    recommendations JSONB,
    paid_transfers JSONB,
    session_fee NUMERIC(8,2) DEFAULT 0.00,
    janta_fee NUMERIC(8,2) DEFAULT 0.00,
    rake_percentage NUMERIC(5,2) DEFAULT 0.00,
    total_buyin NUMERIC(10,2) DEFAULT 0.00,
    total_cashout NUMERIC(10,2) DEFAULT 0.00,
    total_profit NUMERIC(10,2) DEFAULT 0.00,
    players_count INTEGER DEFAULT 0
);

-- Inserir dados
INSERT INTO poker.tenants VALUES (1, 'Poker Manager Admin', 'luisfboff@hotmail.com', NULL, 'enterprise', 'active', 999, 999, '2025-10-19 20:40:49.106026+00', '2025-10-30 20:09:05.145204+00', '2025-10-19 20:40:49.106026+00', NULL);
INSERT INTO poker.users VALUES (1, 1, 'Luis Fernando Boff', 'luisfboff@hotmail.com', '$2b$10$jnceZg5YrU3QCdWEzWWBeeWa2.ktPU7J.fc0ymdayAiysfaG7z2bi', 'super_admin', true, '2025-10-22 13:56:40.016+00', '2025-10-19 20:40:49.106026+00', '2025-10-30 20:09:30.845795+00', NULL);

INSERT INTO poker.players (id, tenant_id, name, is_active, created_at, updated_at, total_sessions, total_buyin, total_cashout, total_profit, win_rate, avg_session_time, best_session, worst_session) VALUES
(1, 1, 'luis', true, '2025-10-19 21:26:46.315109+00', '2025-10-25 21:30:04.046861+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(7, 1, 'maschio', true, '2025-10-21 22:37:11.07885+00', '2025-10-22 12:26:59.532709+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(8, 1, 'luiggi', true, '2025-10-21 22:37:41.519137+00', '2025-10-24 00:16:17.716298+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(9, 1, 'folle', true, '2025-10-21 22:37:47.440392+00', '2025-10-30 20:09:58.347643+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(10, 1, 'jean', true, '2025-10-21 22:37:51.428925+00', '2025-10-22 12:26:59.236714+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(11, 1, 'charles', true, '2025-10-21 22:38:01.430448+00', '2025-10-30 20:09:57.600733+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(12, 1, 'fernando', true, '2025-10-21 22:38:05.496143+00', '2025-10-30 20:09:57.953789+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(13, 1, 'cristian', true, '2025-10-21 23:43:16.832832+00', '2025-10-30 20:09:57.979309+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(14, 1, 'debona', true, '2025-10-21 23:43:24.497473+00', '2025-10-30 20:09:58.563779+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(15, 1, 'Brugger', true, '2025-10-24 00:16:28.075491+00', '2025-10-30 20:09:57.73933+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(16, 1, 'Baiano', true, '2025-10-24 00:16:37.878403+00', '2025-10-30 20:09:58.658521+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(17, 1, 'Giba', true, '2025-10-24 00:16:44.829406+00', '2025-10-25 21:30:04.32083+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00),
(18, 1, 'Vitinho', true, '2025-10-24 00:17:08.884708+00', '2025-10-25 21:30:04.006629+00', 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00);

-- Atualizar sequences
SELECT setval('poker.tenants_id_seq', 1, true);
SELECT setval('poker.users_id_seq', 1, true);
SELECT setval('poker.players_id_seq', 18, true);

-- Permissões
GRANT ALL ON ALL TABLES IN SCHEMA poker TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA poker TO authenticated, service_role;
