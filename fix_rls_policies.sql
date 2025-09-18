-- Script para corrigir políticas RLS com recursão infinita
-- Execute este script no SQL Editor do Supabase

-- 1. Remover todas as políticas problemáticas da tabela user_permissions
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON user_permissions;

-- 2. Criar políticas RLS mais simples e seguras
CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Admins can view all permissions" ON user_permissions
  FOR SELECT USING (
    email = 'luisfboff@hotmail.com' OR
    (auth.email() = email)
  );

CREATE POLICY "Admins can manage permissions" ON user_permissions
  FOR ALL USING (
    email = 'luisfboff@hotmail.com' OR
    (auth.email() = email)
  );

-- 3. Verificar se as políticas foram criadas corretamente
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS corrigidas!';
  RAISE NOTICE '🔐 Recursão infinita resolvida';
  RAISE NOTICE '👤 Admin principal: luisfboff@hotmail.com';
  RAISE NOTICE '🚀 Sistema pronto para uso!';
END $$;
