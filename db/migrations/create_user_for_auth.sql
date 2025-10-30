-- =============================================
-- CREATE USER RECORD FOR AUTHENTICATED USER
-- =============================================
-- This script creates a user record in poker.users for an existing Supabase Auth user
-- Use this if you can login but get "User not found" error
-- =============================================

-- STEP 1: Update these variables with your information
-- Replace the values below with your actual information
DO $$
DECLARE
  v_email TEXT := 'seu-email@exemplo.com';  -- ⚠️ CHANGE THIS to your login email
  v_name TEXT := 'Seu Nome Completo';       -- ⚠️ CHANGE THIS to your full name
  v_group_name TEXT := 'Meu Grupo de Poker'; -- ⚠️ CHANGE THIS to your group name
  v_tenant_id INTEGER;
BEGIN
  -- STEP 2: Check if user already exists
  IF EXISTS (SELECT 1 FROM poker.users WHERE email = v_email) THEN
    RAISE NOTICE 'User already exists in poker.users: %', v_email;
    RETURN;
  END IF;

  -- STEP 3: Create or get tenant
  INSERT INTO poker.tenants (name, email, plan, status, max_users, max_sessions_per_month, approved_at)
  VALUES (v_group_name, v_email, 'basic', 'active', 10, 50, NOW())
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO v_tenant_id FROM poker.tenants WHERE email = v_email;
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;

  -- STEP 4: Create user record
  INSERT INTO poker.users (tenant_id, name, email, password_hash, role, is_active)
  VALUES (v_tenant_id, v_name, v_email, '', 'admin', true)
  ON CONFLICT (email) DO NOTHING;

  RAISE NOTICE 'User created successfully: % (tenant_id: %)', v_email, v_tenant_id;

END $$;

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this to verify the user was created correctly

SELECT 
  'Auth User' as source,
  email,
  created_at,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
WHERE email = 'seu-email@exemplo.com'  -- ⚠️ CHANGE THIS to match your email above

UNION ALL

SELECT 
  'App User' as source,
  u.email,
  u.created_at,
  u.is_active::text::boolean as active
FROM poker.users u
WHERE u.email = 'seu-email@exemplo.com'  -- ⚠️ CHANGE THIS to match your email above

UNION ALL

SELECT 
  'Tenant' as source,
  t.email,
  t.created_at,
  (t.status = 'active')::text::boolean as active
FROM poker.tenants t
WHERE t.email = 'seu-email@exemplo.com';  -- ⚠️ CHANGE THIS to match your email above

-- Expected output:
-- 3 rows (Auth User, App User, Tenant) all with the same email
-- All should show as active/confirmed

-- =============================================
-- TROUBLESHOOTING
-- =============================================

-- If you see errors, check:

-- 1. Is the email in auth.users?
SELECT email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. Check poker.tenants
SELECT id, email, name, status FROM poker.tenants ORDER BY created_at DESC LIMIT 5;

-- 3. Check poker.users
SELECT id, email, name, role, tenant_id, is_active FROM poker.users ORDER BY created_at DESC LIMIT 5;

-- 4. If user exists but is inactive, activate them:
-- UPDATE poker.users SET is_active = true WHERE email = 'seu-email@exemplo.com';

-- 5. If tenant exists but is not active, activate it:
-- UPDATE poker.tenants SET status = 'active', approved_at = NOW() WHERE email = 'seu-email@exemplo.com';

-- =============================================
-- NOTES
-- =============================================
-- 
-- ⚠️ IMPORTANT: You must change the email address in 4 places above:
--    1. v_email variable (line 10)
--    2. First verification query (line 45)
--    3. Second verification query (line 51)
--    4. Third verification query (line 57)
--
-- The password_hash is left empty ('') because Supabase Auth manages passwords.
-- This script creates an 'admin' role user - change line 33 if you want a different role.
--
-- Roles available:
--   - 'super_admin': Full system access
--   - 'admin': Full access to their tenant
--   - 'player': Limited access (view stats, sessions)
-- =============================================
