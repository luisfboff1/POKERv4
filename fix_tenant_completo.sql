-- ===================================================================
-- FIX COMPLETO - TENANT + PLAYER_ID + USER_TENANTS
-- ===================================================================
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jhodhxvvhohygijqcxbo/sql/new
-- ===================================================================

-- PARTE 1: GARANTIR QUE EXISTE UM TENANT (ID=1)
-- ===================================================================
INSERT INTO poker.tenants (id, name, email, phone, plan, status, max_users, max_sessions_per_month, created_at, updated_at, approved_at)
VALUES (
  1, 
  'Casa Luis', 
  'luisfboff@hotmail.com', 
  NULL, 
  'basic', 
  'active', 
  10, 
  50, 
  NOW(), 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = 'Casa Luis',
  email = 'luisfboff@hotmail.com',
  status = 'active',
  updated_at = NOW();

-- PARTE 2: ATUALIZAR USUÁRIO COM TENANT_ID E PLAYER_ID
-- ===================================================================
UPDATE poker.users
SET 
  tenant_id = 1,
  current_tenant_id = 1,
  player_id = 1,
  updated_at = NOW()
WHERE email = 'luis.boff@evcomx.com.br';

-- PARTE 3: GARANTIR REGISTRO EM USER_TENANTS
-- ===================================================================
INSERT INTO poker.user_tenants (user_id, tenant_id, role, player_id, is_active, created_at, updated_at)
VALUES (
  (SELECT id FROM poker.users WHERE email = 'luis.boff@evcomx.com.br'),
  1,
  'admin',
  1,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = 'admin',
  player_id = 1,
  is_active = true,
  updated_at = NOW();

-- PARTE 4: ATUALIZAR SEQUENCE DO TENANT
-- ===================================================================
SELECT setval('poker.tenants_id_seq', 1, true);

-- ✅ VERIFICAÇÃO FINAL
-- ===================================================================
SELECT 
  '=== STATUS FINAL ===' as verificacao,
  (SELECT name FROM poker.tenants WHERE id = 1) as tenant_nome,
  u.name as usuario_nome,
  u.email as usuario_email,
  u.tenant_id as "tenant_id (users)",
  u.current_tenant_id as "current_tenant_id",
  u.player_id as "player_id ⭐",
  ut.tenant_id as "tenant_id (user_tenants)",
  ut.player_id as "player_id (user_tenants)",
  ut.role as "role",
  CASE 
    WHEN u.tenant_id IS NULL THEN '❌ ERRO: tenant_id NULL (mostra N/A)'
    WHEN u.player_id IS NULL THEN '❌ ERRO: player_id NULL (sem gráfico)'
    WHEN ut.user_id IS NULL THEN '⚠️ AVISO: Sem registro em user_tenants'
    ELSE '✅ TUDO OK - Tenant e Gráfico funcionando'
  END as status_final
FROM poker.users u
LEFT JOIN poker.user_tenants ut ON ut.user_id = u.id AND ut.tenant_id = 1
WHERE u.email = 'luis.boff@evcomx.com.br';
