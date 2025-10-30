# 🚀 Deploy Checklist - Security Migration

## ⚡ Ações Imediatas (Antes do Deploy)

### 1. ✅ Código (Já feito)
- [x] JWT customizado removido
- [x] Supabase Auth implementado
- [x] Typecheck passou
- [x] Dependências atualizadas

### 2. 🗄️ Banco de Dados (FAZER AGORA)

#### Passo 1: Conectar ao Supabase
```bash
# Acessar: https://supabase.com/dashboard/project/SEU_PROJETO/editor
```

#### Passo 2: Executar Migrations

**Migration 1: Remover user_sessions**
```sql
-- Copiar e colar no SQL Editor:
-- Conteúdo de: db/migrations/remove_user_sessions.sql

DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_tenant_id;
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP TABLE IF EXISTS user_sessions;
```

**Migration 2: Habilitar RLS (USAR VERSÃO CORRIGIDA)**
```sql
-- ⚠️ IMPORTANTE: Usar a versão FIXED
-- Copiar e colar no SQL Editor:
-- Conteúdo de: db/migrations/enable_rls_policies_fixed.sql

-- A versão corrigida:
-- ✅ Remove policies antigas (evita conflitos)
-- ✅ Usa user_invites (não invites)
-- ✅ Usa auth.jwt() do Supabase
-- ✅ Inclui verificação final

-- Executar arquivo completo (copiar todo o conteúdo)
```

**Verificação:**
```sql
-- Após executar, verificar policies criadas:
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Deve mostrar ~24 policies (4 por tabela x 6 tabelas)
```

### 3. 🔐 Variáveis de Ambiente (Verificar)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# REMOVER (não mais necessário):
# JWT_SECRET=xxx
```

### 4. 📦 Build & Deploy

```bash
# Build local (teste)
pnpm build

# Se build passar, fazer deploy
git add .
git commit -m "🔒 Security: Remove JWT vulnerability, migrate to Supabase Auth"
git push origin main
```

---

## ⚠️ IMPORTANTE: Sincronização de Usuários

### Problema
Usuários precisam existir em 2 lugares:
1. **Supabase Auth** (auth.users) - Para autenticação
2. **Database** (public.users) - Para dados do app

### Solução

#### Opção A: Forçar Re-registro (Recomendado)
```typescript
// Todos os usuários fazem logout
// Próximo login cria conta Supabase automaticamente
```

#### Opção B: Migrar Usuários Existentes
```typescript
// Para cada usuário em public.users:
const { data, error } = await supabaseServer.auth.admin.createUser({
  email: user.email,
  password: 'senha-temporaria-123',
  email_confirm: true,
});

// Enviar email de reset de senha
await supabaseServer.auth.resetPasswordForEmail(user.email);
```

---

## 🧪 Testes Pós-Deploy

### 1. Login
```bash
curl -X POST https://seu-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tenant1.com", "password": "senha"}'

# Espera-se: token Supabase + refresh_token
```

### 2. Rota Protegida
```bash
curl https://seu-app.com/api/sessions \
  -H "Authorization: Bearer SEU_TOKEN"

# Espera-se: Sessões do tenant
```

### 3. Logout
```bash
curl -X POST https://seu-app.com/api/auth/logout \
  -H "Authorization: Bearer SEU_TOKEN"

# Espera-se: Sucesso
```

### 4. RLS
```sql
-- No SQL Editor (autenticado como usuário):
SELECT * FROM sessions WHERE tenant_id = 999; -- Outro tenant

-- Espera-se: Vazio (RLS bloqueou)
```

---

## 🔴 Rollback (Se necessário)

### Se algo der errado:

```bash
# 1. Reverter código
git revert HEAD

# 2. Restaurar auth-helpers.ts
Move-Item lib/auth-helpers.ts.backup lib/auth-helpers.ts

# 3. Reinstalar jose
pnpm add jose@^5.9.6

# 4. Recriar user_sessions no banco
CREATE TABLE user_sessions ...
```

---

## ✅ Validação Final

- [ ] Migrations aplicadas no banco
- [ ] Build passou sem erros
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Rotas protegidas funcionam
- [ ] RLS bloqueia acessos incorretos
- [ ] Audit logs registrando eventos

---

## 📊 Métricas de Sucesso

### Código
- ✅ ~200 linhas removidas
- ✅ 1 dependência removida
- ✅ 0 erros de compilação

### Segurança
- ✅ Secret hardcoded eliminado
- ✅ Tokens 1h (vs 24h)
- ✅ RLS implementado
- ✅ Conformidade SOC 2

---

## 📞 Ajuda

Em caso de problemas:
1. Ver `SECURITY_MIGRATION_SUPABASE_AUTH.md` (documentação completa)
2. Ver `SUPABASE_AUTH_QUICKSTART.md` (guia rápido)
3. Verificar Supabase Logs
4. Verificar audit_logs no banco

---

**🎯 LEMBRETE:** Aplicar migrations no banco ANTES de fazer deploy!
