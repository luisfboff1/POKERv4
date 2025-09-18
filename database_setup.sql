-- Script para configurar o banco de dados com sistema de permissões
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de usuários com permissões
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_email ON user_permissions(email);
CREATE INDEX IF NOT EXISTS idx_user_permissions_role ON user_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_approved ON user_permissions(is_approved);

-- 3. Inserir o administrador principal (luisfboff@hotmail.com)
INSERT INTO user_permissions (user_id, email, role, is_approved, approved_at)
SELECT 
  id, 
  'luisfboff@hotmail.com', 
  'admin', 
  TRUE, 
  NOW()
FROM auth.users 
WHERE email = 'luisfboff@hotmail.com'
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_approved = TRUE,
  approved_at = NOW();

-- 4. Criar função para verificar permissões
CREATE OR REPLACE FUNCTION check_user_permission(user_email TEXT, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissions 
    WHERE email = user_email 
    AND is_approved = TRUE 
    AND (
      role = 'admin' OR 
      (required_role = 'viewer' AND role IN ('viewer', 'editor', 'admin')) OR
      (required_role = 'editor' AND role IN ('editor', 'admin'))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar função para aprovar usuário
CREATE OR REPLACE FUNCTION approve_user(user_email TEXT, new_role TEXT, approved_by_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  approver_id UUID;
BEGIN
  -- Verificar se quem está aprovando é admin
  SELECT user_id INTO approver_id 
  FROM user_permissions 
  WHERE email = approved_by_email AND role = 'admin' AND is_approved = TRUE;
  
  IF approver_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Aprovar o usuário
  UPDATE user_permissions 
  SET 
    is_approved = TRUE,
    role = new_role,
    approved_by = approver_id,
    approved_at = NOW()
  WHERE email = user_email;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar função para rejeitar usuário
CREATE OR REPLACE FUNCTION reject_user(user_email TEXT, rejected_by_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rejecter_id UUID;
BEGIN
  -- Verificar se quem está rejeitando é admin
  SELECT user_id INTO rejecter_id 
  FROM user_permissions 
  WHERE email = rejected_by_email AND role = 'admin' AND is_approved = TRUE;
  
  IF rejecter_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remover o usuário
  DELETE FROM user_permissions WHERE email = user_email;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Configurar RLS (Row Level Security)
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias permissões
CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT USING (auth.email() = email);

-- Política para admins verem todas as permissões
CREATE POLICY "Admins can view all permissions" ON user_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_permissions up 
      WHERE up.email = auth.email() 
      AND up.role = 'admin' 
      AND up.is_approved = TRUE
    )
  );

-- Política para admins gerenciarem permissões
CREATE POLICY "Admins can manage permissions" ON user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_permissions up 
      WHERE up.email = auth.email() 
      AND up.role = 'admin' 
      AND up.is_approved = TRUE
    )
  );

-- 9. Modificar a tabela sessions para incluir permissões
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Política para sessions baseada em permissões
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON sessions;

CREATE POLICY "Users can view sessions based on permissions" ON sessions
  FOR SELECT USING (
    created_by_email = auth.email() OR
    is_public = TRUE OR
    EXISTS (
      SELECT 1 FROM user_permissions up 
      WHERE up.email = auth.email() 
      AND up.is_approved = TRUE
    )
  );

CREATE POLICY "Users can manage sessions based on permissions" ON sessions
  FOR ALL USING (
    created_by_email = auth.email() OR
    EXISTS (
      SELECT 1 FROM user_permissions up 
      WHERE up.email = auth.email() 
      AND up.role IN ('editor', 'admin')
      AND up.is_approved = TRUE
    )
  );
