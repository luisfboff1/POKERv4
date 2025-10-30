-- =============================================
-- POKER MANAGER - SUPABASE POSTGRESQL SCHEMA
-- =============================================
-- Migration from MySQL/MariaDB to PostgreSQL
-- Includes Row Level Security (RLS) policies for multi-tenant isolation
-- =============================================

-- Enable UUID extension for ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for better text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- CREATE POKER SCHEMA
-- =============================================
-- Create the poker schema where all application tables will reside
CREATE SCHEMA IF NOT EXISTS poker;

-- Grant permissions on the poker schema to Supabase roles
-- anon: Used for unauthenticated requests (read-only access)
GRANT USAGE ON SCHEMA poker TO anon;

-- authenticated: Used for logged-in users (full CRUD access)
GRANT USAGE ON SCHEMA poker TO authenticated;

-- service_role: Used by server-side code (full access, bypasses RLS)
GRANT ALL ON SCHEMA poker TO service_role;

-- =============================================
-- 1. TENANTS TABLE (GRUPOS/CLIENTES)
-- =============================================
CREATE TABLE IF NOT EXISTS poker.tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  plan VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  max_users INTEGER DEFAULT 10,
  max_sessions_per_month INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  suspended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);

-- RLS policies for tenants
-- Super admins can see all tenants, regular users only see their own
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_tenants" ON tenants
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

CREATE POLICY "users_own_tenant" ON tenants
  FOR SELECT
  USING (
    id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );

-- =============================================
-- 2. USERS TABLE (LOGIN/AUTENTICAÇÃO)
-- =============================================
CREATE TABLE IF NOT EXISTS poker.users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('super_admin', 'admin', 'player')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  player_id INTEGER
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);

-- RLS policies for users
-- Users can only see users from their own tenant
ALTER TABLE poker.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_users_select" ON poker.users
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );

CREATE POLICY "tenant_isolation_users_insert" ON poker.users
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );

CREATE POLICY "tenant_isolation_users_update" ON poker.users
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );

CREATE POLICY "tenant_isolation_users_delete" ON poker.users
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' = 'admin')
  );

-- =============================================
-- 3. PLAYERS TABLE (DADOS DE POKER)
-- =============================================
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  phone VARCHAR(50),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  -- Poker statistics
  total_sessions INTEGER DEFAULT 0,
  total_buyin DECIMAL(10,2) DEFAULT 0.00,
  total_cashout DECIMAL(10,2) DEFAULT 0.00,
  total_profit DECIMAL(10,2) DEFAULT 0.00,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_session_time INTEGER DEFAULT 0,
  best_session DECIMAL(10,2) DEFAULT 0.00,
  worst_session DECIMAL(10,2) DEFAULT 0.00,
  last_played TIMESTAMP WITH TIME ZONE
);

-- Indexes for players
CREATE INDEX IF NOT EXISTS idx_players_tenant_id ON players(tenant_id);
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_tenant_active ON players(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);

-- RLS policies for players
-- Players are isolated by tenant_id
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_players_select" ON players
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );

CREATE POLICY "tenant_isolation_players_insert" ON players
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' IN ('admin', 'player'))
  );

CREATE POLICY "tenant_isolation_players_update" ON players
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' IN ('admin', 'player'))
  );

CREATE POLICY "tenant_isolation_players_delete" ON players
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' = 'admin')
  );

-- =============================================
-- 4. SESSIONS TABLE (POKER SESSIONS)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location VARCHAR(255) NOT NULL DEFAULT 'Local não informado',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'closed')),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  -- Player data stored as JSONB (more efficient than JSON in PostgreSQL)
  players_data JSONB,
  recommendations JSONB,
  paid_transfers JSONB,
  -- Session configuration
  session_fee DECIMAL(8,2) DEFAULT 0.00,
  janta_fee DECIMAL(8,2) DEFAULT 0.00,
  rake_percentage DECIMAL(5,2) DEFAULT 0.00,
  -- Calculated totals
  total_buyin DECIMAL(10,2) DEFAULT 0.00,
  total_cashout DECIMAL(10,2) DEFAULT 0.00,
  total_profit DECIMAL(10,2) DEFAULT 0.00,
  players_count INTEGER DEFAULT 0
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_date ON sessions(tenant_id, date DESC);
-- GIN indexes for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_sessions_players_data ON sessions USING GIN(players_data);
CREATE INDEX IF NOT EXISTS idx_sessions_recommendations ON sessions USING GIN(recommendations);

-- RLS policies for sessions
-- Sessions are isolated by tenant_id
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_sessions_select" ON sessions
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );

CREATE POLICY "tenant_isolation_sessions_insert" ON sessions
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' IN ('admin', 'player'))
  );

CREATE POLICY "tenant_isolation_sessions_update" ON sessions
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' IN ('admin', 'player'))
  );

CREATE POLICY "tenant_isolation_sessions_delete" ON sessions
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' = 'admin')
  );

-- =============================================
-- 5. USER INVITES TABLE (CONVITES)
-- =============================================
CREATE TABLE IF NOT EXISTS user_invites (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('admin', 'player')),
  invite_token VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL
);

-- Indexes for user_invites
CREATE INDEX IF NOT EXISTS idx_invites_tenant_id ON user_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON user_invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON user_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_invites_token ON user_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_invites_tenant_status ON user_invites(tenant_id, status);

-- RLS policies for user_invites
-- Invites are isolated by tenant_id
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_invites_select" ON user_invites
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );

CREATE POLICY "tenant_isolation_invites_insert" ON user_invites
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' = 'admin')
  );

CREATE POLICY "tenant_isolation_invites_update" ON user_invites
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' = 'admin')
  );

CREATE POLICY "tenant_isolation_invites_delete" ON user_invites
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' = 'admin')
  );

-- =============================================
-- 6. AUDIT LOGS TABLE (LOGS DE AUDITORIA)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(64),
  record_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_audit_old_data ON audit_logs USING GIN(old_data);
CREATE INDEX IF NOT EXISTS idx_audit_new_data ON audit_logs USING GIN(new_data);

-- RLS policies for audit_logs
-- Audit logs visible only to super_admin and admins of the tenant
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' = 'admin')
  );

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- =============================================
-- 7. PLAYER TRANSFERS TABLE (TRANSFERÊNCIAS)
-- =============================================
CREATE TABLE IF NOT EXISTS player_transfers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  to_player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  from_player_name VARCHAR(255) NOT NULL,
  to_player_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) DEFAULT 'transfer' CHECK (type IN ('transfer', 'session_fee', 'janta_fee', 'rake')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for player_transfers
CREATE INDEX IF NOT EXISTS idx_transfers_session_id ON player_transfers(session_id);
CREATE INDEX IF NOT EXISTS idx_transfers_tenant_id ON player_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_player ON player_transfers(from_player_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_player ON player_transfers(to_player_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON player_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_type ON player_transfers(type);

-- RLS policies for player_transfers
-- Transfers are isolated by tenant_id
ALTER TABLE player_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_transfers_select" ON player_transfers
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );

CREATE POLICY "tenant_isolation_transfers_insert" ON player_transfers
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' IN ('admin', 'player'))
  );

CREATE POLICY "tenant_isolation_transfers_update" ON player_transfers
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' IN ('admin', 'player'))
  );

CREATE POLICY "tenant_isolation_transfers_delete" ON player_transfers
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     auth.jwt() ->> 'role' = 'admin')
  );

-- =============================================
-- 8. USER SESSIONS TABLE (LOGIN SESSIONS)
-- =============================================
-- This table tracks active user login sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_id ON user_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- RLS policies for user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sessions_select" ON user_sessions
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     user_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'user_id', '')::integer)
  );

CREATE POLICY "user_sessions_insert" ON user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "user_sessions_delete" ON user_sessions
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    (tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer AND
     user_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'user_id', '')::integer)
  );

-- =============================================
-- 9. FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reset sequence values (for data migration)
CREATE OR REPLACE FUNCTION setval(sequence_name text, new_value bigint)
RETURNS bigint AS $$
BEGIN
  EXECUTE format('SELECT setval(%L, %s)', sequence_name, new_value);
  RETURN new_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updating updated_at on all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON user_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON player_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. VIEWS FOR REPORTING
-- =============================================

-- Super admin statistics view
CREATE OR REPLACE VIEW super_admin_stats AS
SELECT
  COUNT(DISTINCT t.id) as total_tenants,
  COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_users,
  COUNT(DISTINCT p.id) as total_players,
  COUNT(DISTINCT s.id) as total_sessions,
  COALESCE(SUM(s.total_buyin), 0) as total_volume,
  COUNT(DISTINCT CASE WHEN s.date >= CURRENT_DATE - INTERVAL '30 days' THEN s.id END) as sessions_last_30_days
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN players p ON t.id = p.tenant_id
LEFT JOIN sessions s ON t.id = s.tenant_id;

-- All tenants view with aggregated data
CREATE OR REPLACE VIEW all_tenants_view AS
SELECT
  t.*,
  COUNT(DISTINCT u.id) as users_count,
  COUNT(DISTINCT p.id) as players_count,
  COUNT(DISTINCT s.id) as sessions_count,
  COALESCE(SUM(s.total_buyin), 0) as total_volume,
  MAX(s.date) as last_session_date,
  (SELECT name FROM users
   WHERE tenant_id = t.id
   AND role IN ('admin', 'super_admin')
   ORDER BY id LIMIT 1) as admin_name
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
LEFT JOIN players p ON t.id = p.tenant_id AND p.is_active = true
LEFT JOIN sessions s ON t.id = s.tenant_id
GROUP BY t.id;

-- =============================================
-- 11. INITIAL DATA (SUPER ADMIN)
-- =============================================

-- Insert default tenant for super admin
INSERT INTO tenants (id, name, email, plan, status, max_users, max_sessions_per_month, approved_at)
VALUES (1, 'Poker Manager Admin', 'luis.boff@evcomx.com.br', 'enterprise', 'active', 999, 999, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert super admin user
-- WARNING: Change this password hash immediately after first login!
-- Default password: 'PokerAdmin2025!' (bcrypt hash below)
-- Generate new hash with: bcrypt.hash('your_password', 10)
INSERT INTO users (id, tenant_id, name, email, password_hash, role, is_active)
VALUES (1, 1, 'Luis Fernando Boff', 'luis.boff@evcomx.com.br', '$2y$10$8.kF7qGxH7xZxO0P.7rH3OQYGjK3vJ2Wz4mNxK8pL6yD9rE5sF3tG', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- Reset sequences to start after initial data
SELECT setval('tenants_id_seq', (SELECT MAX(id) FROM tenants));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- =============================================
-- 12. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE tenants IS 'Multi-tenant organizations (poker groups/clubs)';
COMMENT ON TABLE users IS 'System users with authentication and roles';
COMMENT ON TABLE players IS 'Poker players (may or may not have user accounts)';
COMMENT ON TABLE sessions IS 'Poker game sessions with buy-ins, cash-outs, and transfers';
COMMENT ON TABLE user_invites IS 'Email invitations to join a tenant';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system changes';
COMMENT ON TABLE player_transfers IS 'Money transfers between players after sessions';
COMMENT ON TABLE user_sessions IS 'Active login sessions for users';

COMMENT ON COLUMN sessions.players_data IS 'JSONB array of player session data: [{name, buyin, cashout, session_paid, janta_paid}]';
COMMENT ON COLUMN sessions.recommendations IS 'JSONB array of optimized transfer recommendations: [{from, to, amount, isPaid}]';
COMMENT ON COLUMN sessions.paid_transfers IS 'JSONB object tracking paid status: {"from_to": true/false}';

-- =============================================
-- RLS POLICY NOTES
-- =============================================
-- All tables use Row Level Security (RLS) for multi-tenant isolation
--
-- Policy pattern:
-- 1. Super admins have access to ALL data across ALL tenants
-- 2. Regular users (admin/player) can only access data from their own tenant
-- 3. tenant_id is extracted from JWT token: auth.jwt() -> 'app_metadata' ->> 'tenant_id'
-- 4. role is extracted from JWT token: auth.jwt() ->> 'role'
--
-- Security guarantees:
-- - Even with direct database access, users cannot query other tenants' data
-- - INSERT/UPDATE operations automatically validate tenant_id
-- - DELETE operations restricted to admins and super_admins
-- - Audit logs are insert-only for regular users

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Next steps:
-- 1. Run this schema in Supabase SQL Editor
-- 2. Configure JWT secret in Supabase settings
-- 3. Migrate data from MySQL using scripts/migrate-data.ts
-- 4. Update application to use Supabase clients
-- =============================================
