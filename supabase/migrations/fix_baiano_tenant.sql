-- ===================================================================
-- FIX: Adicionar Baiano ao tenant e user_tenants
-- ===================================================================

-- Atualizar usuário Baiano com tenant_id
UPDATE poker.users
SET 
  tenant_id = 1,
  current_tenant_id = 1,
  updated_at = NOW()
WHERE email = 'baiano@gmail.com';

-- Adicionar registro em user_tenants
INSERT INTO poker.user_tenants (user_id, tenant_id, role, player_id, is_active, created_at, updated_at)
VALUES (
  (SELECT id FROM poker.users WHERE email = 'baiano@gmail.com'),
  1,
  'player',
  (SELECT id FROM poker.players WHERE name = 'Baiano' LIMIT 1),
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  player_id = (SELECT id FROM poker.players WHERE name = 'Baiano' LIMIT 1),
  updated_at = NOW();

-- Verificar
SELECT 
  u.name,
  u.email,
  u.tenant_id,
  ut.tenant_id as ut_tenant_id,
  t.name as tenant_name
FROM poker.users u
LEFT JOIN poker.user_tenants ut ON ut.user_id = u.id
LEFT JOIN poker.tenants t ON t.id = u.tenant_id
WHERE u.email = 'baiano@gmail.com';
