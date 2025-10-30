-- =============================================
-- FIX POKER SCHEMA PERMISSIONS
-- =============================================
-- This script fixes the "permission denied for schema poker" error
-- by ensuring proper grants to anon and authenticated roles
-- =============================================

-- 1. Grant USAGE on poker schema to both anon and authenticated roles
-- This allows both roles to access objects in the schema
GRANT USAGE ON SCHEMA poker TO anon;
GRANT USAGE ON SCHEMA poker TO authenticated;
GRANT USAGE ON SCHEMA poker TO service_role;

-- 2. Grant explicit SELECT permissions on all tables to anon role
-- This is needed for PostgREST to query tables through the API
GRANT SELECT ON ALL TABLES IN SCHEMA poker TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA poker TO authenticated;

-- 3. Grant ALL privileges to authenticated role for full CRUD operations
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA poker TO authenticated;

-- 4. Grant service_role full access (used by server-side operations)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA poker TO service_role;

-- 5. Grant access to sequences (needed for auto-increment columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA poker TO anon;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA poker TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA poker TO service_role;

-- 6. Grant EXECUTE on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA poker TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA poker TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA poker TO service_role;

-- 7. Set default privileges for future objects created in poker schema
-- This ensures new tables/sequences/functions automatically get proper permissions

-- For anon role (read-only on tables)
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

-- 8. Verify permissions (optional - for debugging)
-- Uncomment these lines to see current permissions:
-- SELECT * FROM information_schema.role_table_grants WHERE grantee IN ('anon', 'authenticated', 'service_role') AND table_schema = 'poker';
-- SELECT * FROM information_schema.role_usage_grants WHERE grantee IN ('anon', 'authenticated', 'service_role') AND object_schema = 'poker';

-- =============================================
-- IMPORTANT NOTES:
-- =============================================
-- 1. This script should be run AFTER the tables are created in the poker schema
-- 2. If tables are in the public schema, run migrate_to_poker_schema.sql first
-- 3. Ensure 'poker' is added to "Exposed schemas" in Supabase Dashboard:
--    Settings → API → API Settings → Exposed schemas
-- 4. The anon role is used for unauthenticated requests through PostgREST
-- 5. The authenticated role is used for authenticated requests (after login)
-- 6. The service_role bypasses RLS and is used for admin operations
-- 
-- After running this script:
-- - Clear browser cache and refresh the application
-- - Check that login and user fetching work correctly
-- - Monitor Supabase logs for any remaining permission errors
-- =============================================
