-- ===================================================================
-- FIX SIMPLES: FORÇA PLAYER_ID PARA FAZER GRÁFICO APARECER
-- ===================================================================
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jhodhxvvhohygijqcxbo/sql/new
-- ===================================================================

-- SOLUÇÃO: Configurar player_id = 1 (jogador "luis") nas 2 tabelas
-- Isso fará o PlayerDashboard aparecer em vez do admin dashboard

-- 1️⃣ Configurar player_id na tabela users
UPDATE poker.users
SET 
  player_id = 1,
  current_tenant_id = 1,
  updated_at = NOW()
WHERE email = 'luis.boff@evcomx.com.br';

-- 2️⃣ Configurar player_id na tabela user_tenants (se existir registro)
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
  player_id = 1,
  updated_at = NOW();

-- ✅ VERIFICAÇÃO: Deve mostrar player_id = 1
SELECT 
  u.id,
  u.name,
  u.email,
  u.player_id as "player_id ⭐",
  u.current_tenant_id,
  CASE 
    WHEN u.player_id = 1 THEN '✅ OK - Gráfico vai aparecer'
    ELSE '❌ ERRO - player_id não está configurado'
  END as status
FROM poker.users u
WHERE u.email = 'luis.boff@evcomx.com.br';
