-- Verificar associações na tabela user_tenants
SELECT 
  ut.id,
  ut.user_id,
  u.name as user_name,
  u.email as user_email,
  ut.tenant_id,
  t.name as tenant_name,
  ut.role,
  ut.player_id,
  ut.is_active
FROM poker.user_tenants ut
JOIN poker.users u ON u.id = ut.user_id
JOIN poker.tenants t ON t.id = ut.tenant_id
ORDER BY ut.id;

-- Ver se o usuário Luis está associado ao tenant Casa Luis
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  u.tenant_id as user_tenant_id,
  COUNT(ut.id) as associacoes_user_tenants
FROM poker.users u
LEFT JOIN poker.user_tenants ut ON ut.user_id = u.id
WHERE u.email = 'luisfboff@hotmail.com'
GROUP BY u.id, u.name, u.email, u.tenant_id;
