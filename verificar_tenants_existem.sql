-- Verificar se tenant existe
SELECT 
  'TENANTS NA TABELA' as info,
  COUNT(*) as total,
  array_agg(name) as nomes
FROM poker.tenants;

-- Ver detalhes do tenant
SELECT * FROM poker.tenants;

-- Testar a query que a API usa
SELECT * FROM poker.tenants ORDER BY name;
