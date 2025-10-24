-- ============================================================================
-- Row Level Security (RLS) Policies - VERSÃO CORRIGIDA
-- Data: 2025-10-23
-- Descrição: Implementa políticas de segurança apenas em tabelas existentes
-- ============================================================================

-- ============================================================================
-- PASSO 1: Verificar funções auth do Supabase
-- ============================================================================
-- 
-- O Supabase já fornece estas funções automaticamente:
-- - auth.uid() -> Retorna UUID do usuário autenticado
-- - auth.jwt() -> Retorna claims do JWT
-- 
-- Para extrair email: auth.jwt() ->> 'email'
-- ============================================================================

-- ============================================================================
-- PASSO 2: Helper Functions
-- ============================================================================

-- Função para obter tenant_id do usuário autenticado via email
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS INTEGER AS $$
DECLARE
  user_tenant_id INTEGER;
  user_email TEXT;
BEGIN
  -- Extrair email do JWT do Supabase
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar tenant_id do usuário
  SELECT tenant_id INTO user_tenant_id
  FROM public.users
  WHERE email = user_email
    AND is_active = true
  LIMIT 1;
  
  RETURN user_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- Extrair email do JWT do Supabase
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar role do usuário
  SELECT role INTO user_role
  FROM public.users
  WHERE email = user_email
    AND is_active = true
  LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Hierarquia de roles: player < admin < super_admin
  CASE required_role
    WHEN 'player' THEN
      RETURN user_role IN ('player', 'admin', 'super_admin');
    WHEN 'admin' THEN
      RETURN user_role IN ('admin', 'super_admin');
    WHEN 'super_admin' THEN
      RETURN user_role = 'super_admin';
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASSO 3: Limpar Policies Existentes (se houver)
-- ============================================================================

-- Dropar policies existentes para evitar conflitos
DO $$ 
BEGIN
  -- Tenants
  DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
  DROP POLICY IF EXISTS "Super admins can create tenants" ON public.tenants;
  DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
  DROP POLICY IF EXISTS "Super admins can delete tenants" ON public.tenants;
  
  -- Users
  DROP POLICY IF EXISTS "Users can view users from their tenant" ON public.users;
  DROP POLICY IF EXISTS "Admins can create users in their tenant" ON public.users;
  DROP POLICY IF EXISTS "Admins can update users in their tenant" ON public.users;
  DROP POLICY IF EXISTS "Admins can delete users in their tenant" ON public.users;
  
  -- Players
  DROP POLICY IF EXISTS "Users can view players from their tenant" ON public.players;
  DROP POLICY IF EXISTS "Users can create players in their tenant" ON public.players;
  DROP POLICY IF EXISTS "Users can update players in their tenant" ON public.players;
  DROP POLICY IF EXISTS "Admins can delete players in their tenant" ON public.players;
  
  -- Sessions
  DROP POLICY IF EXISTS "Users can view sessions from their tenant" ON public.sessions;
  DROP POLICY IF EXISTS "Users can create sessions in their tenant" ON public.sessions;
  DROP POLICY IF EXISTS "Users can update sessions in their tenant" ON public.sessions;
  DROP POLICY IF EXISTS "Admins can delete sessions in their tenant" ON public.sessions;
  
  -- User Invites
  DROP POLICY IF EXISTS "Users can view invites from their tenant" ON public.user_invites;
  DROP POLICY IF EXISTS "Admins can create invites in their tenant" ON public.user_invites;
  DROP POLICY IF EXISTS "Admins can update invites in their tenant" ON public.user_invites;
  DROP POLICY IF EXISTS "Admins can delete invites in their tenant" ON public.user_invites;
  
  -- Audit Logs
  DROP POLICY IF EXISTS "Admins can view audit logs from their tenant" ON public.audit_logs;
  DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
END $$;

-- ============================================================================
-- PASSO 4: Habilitar RLS nas Tabelas
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 5: Aplicar Policies - TENANTS
-- ============================================================================

CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  USING (id = get_user_tenant_id());

CREATE POLICY "Super admins can create tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (user_has_role('super_admin'));

CREATE POLICY "Admins can update their tenant"
  ON public.tenants FOR UPDATE
  USING (id = get_user_tenant_id() AND user_has_role('admin'));

CREATE POLICY "Super admins can delete tenants"
  ON public.tenants FOR DELETE
  USING (user_has_role('super_admin'));

-- ============================================================================
-- PASSO 6: Aplicar Policies - USERS
-- ============================================================================

CREATE POLICY "Users can view users from their tenant"
  ON public.users FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can create users in their tenant"
  ON public.users FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

CREATE POLICY "Admins can update users in their tenant"
  ON public.users FOR UPDATE
  USING (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

CREATE POLICY "Admins can delete users in their tenant"
  ON public.users FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

-- ============================================================================
-- PASSO 7: Aplicar Policies - PLAYERS
-- ============================================================================

CREATE POLICY "Users can view players from their tenant"
  ON public.players FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create players in their tenant"
  ON public.players FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update players in their tenant"
  ON public.players FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can delete players in their tenant"
  ON public.players FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

-- ============================================================================
-- PASSO 8: Aplicar Policies - SESSIONS
-- ============================================================================

CREATE POLICY "Users can view sessions from their tenant"
  ON public.sessions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create sessions in their tenant"
  ON public.sessions FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update sessions in their tenant"
  ON public.sessions FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can delete sessions in their tenant"
  ON public.sessions FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

-- ============================================================================
-- PASSO 9: Aplicar Policies - USER_INVITES
-- ============================================================================

CREATE POLICY "Users can view invites from their tenant"
  ON public.user_invites FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can create invites in their tenant"
  ON public.user_invites FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

CREATE POLICY "Admins can update invites in their tenant"
  ON public.user_invites FOR UPDATE
  USING (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

CREATE POLICY "Admins can delete invites in their tenant"
  ON public.user_invites FOR DELETE
  USING (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

-- ============================================================================
-- PASSO 10: Aplicar Policies - AUDIT_LOGS
-- ============================================================================

CREATE POLICY "Admins can view audit logs from their tenant"
  ON public.audit_logs FOR SELECT
  USING (tenant_id = get_user_tenant_id() AND user_has_role('admin'));

-- System (service role) pode inserir audit logs
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Audit logs são imutáveis (sem UPDATE ou DELETE)

-- ============================================================================
-- PASSO 11: Verificação
-- ============================================================================

-- Listar todas as policies criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- IMPORTANTE: Service Role vs User Role
-- ============================================================================
-- 
-- RLS é aplicado APENAS quando queries usam "anon" ou "authenticated" role
-- Service role (usado no backend) bypassa RLS automaticamente
-- 
-- Backend (Next.js API):
--   const { data } = await supabaseServer.from('sessions').select('*');
--   ✅ Usa service role - vê todos os dados
-- 
-- Frontend (Client):
--   const { data } = await supabase.from('sessions').select('*');
--   ✅ Usa authenticated role - RLS aplicado
-- 
-- ============================================================================

-- ============================================================================
-- TESTE DAS POLICIES
-- ============================================================================
-- 
-- 1. Autenticar como usuário normal no frontend
-- 2. Tentar queries:
--    SELECT * FROM sessions WHERE tenant_id = 999; -- Outro tenant
--    Deve retornar vazio (RLS bloqueou)
-- 
-- 3. Query normal:
--    SELECT * FROM sessions; -- Sem filtro
--    Deve retornar apenas sessões do próprio tenant
-- 
-- ============================================================================
