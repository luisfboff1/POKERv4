# Migração para o Schema "poker"

## Visão Geral

Todas as tabelas, funções, triggers e views do projeto foram migradas do schema `public` para o schema `poker` no Supabase.

## Arquivos Alterados

### 1. Configuração do Cliente Supabase

#### `/lib/supabaseServer.ts`
- Alterado `schema: 'public'` para `schema: 'poker'`
- Todas as queries server-side agora apontam para o schema poker

#### `/lib/supabaseClient.ts`
- Adicionado configuração `db: { schema: 'poker' }`
- Todas as queries client-side agora apontam para o schema poker

### 2. Script de Migração SQL

#### `/db/migrate_to_poker_schema.sql`
Este script realiza:

1. **Criação do schema poker**
2. **Migração de tabelas:**
   - tenants
   - users
   - players
   - sessions
   - user_invites
   - audit_logs
   - player_transfers
   - user_sessions

3. **Migração de sequences:**
   - Todas as sequences de ID são movidas para o schema poker

4. **Migração de funções:**
   - `update_updated_at_column()` - Função trigger para atualizar updated_at
   - `setval()` - Função para resetar valores de sequences
   - `get_user_tenant_id()` - Função helper para obter tenant_id do usuário autenticado
   - `user_has_role()` - Função helper para verificar role do usuário

5. **Recriação de triggers:**
   - `update_tenants_updated_at`
   - `update_users_updated_at`
   - `update_players_updated_at`
   - `update_sessions_updated_at`
   - `update_invites_updated_at`
   - `update_transfers_updated_at`

6. **Migração de views:**
   - `super_admin_stats` - Estatísticas agregadas para super admin
   - `all_tenants_view` - View de todos os tenants com dados agregados

7. **Configuração de permissões:**
   - Grants para roles `authenticated`, `anon` e `service_role`
   - Default privileges para futuras tabelas

## Como Executar a Migração

### Pré-requisitos
- Acesso ao Supabase SQL Editor
- Permissões de administrador no projeto Supabase
- Backup dos dados (recomendado)

### Passos

1. **Fazer backup dos dados (IMPORTANTE)**
   ```sql
   -- Execute no Supabase SQL Editor para verificar os dados antes da migração
   SELECT COUNT(*) FROM public.tenants;
   SELECT COUNT(*) FROM public.users;
   SELECT COUNT(*) FROM public.players;
   SELECT COUNT(*) FROM public.sessions;
   ```

2. **Executar o script de migração**
   - Abra o Supabase SQL Editor
   - Copie todo o conteúdo de `/db/migrate_to_poker_schema.sql`
   - Cole no editor e execute

3. **CRÍTICO: Configurar o PostgREST para expor o schema poker**
   
   **Este passo é ESSENCIAL para a API funcionar!**
   
   - Vá para Supabase Dashboard → Settings → API
   - Procure por "Exposed schemas" ou "DB Schema" nas configurações de API
   - Adicione `poker` à lista de schemas expostos (separados por vírgula)
   - Exemplo: `public,poker,storage`
   - Salve as alterações
   - Aguarde alguns segundos para o PostgREST reiniciar
   
   **Sem este passo, você receberá erro "Failed to fetch user data" no login!**

4. **Verificar a migração**
   ```sql
   -- Verificar se as tabelas estão no schema poker
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'poker'
   ORDER BY table_name;

   -- Verificar se os dados foram migrados
   SELECT COUNT(*) FROM poker.tenants;
   SELECT COUNT(*) FROM poker.users;
   SELECT COUNT(*) FROM poker.players;
   SELECT COUNT(*) FROM poker.sessions;
   ```

5. **Verificar funções e triggers**
   ```sql
   -- Listar funções no schema poker
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'poker';

   -- Listar triggers
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE trigger_schema = 'poker';
   ```

6. **Testar a aplicação**
   - Restart da aplicação
   - Testar login
   - Testar criação/listagem de sessões
   - Testar criação/listagem de players
   - Verificar logs de erro

## Row Level Security (RLS)

As políticas de RLS são automaticamente movidas com as tabelas. As funções helper (`get_user_tenant_id()` e `user_has_role()`) foram atualizadas para referenciar o schema poker.

### Verificar RLS
```sql
-- Listar todas as policies no schema poker
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'poker'
ORDER BY tablename, policyname;
```

## Rollback (se necessário)

Se houver problemas, você pode reverter a migração:

```sql
-- 1. Mover tabelas de volta para public
ALTER TABLE poker.tenants SET SCHEMA public;
ALTER TABLE poker.users SET SCHEMA public;
ALTER TABLE poker.players SET SCHEMA public;
ALTER TABLE poker.sessions SET SCHEMA public;
ALTER TABLE poker.user_invites SET SCHEMA public;
ALTER TABLE poker.audit_logs SET SCHEMA public;
ALTER TABLE poker.player_transfers SET SCHEMA public;
ALTER TABLE poker.user_sessions SET SCHEMA public;

-- 2. Mover sequences de volta
ALTER SEQUENCE poker.tenants_id_seq SET SCHEMA public;
ALTER SEQUENCE poker.users_id_seq SET SCHEMA public;
ALTER SEQUENCE poker.players_id_seq SET SCHEMA public;
ALTER SEQUENCE poker.sessions_id_seq SET SCHEMA public;
ALTER SEQUENCE poker.user_invites_id_seq SET SCHEMA public;
ALTER SEQUENCE poker.audit_logs_id_seq SET SCHEMA public;
ALTER SEQUENCE poker.player_transfers_id_seq SET SCHEMA public;
ALTER SEQUENCE poker.user_sessions_id_seq SET SCHEMA public;

-- 3. Recriar funções no public (copiar do arquivo original)

-- 4. Atualizar código:
--    - lib/supabaseServer.ts: schema: 'public'
--    - lib/supabaseClient.ts: remover db: { schema: 'poker' }
```

## Alterações de Código

### Antes
```typescript
// lib/supabaseServer.ts
export const supabaseServer = createClient(url, key, {
  db: {
    schema: 'public',
  },
});
```

### Depois
```typescript
// lib/supabaseServer.ts
export const supabaseServer = createClient(url, key, {
  db: {
    schema: 'poker',
  },
});
```

## Notas Importantes

1. **Service Role vs Authenticated Role:**
   - Service role (backend) bypassa RLS automaticamente
   - Authenticated role (frontend) tem RLS aplicado
   - Nenhuma mudança necessária no comportamento da aplicação

2. **Queries Diretas:**
   - Todas as queries via Supabase client automaticamente usam o schema configurado
   - Não é necessário especificar `poker.tablename` nas queries

3. **Migrações Futuras:**
   - Sempre criar novas tabelas no schema `poker`
   - Usar `CREATE TABLE poker.table_name` em novos scripts SQL

4. **Ambiente de Desenvolvimento:**
   - Garantir que `.env.local` tem as variáveis corretas do Supabase
   - Executar a migração no ambiente de dev antes de prod

## Troubleshooting

### ❌ Erro: "Failed to fetch user data" no login

**Causa:** O schema `poker` não está exposto no PostgREST.

**Solução:**
1. Vá para Supabase Dashboard → Settings → API
2. Encontre "Exposed schemas" nas configurações
3. Adicione `poker` à lista (ex: `public,poker,storage`)
4. Salve e aguarde alguns segundos
5. Tente fazer login novamente

**Verificação:**
```sql
-- Teste se você consegue acessar a tabela via API
SELECT * FROM poker.users LIMIT 1;
```

### ❌ Erro: Relação não encontrada ou foreign key error

**Causa:** As foreign keys não foram preservadas na migração.

**Solução:**
```sql
-- Verificar foreign keys
SELECT 
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'poker';
```

### ❌ Erro: Políticas RLS não funcionam

**Causa:** As funções helper podem estar em um schema diferente.

**Solução:**
Verificar se as funções estão no schema poker:
```sql
SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_name IN ('get_user_tenant_id', 'user_has_role');
```

## Suporte

Em caso de problemas:
1. Verificar logs da aplicação Next.js
2. Verificar logs do Supabase (Dashboard > Logs)
3. Testar queries diretamente no SQL Editor
4. Consultar a documentação do Supabase sobre schemas: https://supabase.com/docs/guides/database/schemas
