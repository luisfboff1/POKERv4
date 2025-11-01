-- ===================================================================
-- DIAGNÓSTICO COMPLETO - VERIFICAR DADOS EXISTENTES
-- ===================================================================
-- Execute no Supabase SQL Editor para ver o que está faltando

-- 1. Verificar TENANTS
SELECT '=== TABELA TENANTS ===' as info;
SELECT * FROM poker.tenants;

-- 2. Verificar USERS
SELECT '=== TABELA USERS ===' as info;
SELECT id, name, email, role, player_id, current_tenant_id, tenant_id FROM poker.users;

-- 3. Verificar USER_TENANTS
SELECT '=== TABELA USER_TENANTS ===' as info;
SELECT * FROM poker.user_tenants;

-- 4. Verificar PLAYERS
SELECT '=== TABELA PLAYERS (primeiros 5) ===' as info;
SELECT id, name, tenant_id, is_active, user_id FROM poker.players LIMIT 5;

-- 5. Verificar SESSIONS
SELECT '=== TABELA SESSIONS ===' as info;
SELECT id, date, location, status, players_count, total_buyin FROM poker.sessions;

-- 6. DIAGNÓSTICO CRÍTICO
SELECT '=== DIAGNÓSTICO - O QUE ESTÁ FALTANDO? ===' as info;
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM poker.tenants) = 0 THEN '❌ FALTA: Nenhum tenant cadastrado'
    ELSE '✅ OK: Tenants existem'
  END as status_tenants,
  CASE 
    WHEN (SELECT COUNT(*) FROM poker.users WHERE current_tenant_id IS NOT NULL) = 0 THEN '❌ FALTA: Users sem tenant_id'
    ELSE '✅ OK: Users têm tenant_id'
  END as status_users_tenant,
  CASE 
    WHEN (SELECT COUNT(*) FROM poker.user_tenants) = 0 THEN '❌ FALTA: Nenhum registro em user_tenants'
    ELSE '✅ OK: user_tenants preenchido'
  END as status_user_tenants,
  CASE 
    WHEN (SELECT COUNT(*) FROM poker.users WHERE player_id IS NOT NULL) = 0 THEN '❌ FALTA: Users sem player_id (gráfico não aparece)'
    ELSE '✅ OK: player_id configurado'
  END as status_player_id;
