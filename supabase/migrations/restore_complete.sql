-- RESTORE COMPLETO DO BACKUP - POKER SCHEMA
-- Execute este script no Supabase SQL Editor
-- https://supabase.com/dashboard/project/jhodhxvvhohygijqcxbo/sql/new

-- PASSO 1: Recriar schema poker
DROP SCHEMA IF EXISTS poker CASCADE;
CREATE SCHEMA poker;
ALTER SCHEMA poker OWNER TO postgres;
GRANT USAGE ON SCHEMA poker TO authenticated, service_role;

-- PASSO 2: Criar tabelas
CREATE TABLE poker.tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    plan VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
    max_users INTEGER DEFAULT 10,
    max_sessions_per_month INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ
);

CREATE TABLE poker.users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('super_admin', 'admin', 'player')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    player_id INTEGER
);

CREATE TABLE poker.players (
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

CREATE TABLE poker.sessions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    location VARCHAR(255) DEFAULT 'Local não informado' NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'closed')),
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

CREATE TABLE poker.user_invites (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
    invited_by_user_id INTEGER NOT NULL REFERENCES poker.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('admin', 'player')),
    invite_token VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    player_id INTEGER
);

CREATE TABLE poker.audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(64),
    record_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poker.player_transfers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES poker.sessions(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
    from_player_id INTEGER,
    to_player_id INTEGER,
    from_player_name VARCHAR(255) NOT NULL,
    to_player_name VARCHAR(255) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    type VARCHAR(20) DEFAULT 'transfer' CHECK (type IN ('transfer', 'session_fee', 'janta_fee', 'rake')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASSO 3: Criar índices
CREATE INDEX idx_tenants_status ON poker.tenants(status);
CREATE INDEX idx_tenants_email ON poker.tenants(email);
CREATE INDEX idx_users_tenant_id ON poker.users(tenant_id);
CREATE INDEX idx_users_email ON poker.users(email);
CREATE INDEX idx_players_tenant_id ON poker.players(tenant_id);
CREATE INDEX idx_sessions_tenant_id ON poker.sessions(tenant_id);
CREATE INDEX idx_sessions_date ON poker.sessions(date DESC);

-- PASSO 4: Inserir dados do backup
-- Tenants
INSERT INTO poker.tenants (id, name, email, phone, plan, status, max_users, max_sessions_per_month, created_at, updated_at, approved_at, suspended_at) VALUES
(1, 'Poker Manager Admin', 'luisfboff@hotmail.com', NULL, 'enterprise', 'active', 999, 999, '2025-10-19 20:40:49.106026+00', '2025-10-30 20:09:05.145204+00', '2025-10-19 20:40:49.106026+00', NULL);

-- Users
INSERT INTO poker.users (id, tenant_id, name, email, password_hash, role, is_active, last_login, created_at, updated_at, player_id) VALUES
(1, 1, 'Luis Fernando Boff', 'luisfboff@hotmail.com', '$2b$10$jnceZg5YrU3QCdWEzWWBeeWa2.ktPU7J.fc0ymdayAiysfaG7z2bi', 'super_admin', true, '2025-10-22 13:56:40.016+00', '2025-10-19 20:40:49.106026+00', '2025-10-30 20:09:30.845795+00', NULL);

-- Players
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
(18, 1, 'Vitinho', NULL, NULL, NULL, true, '2025-10-24 00:17:08.884708+00', '2025-10-25 21:30:04.006629+00', NULL, 0, 0.00, 0.00, 0.00, 0.00, 0, 0.00, 0.00, NULL);

-- PASSO 5: Atualizar sequences
SELECT setval('poker.tenants_id_seq', 1, true);
SELECT setval('poker.users_id_seq', 1, true);
SELECT setval('poker.players_id_seq', 18, true);
SELECT setval('poker.sessions_id_seq', 6, true);
SELECT setval('poker.user_invites_id_seq', 1, false);
SELECT setval('poker.audit_logs_id_seq', 53, true);
SELECT setval('poker.player_transfers_id_seq', 1, false);

-- PASSO 6: Conceder permissões
GRANT ALL ON ALL TABLES IN SCHEMA poker TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA poker TO authenticated, service_role;

-- Sucesso! Schema poker restaurado com dados do backup de 30/10/2025
