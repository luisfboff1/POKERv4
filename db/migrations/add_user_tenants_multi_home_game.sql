-- =============================================
-- POKER MANAGER - MULTI-TENANT USER SUPPORT
-- =============================================
-- Migration: Add support for users to participate in multiple tenants (home games)
-- Date: 2025-10-31
-- =============================================

-- =============================================
-- 1. CREATE USER_TENANTS TABLE
-- =============================================
-- This table creates a many-to-many relationship between users and tenants
-- allowing users to participate in multiple home games
CREATE TABLE IF NOT EXISTS poker.user_tenants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES poker.users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('admin', 'player')),
  player_id INTEGER REFERENCES poker.players(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure a user can only have one entry per tenant
  UNIQUE(user_id, tenant_id)
);

-- Indexes for user_tenants
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON poker.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON poker.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_player_id ON poker.user_tenants(player_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_is_active ON poker.user_tenants(is_active);

-- =============================================
-- 2. MIGRATE EXISTING DATA
-- =============================================
-- Migrate existing user-tenant relationships to the new table
INSERT INTO poker.user_tenants (user_id, tenant_id, role, player_id, is_active, created_at)
SELECT 
  u.id,
  u.tenant_id,
  CASE 
    WHEN u.role = 'super_admin' THEN 'admin'::VARCHAR(20)
    ELSE u.role::VARCHAR(20)
  END,
  u.player_id,
  u.is_active,
  u.created_at
FROM poker.users u
WHERE NOT EXISTS (
  SELECT 1 FROM poker.user_tenants ut 
  WHERE ut.user_id = u.id AND ut.tenant_id = u.tenant_id
);

-- =============================================
-- 3. ADD FIELDS TO USERS TABLE
-- =============================================
-- Add current_tenant_id to track the selected tenant
-- Keep tenant_id for backward compatibility (will be deprecated later)
ALTER TABLE poker.users 
ADD COLUMN IF NOT EXISTS current_tenant_id INTEGER REFERENCES poker.tenants(id);

-- Set current_tenant_id to existing tenant_id
UPDATE poker.users 
SET current_tenant_id = tenant_id 
WHERE current_tenant_id IS NULL;

-- =============================================
-- 4. CREATE SESSIONS TABLE FOR UPCOMING GAMES
-- =============================================
-- Add confirmation tracking for upcoming sessions
ALTER TABLE poker.sessions 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS max_players INTEGER,
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

-- Create session confirmations table
CREATE TABLE IF NOT EXISTS poker.session_confirmations (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES poker.sessions(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES poker.players(id) ON DELETE CASCADE,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure a player can only confirm once per session
  UNIQUE(session_id, player_id)
);

-- Indexes for session_confirmations
CREATE INDEX IF NOT EXISTS idx_session_confirmations_session_id ON poker.session_confirmations(session_id);
CREATE INDEX IF NOT EXISTS idx_session_confirmations_player_id ON poker.session_confirmations(player_id);
CREATE INDEX IF NOT EXISTS idx_session_confirmations_confirmed ON poker.session_confirmations(confirmed);

-- =============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on user_tenants
ALTER TABLE poker.user_tenants ENABLE ROW LEVEL SECURITY;

-- Users can see their own tenant memberships
CREATE POLICY "users_see_own_tenant_memberships" ON poker.user_tenants
  FOR SELECT
  USING (
    user_id = (SELECT id FROM poker.users WHERE email = auth.jwt()->>'email')
  );

-- Admins can manage tenant memberships for their tenant
CREATE POLICY "admins_manage_tenant_memberships" ON poker.user_tenants
  FOR ALL
  USING (
    tenant_id IN (
      SELECT ut.tenant_id 
      FROM poker.user_tenants ut
      JOIN poker.users u ON u.id = ut.user_id
      WHERE u.email = auth.jwt()->>'email'
        AND ut.role = 'admin'
    )
  );

-- Enable RLS on session_confirmations
ALTER TABLE poker.session_confirmations ENABLE ROW LEVEL SECURITY;

-- Players can see and manage their own confirmations
CREATE POLICY "players_manage_own_confirmations" ON poker.session_confirmations
  FOR ALL
  USING (
    player_id IN (
      SELECT ut.player_id 
      FROM poker.user_tenants ut
      JOIN poker.users u ON u.id = ut.user_id
      WHERE u.email = auth.jwt()->>'email'
    )
  );

-- Admins can see all confirmations for their tenant's sessions
CREATE POLICY "admins_see_tenant_confirmations" ON poker.session_confirmations
  FOR SELECT
  USING (
    session_id IN (
      SELECT s.id 
      FROM poker.sessions s
      WHERE s.team_id IN (
        SELECT ut.tenant_id 
        FROM poker.user_tenants ut
        JOIN poker.users u ON u.id = ut.user_id
        WHERE u.email = auth.jwt()->>'email'
          AND ut.role = 'admin'
      )
    )
  );

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to get user's tenants
CREATE OR REPLACE FUNCTION poker.get_user_tenants(user_email TEXT)
RETURNS TABLE (
  tenant_id INTEGER,
  tenant_name VARCHAR(255),
  role VARCHAR(20),
  player_id INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ut.tenant_id,
    t.name,
    ut.role,
    ut.player_id,
    ut.is_active
  FROM poker.user_tenants ut
  JOIN poker.tenants t ON t.id = ut.tenant_id
  JOIN poker.users u ON u.id = ut.user_id
  WHERE u.email = user_email
    AND ut.is_active = true
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch user's active tenant
CREATE OR REPLACE FUNCTION poker.switch_user_tenant(user_email TEXT, new_tenant_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if user has access to the tenant
  SELECT EXISTS(
    SELECT 1 
    FROM poker.user_tenants ut
    JOIN poker.users u ON u.id = ut.user_id
    WHERE u.email = user_email
      AND ut.tenant_id = new_tenant_id
      AND ut.is_active = true
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN false;
  END IF;
  
  -- Update current_tenant_id
  UPDATE poker.users
  SET current_tenant_id = new_tenant_id,
      updated_at = NOW()
  WHERE email = user_email;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

-- Grant permissions on new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON poker.user_tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON poker.session_confirmations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE poker.user_tenants_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE poker.session_confirmations_id_seq TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION poker.get_user_tenants(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION poker.switch_user_tenant(TEXT, INTEGER) TO authenticated;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Users can now participate in multiple tenants (home games)
-- Session confirmations are now tracked
-- Helper functions are available for tenant switching
-- =============================================
