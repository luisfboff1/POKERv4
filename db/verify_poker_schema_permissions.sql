-- =============================================
-- VERIFY POKER SCHEMA PERMISSIONS
-- =============================================
-- Run this script to verify that permissions are correctly set
-- on the poker schema and its objects
-- =============================================

-- 1. Check if poker schema exists
SELECT 
  schema_name, 
  schema_owner 
FROM information_schema.schemata 
WHERE schema_name = 'poker';

-- Expected: Should return one row with schema_name = 'poker'

-- =============================================

-- 2. Check schema permissions
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.usage_privileges 
WHERE object_schema = 'poker' 
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Expected: 
-- - anon: USAGE
-- - authenticated: USAGE
-- - service_role: USAGE (and possibly others)

-- =============================================

-- 3. Check table permissions
SELECT 
  grantee, 
  table_name,
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'poker' 
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- Expected for key tables (tenants, users, players, sessions):
-- - anon: SELECT
-- - authenticated: SELECT, INSERT, UPDATE, DELETE
-- - service_role: All privileges

-- =============================================

-- 4. Check if tables exist in poker schema
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'poker'
ORDER BY table_name;

-- Expected: Should list all tables (tenants, users, players, sessions, etc.)

-- =============================================

-- 5. Check sequence permissions
SELECT 
  grantee,
  object_name as sequence_name,
  privilege_type
FROM information_schema.usage_privileges
WHERE object_schema = 'poker'
  AND object_type = 'SEQUENCE'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY object_name, grantee;

-- Expected:
-- - anon: USAGE, SELECT
-- - authenticated: USAGE, SELECT, UPDATE
-- - service_role: All privileges

-- =============================================

-- 6. Check RLS policies are enabled
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'poker'
ORDER BY tablename, policyname;

-- Expected: Should show RLS policies for multi-tenant isolation

-- =============================================

-- 7. Test basic query (should NOT fail)
-- This tests if anon role can actually query the schema
SELECT COUNT(*) as tenant_count FROM poker.tenants;

-- Expected: Should return a number (could be 0 or more, but NOT an error)

-- =============================================

-- 8. Check default privileges for future objects
SELECT 
  defaclrole::regrole as owner,
  defaclnamespace::regnamespace as schema,
  defaclobjtype as object_type,
  (
    SELECT string_agg(privilege, ', ')
    FROM unnest(defaclacl) as acl,
    regexp_split_to_table(acl::text, '[=/]') as privilege
    WHERE privilege ~ '^[A-Z]'
  ) as default_privileges
FROM pg_default_acl
WHERE defaclnamespace = 'poker'::regnamespace
ORDER BY defaclobjtype;

-- Expected: Should show default privileges set for tables, sequences, functions

-- =============================================
-- INTERPRETATION OF RESULTS
-- =============================================
-- ✅ All checks pass: Permissions are correctly configured
-- ⚠️  Some checks fail: Review the failed checks and re-run fix script
-- ❌ Most checks fail: Schema might not be created or migrated yet
--
-- If you see errors about "poker schema not found":
-- 1. Run db/migrate_to_poker_schema.sql first (if migrating from public)
-- 2. OR run db/supabase-schema.sql (if fresh install)
-- 3. Then run db/fix_poker_schema_permissions.sql
-- 4. Then run this verification script again
-- =============================================
