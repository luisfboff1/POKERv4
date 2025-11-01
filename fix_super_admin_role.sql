-- ===================================================================
-- VERIFICAR E CORRIGIR ROLE DO USUÁRIO
-- ===================================================================

-- 1. Verificar role atual
SELECT id, name, email, role, tenant_id FROM poker.users WHERE email = 'luis.boff@evcomx.com.br';

-- 2. Atualizar para super_admin
UPDATE poker.users
SET role = 'super_admin'
WHERE email = 'luis.boff@evcomx.com.br';

-- 3. Verificar novamente
SELECT id, name, email, role, tenant_id FROM poker.users WHERE email = 'luis.boff@evcomx.com.br';

-- 4. Verificar se existe tenant
SELECT id, name, email, status FROM poker.tenants;
