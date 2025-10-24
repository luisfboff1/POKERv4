# 🔒 Guia Rápido - Supabase Auth

## ✅ O que mudou?

**ANTES:** JWT customizado com `jose` + tabela `user_sessions`  
**AGORA:** 100% Supabase Auth (sem JWT customizado)

---

## 🚀 Como usar nas rotas API

### Login
```typescript
import { supabaseServer } from '@/lib/supabaseServer';

const { data: authData } = await supabaseServer.auth.signInWithPassword({
  email,
  password,
});

// Retornar token
return {
  token: authData.session.access_token,
  refresh_token: authData.session.refresh_token,
  expires_in: authData.session.expires_in, // 3600 (1h)
};
```

### Logout
```typescript
import { supabaseServer } from '@/lib/supabaseServer';

await supabaseServer.auth.signOut();
```

### Proteger Rotas
```typescript
import { requireAuth } from '@/lib/supabase-auth';

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  
  // user.id, user.tenant_id, user.role, etc.
  // Token já validado pelo Supabase
}
```

### Verificar Role
```typescript
import { requireAuth, requireRole } from '@/lib/supabase-auth';

const user = await requireAuth(req);
requireRole(user, 'admin'); // Lança erro se não for admin
```

### Verificar Limites do Plano
```typescript
import { checkPlanLimits } from '@/lib/supabase-auth';

const limits = await checkPlanLimits(user.tenant_id, 'sessions_monthly');

if (!limits.allowed) {
  return NextResponse.json({
    error: `Limite atingido (${limits.limit})`
  }, { status: 403 });
}
```

---

## 🔐 Tokens

### Access Token
- **Duração:** 1 hora
- **Uso:** Todas as chamadas API
- **Renovação:** Automática via refresh token

### Refresh Token
- **Duração:** 30 dias
- **Uso:** Renovar access token
- **Revogação:** Automática no logout

---

## 🗄️ RLS Policies

**O que é?** Row Level Security protege dados em nível de banco.

### Como funciona?

```sql
-- Usuários só veem dados do próprio tenant
CREATE POLICY "Users can view sessions from their tenant"
  ON public.sessions
  FOR SELECT
  USING (tenant_id = get_user_tenant_id());
```

### Importante

- ✅ Backend usa `supabaseServer` (service role) - bypassa RLS
- ✅ Frontend usa `supabaseClient` (user role) - aplica RLS

---

## 📝 Migrations

### Aplicar no Supabase SQL Editor

1. **Remover user_sessions**
   ```bash
   db/migrations/remove_user_sessions.sql
   ```

2. **Habilitar RLS**
   ```bash
   db/migrations/enable_rls_policies.sql
   ```

---

## 🧪 Testar

### 1. Login funciona?
```bash
curl -X POST https://seu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tenant1.com", "password": "senha123"}'
```

### 2. Rota protegida funciona?
```bash
curl https://seu-dominio.com/api/sessions \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3. RLS bloqueia outros tenants?
```sql
-- No SQL Editor, autenticado:
SELECT * FROM sessions WHERE tenant_id = 999; -- Deve retornar vazio
```

---

## ⚠️ Troubleshooting

### "Token inválido"
→ Limpar localStorage e fazer login novamente

### "Usuário não encontrado"
→ Verificar se existe em `auth.users` E `public.users`

### RLS bloqueando queries
→ Backend deve usar `supabaseServer` (service role)

---

## 📚 Docs Completas

Ver: `SECURITY_MIGRATION_SUPABASE_AUTH.md`
