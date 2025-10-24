# 🔧 Correção: Migration RLS

## ❌ Erro Encontrado

```
ERROR: 42P01: relation "public.invites" does not exist
```

## ✅ Problema Corrigido

A tabela se chama **`user_invites`**, não `invites`.

---

## 📝 Arquivos Criados

### ✅ Migration Corrigida
- `db/migrations/enable_rls_policies_fixed.sql`

**Melhorias:**
1. ✅ Usa `user_invites` (nome correto)
2. ✅ Remove policies antigas antes de criar novas
3. ✅ Usa `auth.jwt()` do Supabase (já existe)
4. ✅ Inclui query de verificação no final

---

## 🚀 Como Aplicar

### 1. No Supabase SQL Editor

**Ordem de execução:**

```sql
-- 1. Remover user_sessions
-- Executar: db/migrations/remove_user_sessions.sql
DROP TABLE IF EXISTS user_sessions;

-- 2. Habilitar RLS (USAR VERSÃO FIXED)
-- Executar: db/migrations/enable_rls_policies_fixed.sql
-- (copiar todo o arquivo)
```

### 2. Verificar

```sql
-- Deve mostrar ~24 policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Tabelas protegidas:**
- ✅ `tenants` (4 policies)
- ✅ `users` (4 policies)
- ✅ `players` (4 policies)
- ✅ `sessions` (4 policies)
- ✅ `user_invites` (4 policies)
- ✅ `audit_logs` (2 policies)

---

## 🔍 Diferenças

### Arquivo Original (com erro)
```sql
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;  -- ❌ Não existe
```

### Arquivo Corrigido
```sql
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;  -- ✅ Correto
```

---

## ✅ Validação

Após aplicar:

```sql
-- Testar que policies funcionam
-- (autenticado como usuário no frontend)
SELECT * FROM sessions WHERE tenant_id = 999;
-- Deve retornar vazio (RLS bloqueia outro tenant)

SELECT * FROM sessions;
-- Deve retornar apenas sessões do próprio tenant
```

---

## 📚 Arquivos Atualizados

1. ✅ `db/migrations/enable_rls_policies.sql` - Corrigido invites → user_invites
2. ✅ `db/migrations/enable_rls_policies_fixed.sql` - Versão melhorada (USAR ESTA)
3. ✅ `DEPLOY_CHECKLIST.md` - Atualizado com instruções corretas

---

## 🎯 Próximos Passos

1. Aplicar `enable_rls_policies_fixed.sql` no Supabase
2. Verificar com query de validação
3. Testar no frontend

**Status:** ✅ Pronto para aplicar
