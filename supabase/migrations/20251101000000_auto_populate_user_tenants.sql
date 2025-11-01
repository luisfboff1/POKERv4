-- Migration: Auto-populate user_tenants quando criar/atualizar usuário
-- Garante sincronização automática entre poker.users e poker.user_tenants

-- Função que sincroniza poker.users -> poker.user_tenants
CREATE OR REPLACE FUNCTION poker.sync_user_to_user_tenants()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tem tenant_id, garantir que existe em user_tenants
  IF NEW.tenant_id IS NOT NULL THEN
    -- Inserir ou atualizar associação
    -- Mapear super_admin -> admin porque user_tenants só aceita 'admin' ou 'player'
    INSERT INTO poker.user_tenants (user_id, tenant_id, role, player_id, is_active)
    VALUES (
      NEW.id, 
      NEW.tenant_id, 
      CASE WHEN NEW.role = 'super_admin' THEN 'admin' ELSE NEW.role END,
      NEW.player_id, 
      true
    )
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET
      role = CASE WHEN NEW.role = 'super_admin' THEN 'admin' ELSE NEW.role END,
      player_id = EXCLUDED.player_id,
      is_active = true,
      updated_at = CURRENT_TIMESTAMP;
  END IF;

  -- Se removeu tenant_id (NULL), desativar associação
  IF OLD.tenant_id IS NOT NULL AND NEW.tenant_id IS NULL THEN
    UPDATE poker.user_tenants 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.id AND tenant_id = OLD.tenant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para INSERT e UPDATE em poker.users
DROP TRIGGER IF EXISTS sync_user_tenants_on_user_change ON poker.users;
CREATE TRIGGER sync_user_tenants_on_user_change
  AFTER INSERT OR UPDATE OF tenant_id, role, player_id ON poker.users
  FOR EACH ROW
  EXECUTE FUNCTION poker.sync_user_to_user_tenants();

-- Popular dados existentes (executar uma vez)
-- Mapear super_admin -> admin porque user_tenants só aceita 'admin' ou 'player'
INSERT INTO poker.user_tenants (user_id, tenant_id, role, player_id, is_active)
SELECT 
  u.id as user_id,
  u.tenant_id,
  CASE 
    WHEN u.role = 'super_admin' THEN 'admin'
    ELSE u.role
  END as role,
  u.player_id,
  true as is_active
FROM poker.users u
WHERE u.tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Comentário
COMMENT ON FUNCTION poker.sync_user_to_user_tenants() IS 
  'Sincroniza automaticamente poker.users -> poker.user_tenants quando usuário é criado/atualizado';
