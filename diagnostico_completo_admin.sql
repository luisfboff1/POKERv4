-- ===================================================================
-- DIAGNÓSTICO COMPLETO - SUPER ADMIN E TENANTS
-- ===================================================================

-- 1. Verificar usuário atual
SELECT 
  '=== USUÁRIO ATUAL ===' as info,
  id, 
  name, 
  email, 
  role,
  tenant_id,
  current_tenant_id
FROM poker.users 
WHERE email = 'luis.boff@evcomx.com.br';

-- 2. Verificar auth.users (Supabase Auth)
SELECT 
  '=== SUPABASE AUTH ===' as info,
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'luisfboff@hotmail.com';

-- 3. Verificar todos os tenants
SELECT 
  '=== TENANTS NO BANCO ===' as info,
  id,
  name,
  email,
  status,
  plan,
  max_users
FROM poker.tenants
ORDER BY id;

-- 4. Verificar se usuário está vinculado ao tenant
SELECT 
  '=== USER_TENANTS ===' as info,
  ut.user_id,
  ut.tenant_id,
  ut.role,
  ut.player_id,
  ut.is_active,
  t.name as tenant_name
FROM poker.user_tenants ut
JOIN poker.tenants t ON t.id = ut.tenant_id
WHERE ut.user_id = (SELECT id FROM poker.users WHERE email = 'luis.boff@evcomx.com.br');

-- 5. Status final
SELECT 
  CASE 
    WHEN (SELECT role FROM poker.users WHERE email = 'luis.boff@evcomx.com.br') = 'super_admin' 
      THEN '✅ É SUPER ADMIN'
    ELSE '❌ NÃO É SUPER ADMIN - Role: ' || COALESCE((SELECT role FROM poker.users WHERE email = 'luis.boff@evcomx.com.br'), 'NULL')
  END as status_super_admin,
  CASE 
    WHEN (SELECT COUNT(*) FROM poker.tenants) > 0 
      THEN '✅ Existem ' || (SELECT COUNT(*) FROM poker.tenants) || ' tenant(s) no banco'
    ELSE '❌ Nenhum tenant no banco'
  END as status_tenants;
