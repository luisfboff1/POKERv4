-- Verificar se user_tenants tem dados
SELECT 
  ut.id,
  ut.user_id,
  u.name as user_name,
  u.email,
  ut.tenant_id,
  t.name as tenant_name,
  ut.role,
  ut.player_id,
  ut.is_active,
  ut.created_at
FROM poker.user_tenants ut
JOIN poker.users u ON u.id = ut.user_id
JOIN poker.tenants t ON t.id = ut.tenant_id
ORDER BY ut.id;

-- Contar por tenant
SELECT 
  tenant_id,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM poker.user_tenants
GROUP BY tenant_id;
