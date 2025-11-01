-- Grant permissions para service_role acessar user_tenants
-- Necessário para que a API consiga contar usuários por tenant

-- Dar todas as permissões para o service_role
GRANT ALL ON TABLE poker.user_tenants TO service_role;

-- Também garantir permissão na sequence do ID
GRANT USAGE, SELECT ON SEQUENCE poker.user_tenants_id_seq TO service_role;

-- Comentário
COMMENT ON TABLE poker.user_tenants IS 
  'Tabela de associação N:N entre usuários e tenants. Service role tem acesso total.';
