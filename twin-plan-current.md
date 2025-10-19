# Twin Development Plan
Generated: 2025-10-19 17:21:43
Task: Migração Poker System - Hostinger (PHP + MariaDB) → Vercel (Next.js 15 SSR + Supabase PostgreSQL)
Quality Level: pragmatic

## Análise Técnica

### Estado Atual do Código

**Arquitetura Atual (Hostinger):**
- Next.js 15 com `output: 'export'` (geração estática, sem SSR)
- 29 arquivos PHP em `api/` (auth, sessions, players, invites, super_admin, etc.)
- Autenticação JWT manual via `jwt_helper.php` + `auth_middleware.php`
- MariaDB/MySQL com 8 tabelas principais (multi-tenant via `tenant_id`)
- Build customizado (`scripts/build.js`) que copia PHP para `dist/api/`
- Deploy via GitHub Actions → FTP para Hostinger

**Restrições Técnicas Identificadas:**

1. **JWT Migration (PHP → Node.js)**
   - PHP usa HS256 manual em `jwt_helper.php`
   - Migrar para biblioteca `jose` (já instalada)
   - Tabela `user_sessions` armazena hash do token (manter em PostgreSQL)

2. **SQL Syntax Changes (MariaDB → PostgreSQL)**
   - `AUTO_INCREMENT` → `SERIAL`
   - `ENUM` → `VARCHAR` + CHECK constraint
   - `JSON` → `JSONB`
   - `JSON_EXTRACT(field, '$.key')` → `field->>'key'`
   - Query complexa em `session.php` (linhas 258-275) usa `JSON_TABLE` (migrar para `jsonb_array_elements()`)

3. **Multi-Tenant Isolation**
   - Todos os queries filtram por `tenant_id` do JWT payload
   - Crítico: manter isolamento em Supabase via Row Level Security (RLS) policies
   - NUNCA permitir queries cross-tenant

4. **Colunas JSON Afetadas**
   - `sessions.players_data` (array de objetos)
   - `sessions.recommendations` (array de transferências)
   - `sessions.paid_transfers` (objeto chave-valor)
   - `audit_logs.old_data`, `audit_logs.new_data`

---

## Plano de Implementação

### Arquivos a Criar:

**Database:**
- `db/supabase-schema.sql` - Schema PostgreSQL completo (converter de `create_database.sql`)
  - Converter tipos MySQL → PostgreSQL
  - Adicionar RLS policies para multi-tenant isolation
  - Converter triggers e views

**Supabase Configuration:**
- `lib/supabaseClient.ts` - Cliente Supabase para frontend/SSR (ANON_KEY)
- `lib/supabaseServer.ts` - Cliente server-side com service role (bypass RLS quando necessário)

**Next.js API Routes (substituir 29 PHP files):**
- `app/api/auth/login/route.ts` - Substituir `api/auth.php` (action=login)
- `app/api/auth/logout/route.ts` - Logout endpoint
- `app/api/auth/verify/route.ts` - Verificar token
- `app/api/sessions/route.ts` - GET (list) e POST (create) sessions
- `app/api/sessions/[id]/route.ts` - GET, PUT, DELETE session específica
- `app/api/sessions/[id]/payments/route.ts` - Atualizar `paid_transfers`
- `app/api/players/route.ts` - CRUD players
- `app/api/invites/route.ts` - Sistema de convites
- `app/api/super-admin/tenants/route.ts` - Dashboard super admin

**Migration Utilities:**
- `scripts/migrate-data.ts` - Script para migrar dados MySQL → Supabase
  - Conectar ao MySQL atual (Hostinger)
  - Exportar todas as tabelas (tenants, users, sessions, players, etc.)
  - Transformar dados (ajustar JSON fields, timestamps, IDs)
  - Importar para Supabase

### Arquivos a Modificar:

**Next.js Configuration:**
- `next.config.ts`
  - **Remover**: `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`
  - **Manter**: `reactStrictMode: true`
  - Habilitar SSR (padrão quando remove `output: 'export'`)

**API Client:**
- `lib/api.ts`
  - Atualizar endpoints de `/api/*.php?action=X` para `/api/*/route.ts`
  - Exemplo: `/auth.php?action=login` → `/api/auth/login`
  - Exemplo: `/session.php?id=123` → `/api/sessions/123`
  - Manter interface `ApiResponse` e `ApiError`

**Authentication:**
- `contexts/auth-context.tsx`
  - Integrar com Supabase Auth (`supabase.auth.signInWithPassword`)
  - Trocar `localStorage.token` por `supabase.auth.session()`
  - Manter estrutura `User` interface compatível
  - Adicionar listener para mudanças de auth state

**Types:**
- `lib/types.ts`
  - Ajustar IDs: `number` → `string` se usar UUID (ou manter `number` se usar SERIAL)
  - Adicionar tipos Supabase responses
  - Manter compatibilidade com tipos existentes (`LivePlayer`, `Session`, etc.)

**Build Scripts:**
- `scripts/build.js`
  - Remover lógica de copiar PHP para `dist/api/`
  - Simplificar para apenas `next build`
- `package.json`
  - `"build": "next build"` (sem script customizado)

**Environment Variables:**
- `.env.local`
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://jhodhxvvhohygijqcxbo.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
  POSTGRES_URL=postgres://...
  ```

### Ordem de Implementação:

#### Fase 1: Setup Supabase (Fundação)
1. **Criar schema PostgreSQL** (`db/supabase-schema.sql`)
   - Converter todas as 8 tabelas MySQL
   - Adicionar RLS policies para isolamento multi-tenant
   - Executar no Supabase Dashboard → SQL Editor
   - **Por quê primeiro?** Não adianta criar APIs sem banco pronto

2. **Configurar clientes Supabase** (`lib/supabaseClient.ts`, `lib/supabaseServer.ts`)
   - Criar arquivos com configuração
   - Testar conexão com query simples
   - **Por quê agora?** APIs precisarão desses clientes

3. **Migrar dados existentes** (`scripts/migrate-data.ts`)
   - Extrair dados do MySQL (Hostinger)
   - Transformar e inserir no Supabase
   - Validar integridade (counts, foreign keys)
   - **Por quê agora?** Precisa de dados para testar as APIs

#### Fase 2: Autenticação (Bloqueio para tudo)
4. **Atualizar Next.js config** (`next.config.ts`)
   - Remover `output: 'export'` para habilitar SSR
   - **Por quê agora?** Precisa de SSR para API Routes funcionarem

5. **Criar API Routes de autenticação**
   - `app/api/auth/login/route.ts`
   - `app/api/auth/logout/route.ts`
   - `app/api/auth/verify/route.ts`
   - Integrar Supabase Auth
   - **Por quê agora?** Todas as outras APIs dependem de autenticação

6. **Atualizar Auth Context** (`contexts/auth-context.tsx`)
   - Integrar com Supabase Auth
   - Manter interface `User` compatível
   - Testar login/logout
   - **Por quê agora?** Frontend precisa de auth funcionando antes de testar outras features

#### Fase 3: APIs Core (CRUD essencial)
7. **Criar API Routes de Sessions**
   - `app/api/sessions/route.ts` (list, create)
   - `app/api/sessions/[id]/route.ts` (get, update, delete)
   - `app/api/sessions/[id]/payments/route.ts`
   - Portar lógica de `api/session.php` (incluindo `updatePlayersStats`)
   - **Por quê agora?** Sessions são 70% do uso do app

8. **Criar API Routes de Players**
   - `app/api/players/route.ts`
   - Portar lógica de `api/players.php`
   - **Por quê agora?** Players são necessários para criar sessions

9. **Atualizar API Client** (`lib/api.ts`)
   - Mudar todos os endpoints
   - Testar cada chamada no frontend
   - **Por quê agora?** Com APIs prontas, frontend precisa ser atualizado

#### Fase 4: Features Secundárias
10. **Criar API Routes de Invites**
    - `app/api/invites/route.ts`
    - Integrar email (manter SMTP ou usar Supabase Email)
    - **Por quê depois?** Feature menos usada, não bloqueia uso básico

11. **Criar API Routes de Super Admin**
    - `app/api/super-admin/tenants/route.ts`
    - Portar lógica de `api/super_admin.php`
    - **Por quê depois?** Feature administrativa, não bloqueia usuários

12. **Testar todos os fluxos**
    - Login → Dashboard → Criar sessão → Transferências → Logout
    - Criar player → Convidar → Aceitar convite
    - Super admin → Ver tenants → Aprovar
    - **Por quê agora?** Validar que tudo funciona end-to-end

#### Fase 5: Deploy e Validação
13. **Deploy no Vercel**
    - Conectar repositório no dashboard Vercel
    - Configurar env vars (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
    - Deploy automático de `main` branch
    - **Por quê agora?** Testar em produção real

14. **Testes em produção**
    - Validar SSR funcionando
    - Validar multi-tenant isolation
    - Performance check
    - **Por quê agora?** Garantir que migração foi bem-sucedida

15. **Desativar Hostinger**
    - Backup final do MySQL
    - Desligar serviço PHP
    - **Por quê por último?** Manter rollback plan até ter certeza que tudo funciona

---

## Riscos Técnicos

### 1. Row Level Security (RLS) Mal Configurada
**Problema**: Se RLS policies estiverem erradas, um tenant pode ver dados de outro (vazamento de dados crítico).

**Mitigação**:
- Testar RLS com múltiplos usuários antes de produção
- Criar policy exemplo:
  ```sql
  CREATE POLICY "tenant_isolation_select" ON sessions
    FOR SELECT
    USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::integer);
  ```
- Fazer queries de teste cross-tenant e confirmar que falham

### 2. Incompatibilidade SQL (MySQL → PostgreSQL)
**Problema**: Queries MySQL que não funcionam em PostgreSQL (especialmente JSON functions em `session.php`).

**Exemplo problemático**:
```sql
-- MySQL
JSON_UNQUOTE(JSON_EXTRACT(pd.value, '$.name'))

-- PostgreSQL
pd.value->>'name'
```

**Mitigação**:
- Identificar todas as queries com JSON (várias em `session.php` linhas 258-321)
- Converter para sintaxe PostgreSQL: `->` para object, `->>` para text, `@>` para contains
- Testar cada query no Supabase SQL Editor antes de implementar

### 3. Perda de Dados na Migração
**Problema**: Script de migração falha ou dados corrompem durante transferência.

**Mitigação**:
- Backup completo do MySQL antes de migrar (`mysqldump`)
- Rodar migration em staging primeiro (criar projeto Supabase separado)
- Validar counts: `SELECT COUNT(*) FROM sessions` MySQL vs Supabase
- Validar samples: comparar 10-20 registros manualmente
- Rollback plan: manter Hostinger ativo por 30 dias

### 4. Breaking Changes em Autenticação
**Problema**: Usuários existentes não conseguem logar após migração (passwords não funcionam).

**Mitigação**:
- Supabase Auth usa bcrypt (compatível com PHP `password_hash`)
- Importar hashes de senha existentes para `auth.users` do Supabase
- Ou: forçar reset de senha para todos (email com link)
- Testar com usuários reais em staging antes de produção

### 5. Session Auto-Approval Logic
**Problema**: Lógica de auto-approval (`lib/sessionAutoApproval.ts`) pode quebrar com novas APIs.

**Mitigação**:
- Não modificar a lógica, apenas ajustar chamadas de API
- Testar cenário completo: criar sessão → verificar se auto-aprova conforme regras
- Manter logs de debug durante migração

### 6. Transfer Algorithm Regression
**Problema**: Algoritmo de transferências (`lib/transferSystem.ts`) calcula valores errados com novos dados.

**Mitigação**:
- Algoritmo é 100% frontend, não muda
- Apenas validar que dados de `players_data` vêm corretamente da API
- Testar com sessão real: verificar que recomendações batem com sistema antigo

---

## Próximo Passo

Para implementar este plano, digite: **ok**, **continue**, ou **approve**
Para cancelar, digite: **cancel** ou inicie uma nova tarefa

**Nota**: A implementação completa envolve ~17-24 horas de desenvolvimento e seguirá as 5 fases acima sequencialmente.
