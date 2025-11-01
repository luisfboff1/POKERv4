-- ===================================================================
-- CRIAR USUÁRIO EM POKER.USERS COM EMAIL CORRETO
-- ===================================================================

-- 1. Inserir/atualizar usuário com email correto
INSERT INTO poker.users (
  id,
  tenant_id,
  name,
  email,
  password_hash,
  role,
  created_at,
  updated_at,
  is_active,
  player_id,
  current_tenant_id,
  supabase_user_id
)
VALUES (
  1,
  1,
  'Luis Fernando Boff',
  'luisfboff@hotmail.com', -- ⭐ EMAIL CORRETO
  '$2b$10$wZG1S9Ij6WFZpDAZpKrI3Ok4c7V12H/Oo.LlxiQlKB96wn8e.qz6m',
  'super_admin', -- ⭐ SUPER ADMIN
  NOW(),
  NOW(),
  true,
  1, -- player_id para mostrar gráfico
  1,
  (SELECT id FROM auth.users WHERE email = 'luisfboff@hotmail.com' LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  email = 'luisfboff@hotmail.com',
  role = 'super_admin',
  tenant_id = 1,
  current_tenant_id = 1,
  player_id = 1,
  supabase_user_id = (SELECT id FROM auth.users WHERE email = 'luisfboff@hotmail.com' LIMIT 1),
  updated_at = NOW();

-- 2. Garantir registro em user_tenants
INSERT INTO poker.user_tenants (user_id, tenant_id, role, player_id, is_active, created_at, updated_at)
VALUES (
  1,
  1,
  'admin',
  1,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  player_id = 1,
  role = 'admin',
  is_active = true,
  updated_at = NOW();

-- 3. Verificar resultado
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  u.id,
  u.name,
  u.email,
  u.role,
  u.tenant_id,
  u.player_id,
  au.email as auth_email
FROM poker.users u
LEFT JOIN auth.users au ON au.id = u.supabase_user_id
WHERE u.email = 'luisfboff@hotmail.com';
