-- Popular tabela user_tenants com dados de poker.users
-- Isso cria a associação multi-tenant para usuários existentes

-- Inserir associações para todos os usuários que têm tenant_id
INSERT INTO poker.user_tenants (user_id, tenant_id, role, player_id, is_active)
SELECT 
  u.id as user_id,
  u.tenant_id,
  u.role,
  u.player_id,
  true as is_active
FROM poker.users u
WHERE u.tenant_id IS NOT NULL
  AND NOT EXISTS (
    -- Evitar duplicatas caso já exista
    SELECT 1 FROM poker.user_tenants ut 
    WHERE ut.user_id = u.id AND ut.tenant_id = u.tenant_id
  );

-- Verificar resultado
SELECT 
  ut.id,
  u.name as user_name,
  u.email,
  t.name as tenant_name,
  ut.role,
  ut.player_id,
  ut.is_active
FROM poker.user_tenants ut
JOIN poker.users u ON u.id = ut.user_id
JOIN poker.tenants t ON t.id = ut.tenant_id
ORDER BY ut.id;

-- Verificar contagem por tenant
SELECT 
  t.id,
  t.name as tenant_name,
  COUNT(ut.id) as usuarios_ativos
FROM poker.tenants t
LEFT JOIN poker.user_tenants ut ON ut.tenant_id = t.id AND ut.is_active = true
GROUP BY t.id, t.name
ORDER BY t.name;
