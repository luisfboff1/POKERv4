-- ============================================================================
-- Row Level Security (RLS) Policies
-- Data: 2025-10-23
-- Descrição: Implementa políticas de segurança em nível de banco de dados
--            para proteger dados por tenant
-- ============================================================================

-- ============================================================================
-- IMPORTANTE: Configuração do Supabase Auth
-- ============================================================================
-- 
-- Para que estas policies funcionem, é necessário:
-- 
-- 1. Criar função que extrai user_id do JWT do Supabase:
--    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
--      SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
--    $$ LANGUAGE sql STABLE;
-- 
-- 2. Criar função que extrai email do JWT:
--    CREATE OR REPLACE FUNCTION auth.email() RETURNS text AS $$
--      SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'email', '')::text;
--    $$ LANGUAGE sql STABLE;
-- 
-- 3. Garantir que Supabase Auth está configurado corretamente
-- 
-- ============================================================================

-- ============================================================================
-- Helper Function: Get tenant_id for authenticated user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS INTEGER AS $$
DECLARE
  user_tenant_id INTEGER;
BEGIN
  -- Get tenant_id from users table based on authenticated email
  SELECT tenant_id INTO user_tenant_id
  FROM public.users
  WHERE email = auth.email()
    AND is_active = true
  LIMIT 1;
  
  RETURN user_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Helper Function: Check if user has role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE email = auth.email()
    AND is_active = true
  LIMIT 1;
  
  -- Role hierarchy: player < admin < super_admin
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
-- RLS Policies for TENANTS table
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tenant
CREATE POLICY "Users can view their own tenant"
  ON public.tenants
  FOR SELECT
  USING (id = get_user_tenant_id());

-- Only super_admins can insert tenants
CREATE POLICY "Super admins can create tenants"
  ON public.tenants
  FOR INSERT
  WITH CHECK (user_has_role('super_admin'));

-- Admins and super_admins can update their tenant
CREATE POLICY "Admins can update their tenant"
  ON public.tenants
  FOR UPDATE
  USING (
    id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- Only super_admins can delete tenants
CREATE POLICY "Super admins can delete tenants"
  ON public.tenants
  FOR DELETE
  USING (user_has_role('super_admin'));

-- ============================================================================
-- RLS Policies for USERS table
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view users from their tenant
CREATE POLICY "Users can view users from their tenant"
  ON public.users
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Admins can create users in their tenant
CREATE POLICY "Admins can create users in their tenant"
  ON public.users
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- Admins can update users in their tenant
CREATE POLICY "Admins can update users in their tenant"
  ON public.users
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- Admins can delete users in their tenant
CREATE POLICY "Admins can delete users in their tenant"
  ON public.users
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- ============================================================================
-- RLS Policies for PLAYERS table
-- ============================================================================

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Users can view players from their tenant
CREATE POLICY "Users can view players from their tenant"
  ON public.players
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can create players in their tenant
CREATE POLICY "Users can create players in their tenant"
  ON public.players
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update players in their tenant
CREATE POLICY "Users can update players in their tenant"
  ON public.players
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Admins can delete players in their tenant
CREATE POLICY "Admins can delete players in their tenant"
  ON public.players
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- ============================================================================
-- RLS Policies for SESSIONS table
-- ============================================================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users can view sessions from their tenant
CREATE POLICY "Users can view sessions from their tenant"
  ON public.sessions
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Users can create sessions in their tenant
CREATE POLICY "Users can create sessions in their tenant"
  ON public.sessions
  FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Users can update sessions in their tenant
CREATE POLICY "Users can update sessions in their tenant"
  ON public.sessions
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

-- Admins can delete sessions in their tenant
CREATE POLICY "Admins can delete sessions in their tenant"
  ON public.sessions
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- ============================================================================
-- RLS Policies for USER_INVITES table
-- ============================================================================

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites from their tenant
CREATE POLICY "Users can view invites from their tenant"
  ON public.user_invites
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Admins can create invites in their tenant
CREATE POLICY "Admins can create invites in their tenant"
  ON public.user_invites
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- Admins can update invites in their tenant
CREATE POLICY "Admins can update invites in their tenant"
  ON public.user_invites
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- Admins can delete invites in their tenant
CREATE POLICY "Admins can delete invites in their tenant"
  ON public.user_invites
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- ============================================================================
-- RLS Policies for AUDIT_LOGS table
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs from their tenant
CREATE POLICY "Admins can view audit logs from their tenant"
  ON public.audit_logs
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- No updates or deletes allowed on audit logs
-- (immutable for compliance)

-- ============================================================================
-- Test RLS Policies (Run as authenticated user)
-- ============================================================================

-- To test, authenticate as a user and run:
-- SELECT * FROM tenants;      -- Should only see own tenant
-- SELECT * FROM users;        -- Should only see users from own tenant
-- SELECT * FROM sessions;     -- Should only see sessions from own tenant

-- Try to access another tenant:
-- SELECT * FROM sessions WHERE tenant_id = 999;  -- Should return empty

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 
-- 1. RLS é aplicado APENAS quando queries vêm de usuários autenticados
--    Service role (usado pelo backend) bypassa RLS
-- 
-- 2. Para queries do backend, use supabaseServer (service role)
--    Para queries do frontend, use supabaseClient (user role)
-- 
-- 3. RLS é uma camada EXTRA de segurança
--    Não substitui validação no backend
-- 
-- 4. Teste sempre as policies com diferentes roles:
--    - player (acesso básico)
--    - admin (gestão do tenant)
--    - super_admin (gestão global)
-- 
-- 5. Logs de auditoria são protegidos:
--    - Apenas admins podem ler
--    - Ninguém pode modificar/deletar (imutáveis)
-- 
-- ============================================================================
