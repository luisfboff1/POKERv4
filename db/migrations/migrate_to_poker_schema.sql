-- =============================================
-- MIGRATION TO POKER SCHEMA
-- =============================================
-- This script migrates all tables, functions, triggers, and views
-- from the public schema to the poker schema
-- =============================================

-- 1. Create the poker schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS poker;

-- 2. Move all tables to the poker schema
ALTER TABLE IF EXISTS public.tenants SET SCHEMA poker;
ALTER TABLE IF EXISTS public.users SET SCHEMA poker;
ALTER TABLE IF EXISTS public.players SET SCHEMA poker;
ALTER TABLE IF EXISTS public.sessions SET SCHEMA poker;
ALTER TABLE IF EXISTS public.user_invites SET SCHEMA poker;
ALTER TABLE IF EXISTS public.audit_logs SET SCHEMA poker;
ALTER TABLE IF EXISTS public.player_transfers SET SCHEMA poker;
ALTER TABLE IF EXISTS public.user_sessions SET SCHEMA poker;

-- 3. Move sequences to the poker schema
ALTER SEQUENCE IF EXISTS public.tenants_id_seq SET SCHEMA poker;
ALTER SEQUENCE IF EXISTS public.users_id_seq SET SCHEMA poker;
ALTER SEQUENCE IF EXISTS public.players_id_seq SET SCHEMA poker;
ALTER SEQUENCE IF EXISTS public.sessions_id_seq SET SCHEMA poker;
ALTER SEQUENCE IF EXISTS public.user_invites_id_seq SET SCHEMA poker;
ALTER SEQUENCE IF EXISTS public.audit_logs_id_seq SET SCHEMA poker;
ALTER SEQUENCE IF EXISTS public.player_transfers_id_seq SET SCHEMA poker;
ALTER SEQUENCE IF EXISTS public.user_sessions_id_seq SET SCHEMA poker;

-- 4. Drop existing functions in public schema (will be recreated in poker schema)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.setval(text, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.user_has_role(text) CASCADE;

-- 5. Create functions in poker schema
-- Helper function to get tenant_id of authenticated user
CREATE OR REPLACE FUNCTION poker.get_user_tenant_id()
RETURNS INTEGER AS $$
DECLARE
  user_tenant_id INTEGER;
  user_email TEXT;
BEGIN
  -- Extract email from Supabase JWT
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get tenant_id from user
  SELECT tenant_id INTO user_tenant_id
  FROM poker.users
  WHERE email = user_email
    AND is_active = true
  LIMIT 1;
  
  RETURN user_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION poker.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- Extract email from Supabase JWT
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user role
  SELECT role INTO user_role
  FROM poker.users
  WHERE email = user_email
    AND is_active = true
  LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Role hierarchy: player < admin < super_admin
  CASE required_role
    WHEN 'player' THEN
      RETURN user_role IN ('player', 'admin', 'super_admin');
    WHEN 'admin' THEN
      RETURN user_role IN ('admin', 'super_admin');
    WHEN 'super_admin' THEN
      RETURN user_role = 'super_admin';
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION poker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reset sequence values (for data migration)
CREATE OR REPLACE FUNCTION poker.setval(sequence_name text, new_value bigint)
RETURNS bigint AS $$
BEGIN
  EXECUTE format('SELECT setval(%L, %s)', 'poker.' || sequence_name, new_value);
  RETURN new_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate triggers in poker schema
DROP TRIGGER IF EXISTS update_tenants_updated_at ON poker.tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON poker.tenants
  FOR EACH ROW EXECUTE FUNCTION poker.update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON poker.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON poker.users
  FOR EACH ROW EXECUTE FUNCTION poker.update_updated_at_column();

DROP TRIGGER IF EXISTS update_players_updated_at ON poker.players;
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON poker.players
  FOR EACH ROW EXECUTE FUNCTION poker.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON poker.sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON poker.sessions
  FOR EACH ROW EXECUTE FUNCTION poker.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invites_updated_at ON poker.user_invites;
CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON poker.user_invites
  FOR EACH ROW EXECUTE FUNCTION poker.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transfers_updated_at ON poker.player_transfers;
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON poker.player_transfers
  FOR EACH ROW EXECUTE FUNCTION poker.update_updated_at_column();

-- 7. Drop and recreate views in poker schema
DROP VIEW IF EXISTS public.super_admin_stats CASCADE;
DROP VIEW IF EXISTS public.all_tenants_view CASCADE;

-- Super admin statistics view
CREATE OR REPLACE VIEW poker.super_admin_stats AS
SELECT
  COUNT(DISTINCT t.id) as total_tenants,
  COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_users,
  COUNT(DISTINCT p.id) as total_players,
  COUNT(DISTINCT s.id) as total_sessions,
  COALESCE(SUM(s.total_buyin), 0) as total_volume,
  COUNT(DISTINCT CASE WHEN s.date >= CURRENT_DATE - INTERVAL '30 days' THEN s.id END) as sessions_last_30_days
FROM poker.tenants t
LEFT JOIN poker.users u ON t.id = u.tenant_id
LEFT JOIN poker.players p ON t.id = p.tenant_id
LEFT JOIN poker.sessions s ON t.id = s.tenant_id;

-- All tenants view with aggregated data
CREATE OR REPLACE VIEW poker.all_tenants_view AS
SELECT
  t.*,
  COUNT(DISTINCT u.id) as users_count,
  COUNT(DISTINCT p.id) as players_count,
  COUNT(DISTINCT s.id) as sessions_count,
  COALESCE(SUM(s.total_buyin), 0) as total_volume,
  MAX(s.date) as last_session_date,
  (SELECT name FROM poker.users
   WHERE tenant_id = t.id
   AND role IN ('admin', 'super_admin')
   ORDER BY id LIMIT 1) as admin_name
FROM poker.tenants t
LEFT JOIN poker.users u ON t.id = u.tenant_id AND u.is_active = true
LEFT JOIN poker.players p ON t.id = p.tenant_id AND p.is_active = true
LEFT JOIN poker.sessions s ON t.id = s.tenant_id
GROUP BY t.id;

-- 8. Update RLS policies to reference poker schema
-- Note: RLS policies are automatically moved with the tables, but we need to ensure they still work
-- The auth.jwt() function will still work as it's a Supabase built-in function

-- 9. Grant necessary permissions on poker schema
-- Grant USAGE on schema to all roles (required to access schema objects)
GRANT USAGE ON SCHEMA poker TO anon;
GRANT USAGE ON SCHEMA poker TO authenticated;
GRANT ALL ON SCHEMA poker TO service_role;

-- Grant SELECT to anon role (used for unauthenticated API requests)
GRANT SELECT ON ALL TABLES IN SCHEMA poker TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA poker TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA poker TO anon;

-- Grant full CRUD to authenticated role (used after login)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA poker TO authenticated;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA poker TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA poker TO authenticated;

-- Grant all privileges to service_role (used by server-side code, bypasses RLS)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA poker TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA poker TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA poker TO service_role;

-- 10. Set default privileges for future objects in poker schema
-- For anon role (read-only)
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT EXECUTE ON FUNCTIONS TO anon;

-- For authenticated role (full CRUD)
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- For service_role (full access)
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA poker 
  GRANT EXECUTE ON FUNCTIONS TO service_role;

-- =============================================
-- 11. CRITICAL: Configure PostgREST to expose poker schema
-- =============================================
-- This is ESSENTIAL for Supabase API to work with the poker schema
-- You MUST update the PostgREST configuration in Supabase Dashboard

-- In Supabase Dashboard:
-- 1. Go to Settings → API → API Settings
-- 2. Find "Exposed schemas" configuration
-- 3. Add 'poker' to the exposed schemas list (comma-separated)
--    Example: public,poker,storage
-- 4. Save changes and restart the API server if needed

-- Alternatively, you can set the search path to include poker schema:
-- This makes PostgREST look in poker schema when querying
-- However, the recommended approach is to expose the schema explicitly

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. **CRITICAL**: Configure PostgREST to expose 'poker' schema (see step 11 above)
-- 3. Update application code to use schema 'poker' in Supabase client configurations
-- 4. Test all API endpoints and functionality
-- 5. Monitor for any errors in application logs
-- 
-- IMPORTANT: If you get "Failed to fetch user data" or relation errors:
-- - Verify poker schema is exposed in Supabase API settings
-- - Check that all foreign key relationships are intact after migration
-- - Test with direct SQL queries in Supabase SQL Editor
-- =============================================
