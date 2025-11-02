-- Remover constraint de email único em tenants
-- Grupos diferentes podem ter o mesmo email de contato
-- porque o email pertence ao admin/dono, não ao grupo

-- Dropar a constraint de email único
ALTER TABLE poker.tenants DROP CONSTRAINT IF EXISTS tenants_email_key;

-- Tornar email opcional (pode ser NULL)
ALTER TABLE poker.tenants ALTER COLUMN email DROP NOT NULL;

-- Comentário
COMMENT ON COLUMN poker.tenants.email IS 
  'Email de contato do grupo (geralmente do administrador). Pode ser repetido entre grupos.';
