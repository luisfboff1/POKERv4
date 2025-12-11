# Correção de Permissões - Ranking Periods

## Problema
Erro ao criar novos períodos de ranking devido a problemas de permissão RLS (Row Level Security) no Supabase.

## Solução

### Opção 1: Aplicar Migração via SQL Editor (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo:
   ```
   supabase/migrations/20251211_verify_ranking_periods_permissions.sql
   ```
6. Clique em **Run** para executar o script

### Opção 2: Verificar Permissões Manualmente

Execute a seguinte query no SQL Editor para verificar as políticas atuais:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'poker' AND tablename = 'ranking_periods';
```

Se você não vir uma política chamada `admins_manage_tenant_periods` que inclua `super_admin`, execute o script da Opção 1.

### Opção 3: Usar Supabase CLI (Para Desenvolvedores)

Se você tem o Supabase CLI instalado:

```bash
# Aplicar as migrações pendentes
supabase db push

# Ou aplicar uma migração específica
supabase migration up
```

## Verificação

Após aplicar a correção, tente criar um novo período de ranking novamente. O erro não deve mais ocorrer.

## Detalhes Técnicos

O problema estava relacionado à política RLS que não incluía o role `super_admin`. A política agora permite que tanto `admin` quanto `super_admin` possam:
- Criar (INSERT)
- Atualizar (UPDATE)
- Excluir (DELETE)
- Visualizar (SELECT)

períodos de ranking em seus respectivos tenants.

## Teste Adicional

Se você ainda tiver problemas, tente criar um período novamente e:
1. Verifique o console do terminal (onde `pnpm run dev` está rodando)
2. Procure por logs que começam com "Supabase insert error details:"
3. Envie essas informações para análise adicional
