# Relacionamento Supabase Auth ↔ Tenant ↔ Player

Este documento explica como o sistema conecta a autenticação do Supabase (UID) com os conceitos de `tenant_id` (organização/clube) e `player` (jogador) no banco de dados.

## Visão Geral da Arquitetura

### 1. Supabase Auth (Camada de Autenticação)
- Gerencia login/logout e sessões
- Armazena credenciais e tokens
- UID único por usuário autenticado
- Suporta múltiplos provedores (email/senha, Google, Microsoft)

### 2. Tabela `tenants` (Organizações/Clubes)
- Representa um clube ou organização de poker
- Cada tenant tem seu próprio plano e limites
- Isolamento multi-tenant via Row Level Security (RLS)

### 3. Tabela `users` (Usuários do Sistema)
- Conecta Supabase Auth com nosso modelo de dados
- Relaciona usuário autenticado → tenant (clube)
- Relaciona usuário → player (perfil de jogador)
- Armazena papel/role (admin, player, super_admin)

### 4. Tabela `players` (Perfil de Jogador)
- Dados específicos de poker (estatísticas, histórico)
- Pode existir sem usuário (jogadores convidados)
- Pode ser vinculado a um usuário posteriormente

## Modelo de Relacionamento

```
┌─────────────────────┐
│  Supabase Auth      │
│  (auth.users)       │
│  - UID (UUID)       │
│  - email            │
│  - provider         │
└──────────┬──────────┘
           │
           │ Relacionado via EMAIL
           │
           ▼
┌─────────────────────┐       ┌─────────────────────┐
│  users              │       │  tenants            │
│  - id (PK)          │◄──────┤  - id (PK)          │
│  - tenant_id (FK) ──┼──────►│  - name             │
│  - player_id (FK)   │       │  - plan             │
│  - email            │       │  - status           │
│  - name             │       └─────────────────────┘
│  - role             │
│  - password_hash    │
└──────────┬──────────┘
           │
           │ Relacionamento 1:1 (opcional)
           │
           ▼
┌─────────────────────┐
│  players            │
│  - id (PK)          │
│  - tenant_id (FK)   │
│  - user_id (FK)     │
│  - name             │
│  - total_sessions   │
│  - total_profit     │
│  - ...stats         │
└─────────────────────┘
```

## Fluxos de Criação

### Fluxo 1: Registro de Novo Usuário (Admin)

**Endpoint:** `POST /api/auth/register`

1. Usuário preenche formulário de registro (nome, email, senha, nome do clube, plano)
2. Sistema cria **tenant** (clube/organização) no banco de dados
3. Sistema cria usuário no **Supabase Auth** com email/senha
4. Sistema cria **player** (perfil de jogador) no banco de dados
5. Sistema cria **user** no banco de dados vinculando:
   - `tenant_id` → ID do tenant criado
   - `player_id` → ID do player criado
   - `email` → mesmo email do Supabase Auth
   - `role` → 'admin' (primeiro usuário do tenant é admin)

**Resultado:**
- 1 tenant novo (clube/organização)
- 1 usuário autenticado no Supabase Auth
- 1 user no banco de dados
- 1 player no banco de dados
- Relacionamentos: Auth UID ↔ User ↔ Tenant + Player

### Fluxo 2: Login via OAuth (Google/Microsoft)

**Endpoint:** `GET /api/auth/callback`

#### Cenário A: Usuário OAuth com convite pendente

1. Usuário faz login via Google/Microsoft
2. Supabase Auth cria/autentica o usuário
3. Sistema verifica se existe `user` com este email no banco
4. **Não encontrado** → Busca convite pendente na tabela `user_invites`
5. Se encontrar convite:
   - Cria **user** com `tenant_id` e `role` do convite
   - Vincula ao `player_id` do convite (se existir)
   - Marca convite como aceito
6. Usuário é redirecionado para `/dashboard`

#### Cenário B: Usuário OAuth já existente

1. Usuário faz login via Google/Microsoft
2. Sistema encontra `user` existente com este email
3. Atualiza `last_login`
4. Redireciona para `/dashboard`

### Fluxo 3: Convite para Jogador Existente

**Endpoint:** `POST /api/invites`

1. Admin cria convite via painel
2. Convite é enviado por email com token único
3. Jogador clica no link e é redirecionado para aceitar convite
4. Jogador pode:
   - **Fazer login** com conta existente (OAuth ou email/senha)
   - **Criar conta nova** se não tiver

**Ao aceitar convite:**
- Se `user` já existe: vincula `player_id` do convite ao `user` existente
- Se `user` não existe: cria novo `user` vinculado ao `player_id` e `tenant_id` do convite

## Consulta do Relacionamento

### Backend (API Routes)

```typescript
// Obter dados completos do usuário autenticado
const { data: { user: supabaseUser } } = await supabase.auth.getUser(token);

const { data: userData } = await supabaseServer
  .from('users')
  .select(`
    id,
    name,
    email,
    role,
    tenant_id,
    player_id,
    tenants (
      id,
      name,
      plan,
      status
    ),
    players (
      id,
      name,
      nickname,
      total_sessions,
      total_profit,
      win_rate
    )
  `)
  .eq('email', supabaseUser.email)
  .single();
```

### Frontend (Auth Context)

```typescript
// Após login bem-sucedido
const { data: { user: supabaseUser } } = await supabase.auth.getUser();

// Buscar dados do usuário via API
const response = await fetch('/api/auth/user', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

const { user } = await response.json();
// user contém: id, name, email, role, tenant_id, player_id, etc.
```

## Isolamento Multi-Tenant

### Row Level Security (RLS)

Todas as tabelas principais têm políticas RLS que garantem isolamento por `tenant_id`:

```sql
-- Exemplo: Política RLS para players
CREATE POLICY "tenant_isolation_players_select" ON players
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );
```

**Como funciona:**
1. Após login, o JWT do Supabase contém `app_metadata.tenant_id`
2. Queries ao banco verificam automaticamente se `tenant_id` do registro = `tenant_id` do JWT
3. Usuários só veem dados do próprio tenant (clube)
4. `super_admin` pode ver dados de todos os tenants

### Middleware de Autenticação

```typescript
// middleware.ts
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  return NextResponse.redirect(new URL('/login', req.url));
}
```

O middleware:
- Verifica se há sessão válida do Supabase Auth
- Permite acesso a rotas públicas (/, /login, /register)
- Redireciona usuários não autenticados para `/login`

## Sincronização de Dados

### Cenários Importantes

#### 1. Usuário muda de email no Supabase Auth
- **Problema:** Email no `auth.users` ≠ email na tabela `users`
- **Solução:** Webhook ou job que sincroniza emails

#### 2. Usuário é deletado do Supabase Auth
- **Comportamento:** Registro na tabela `users` permanece
- **Solução:** Marcar como inativo ou deletar via CASCADE

#### 3. Múltiplos logins OAuth com mesmo email
- **Comportamento:** Supabase Auth permite vincular múltiplos providers
- **No nosso sistema:** Um único `user` no banco com múltiplos métodos de login

## Casos de Uso

### 1. Jogador sem conta acessa convite
```
1. Admin envia convite para jogador@example.com
2. Jogador clica no link do convite
3. Jogador cria conta via OAuth (Google)
4. Sistema vincula conta Google → user → player existente
5. Jogador pode fazer login e ver suas estatísticas
```

### 2. Usuário existente é convidado para outro clube
```
1. Usuário já tem conta no tenant A
2. Admin do tenant B envia convite
3. Usuário aceita convite
4. Sistema cria NOVO user vinculado ao tenant B
5. Mesmo email, dois registros de user (um por tenant)
```

### 3. Admin cria sessão e adiciona jogadores
```
1. Admin autenticado (tem tenant_id no JWT)
2. Admin cria sessão (automaticamente vinculada ao seu tenant_id)
3. Admin adiciona jogadores:
   - Jogadores com user: vinculados via player_id
   - Jogadores sem user: apenas dados na sessão (JSONB)
```

## Troubleshooting

### Problema: Usuário não consegue ver dados após login

**Diagnóstico:**
1. Verificar se `users.email` = email do Supabase Auth
2. Verificar se `users.tenant_id` está preenchido
3. Verificar se RLS policies estão ativas
4. Verificar se JWT contém `app_metadata.tenant_id`

**Solução:**
```sql
-- Verificar dados do usuário
SELECT * FROM users WHERE email = 'usuario@example.com';

-- Verificar se tenant existe
SELECT * FROM tenants WHERE id = <tenant_id>;

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'players';
```

### Problema: Usuário OAuth não consegue fazer login

**Diagnóstico:**
1. Verificar se provider OAuth está configurado no Supabase
2. Verificar se callback URL está na allowlist
3. Verificar logs do Supabase Auth
4. Verificar se convite existe para o email

**Solução:**
- Adicionar callback URL no Supabase Dashboard
- Criar convite manual se necessário
- Verificar configuração OAuth no Google/Microsoft Console

## Referências

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenant Architecture](https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy)
- Código relevante:
  - `/app/api/auth/register/route.ts` - Registro de usuários
  - `/app/api/auth/callback/route.ts` - OAuth callback
  - `/app/api/auth/user/route.ts` - Buscar dados do usuário
  - `/contexts/auth-context.tsx` - Context de autenticação
  - `/middleware.ts` - Middleware de proteção de rotas
