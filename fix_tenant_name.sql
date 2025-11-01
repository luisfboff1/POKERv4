-- Verificar nome do tenant
SELECT id, name FROM poker.tenants;

-- Corrigir se necessário
UPDATE poker.tenants 
SET name = 'Casa Luis'
WHERE id = 1;
