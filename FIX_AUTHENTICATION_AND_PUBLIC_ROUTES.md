# Correção dos Problemas de Autenticação e Rotas Públicas

## Resumo das Alterações

Este documento descreve as correções implementadas para resolver os problemas identificados no issue relacionado a:
1. Usuários presos na página de login
2. LP (Landing Page) e registro não acessíveis sem autenticação
3. Relacionamento entre UID do Supabase, tenant_id e homegame/player

## Problemas Resolvidos

### 1. Landing Page (/) Bloqueada por Autenticação

**Problema:**
A landing page principal (/) estava sendo bloqueada pelo middleware, exigindo autenticação mesmo sendo uma página pública destinada a mostrar preços e informações gerais.

**Solução:**
Atualizado `middleware.ts` para incluir `/` explicitamente na lista de rotas públicas:

```typescript
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/accept-invite'];
const isPublicRoute = publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)));
```

**Resultado:**
- Landing page agora é totalmente acessível sem autenticação
- Usuários não autenticados podem ver preços e recursos antes de se registrar
- Usuários autenticados são automaticamente redirecionados para `/dashboard`

### 2. Endpoint de Registro Inexistente

**Problema:**
O código do frontend estava tentando fazer POST para `/register.php`, que não existia no projeto Next.js. Isso quebrava completamente o fluxo de registro de novos usuários.

**Solução:**
Criado endpoint completo de registro em `/app/api/auth/register/route.ts` com as seguintes funcionalidades:

1. **Validação de Dados:**
   - Validação de campos obrigatórios (nome, email, senha, empresa)
   - Validação de formato de email
   - Validação de comprimento mínimo de senha (6 caracteres)
   - Verificação de email já registrado

2. **Criação de Tenant (Organização):**
   - Cria automaticamente um tenant para a nova organização/clube
   - Define plano (basic, premium, enterprise) conforme selecionado
   - Configura limites de usuários e sessões por plano
   - Status ativo imediato (sem necessidade de aprovação manual)

3. **Criação no Supabase Auth:**
   - Cria usuário no Supabase Authentication
   - Email confirmado automaticamente (pode ser alterado para exigir confirmação)
   - Armazena `tenant_id` no `user_metadata` para uso futuro

4. **Criação de Player:**
   - Cria registro de player (perfil de jogador) no banco
   - Vincula ao tenant
   - Inicializa estatísticas em zero

5. **Criação de User:**
   - Cria registro de user no banco de dados
   - Vincula ao tenant e ao player
   - Define role como 'admin' (primeiro usuário do tenant)
   - Armazena hash bcrypt da senha

6. **Rollback em Caso de Erro:**
   - Se qualquer etapa falhar, remove registros criados anteriormente
   - Garante consistência do banco de dados

7. **Audit Log:**
   - Registra ação de registro com dados relevantes
   - Inclui IP e User-Agent para auditoria

**Atualização do Cliente:**
```typescript
// lib/api.ts
register: (data: { name: string; email: string; password: string; company: string; phone: string; plan?: string }) =>
  fetchAPI('/auth/register', {  // Mudado de '/register.php' para '/auth/register'
    method: 'POST',
    body: JSON.stringify(data),
  }),
```

### 3. Documentação do Relacionamento Supabase Auth ↔ Tenant ↔ Player

**Problema:**
Não estava claro como o UID do Supabase Auth se relaciona com `tenant_id` e `player_id` no banco de dados.

**Solução:**
Criado documento completo `SUPABASE_AUTH_RELATIONSHIP.md` explicando:

1. **Arquitetura:**
   - Como Supabase Auth gerencia autenticação
   - Como tabela `tenants` representa organizações/clubes
   - Como tabela `users` conecta Auth com modelo de dados
   - Como tabela `players` armazena dados de poker

2. **Modelo de Relacionamento:**
   - Diagrama visual mostrando todas as conexões
   - Explicação de chaves estrangeiras
   - Relacionamento 1:1 entre user e player (opcional)
   - Relacionamento N:1 entre user e tenant

3. **Fluxos de Criação:**
   - Registro de novo usuário (admin de novo clube)
   - Login via OAuth (Google/Microsoft)
   - Aceitar convite para clube existente
   - Adicionar jogador sem conta

4. **Consultas e Exemplos:**
   - Como buscar dados completos do usuário
   - Como verificar tenant_id no JWT
   - Como implementar isolamento multi-tenant

5. **Isolamento Multi-Tenant:**
   - Explicação de Row Level Security (RLS)
   - Políticas implementadas
   - Como o middleware verifica autenticação

6. **Troubleshooting:**
   - Problemas comuns e soluções
   - Como diagnosticar issues de autenticação
   - Como verificar relacionamentos no banco

## Melhorias no Middleware

O middleware foi refinado para:

1. **Simplificação de Rotas Públicas:**
   - Lista clara de rotas públicas
   - Verificação explícita para rota raiz (`/`)
   - Todas as rotas de API gerenciam própria autenticação

2. **Melhor Tratamento de Erros:**
   - Logs de erros mantidos
   - Redirecionamento seguro em caso de falha

3. **Código Mais Limpo:**
   ```typescript
   // Antes
   if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/callback')) {
     return NextResponse.next();
   }
   
   // Depois
   if (pathname.startsWith('/api/')) {
     return NextResponse.next();
   }
   ```

## Arquivos Modificados

1. **`middleware.ts`**
   - Adicionada rota `/` como pública
   - Simplificado tratamento de rotas de API

2. **`lib/api.ts`**
   - Atualizado endpoint de registro de `/register.php` para `/auth/register`

3. **`app/api/auth/register/route.ts`** (NOVO)
   - Implementação completa do endpoint de registro
   - Validações, criação de tenant/user/player, rollback

4. **`SUPABASE_AUTH_RELATIONSHIP.md`** (NOVO)
   - Documentação completa do relacionamento Auth ↔ Tenant ↔ Player

## Status do Login Flow

O login flow já estava funcionando conforme documentado em:
- `FIX_LOGIN_REDIRECT.md` - Fix anterior do problema de redirect
- `SIMPLIFIED_LOGIN_FLOW.md` - Simplificação do fluxo de login

**Verificações realizadas:**

1. ✅ **Cookie Storage:** Middleware lê corretamente cookies do Supabase
2. ✅ **Retry Mechanism:** Auth context tem retry para garantir cookies estão setados
3. ✅ **Redirect Logic:** Sempre redireciona para `/dashboard` após login
4. ✅ **OAuth Callback:** Implementado corretamente em `/api/auth/callback`
5. ✅ **Auth State Listener:** Context atualiza state quando auth muda

## Como Testar

### 1. Testar Landing Page Pública

```bash
# Abrir navegador em modo anônimo
# Navegar para: https://seu-dominio.com/
# Resultado esperado: Ver landing page com preços e informações
# Não deve exigir login
```

### 2. Testar Registro de Novo Usuário

```bash
# Na landing page, clicar em "Começar agora" ou "Cadastre-se"
# Preencher formulário:
# - Nome: João Silva
# - Email: joao@example.com
# - Senha: senha123
# - Nome do clube: Clube de Poker ABC
# - Telefone: (11) 98765-4321
# - Plano: Free (ou Pro/Premium)

# Resultado esperado:
# 1. Criar tenant no banco
# 2. Criar user no Supabase Auth
# 3. Criar player no banco
# 4. Criar user no banco
# 5. Redirecionar para /login com mensagem de sucesso
```

### 3. Testar Login Após Registro

```bash
# Na página de login, inserir:
# - Email: joao@example.com
# - Senha: senha123

# Resultado esperado:
# 1. Autenticar no Supabase
# 2. Cookies setados
# 3. Redirecionar para /dashboard
# 4. Ver dados do usuário (nome, clube, etc.)
```

### 4. Testar Rotas Protegidas

```bash
# Sem estar logado, tentar acessar:
# - https://seu-dominio.com/dashboard
# - https://seu-dominio.com/dashboard/ranking
# - https://seu-dominio.com/dashboard/admin

# Resultado esperado:
# Middleware redireciona para /login
```

### 5. Testar OAuth Login (Google/Microsoft)

```bash
# Na página de login, clicar em "Google" ou "Microsoft"
# Fazer login com conta Google/Microsoft
# Se email não tem convite: mostrar erro
# Se email tem convite: criar user e redirecionar para /dashboard
```

## Verificações de Segurança

1. ✅ **Validação de Input:** Email, senha, campos obrigatórios
2. ✅ **Prevenção de SQL Injection:** Usando Supabase client (parametrizado)
3. ✅ **Hash de Senha:** bcrypt com 10 rounds
4. ✅ **Rollback Transactions:** Garante consistência em caso de erro
5. ✅ **Audit Logging:** Registra todas as ações de registro
6. ✅ **Row Level Security:** Isolamento multi-tenant via RLS
7. ✅ **Middleware Protection:** Rotas protegidas exigem autenticação

## Próximos Passos Recomendados

1. **Confirmação de Email (Opcional):**
   - Remover `email_confirm: true` em `app/api/auth/register/route.ts`
   - Configurar templates de email no Supabase Dashboard
   - Adicionar página de confirmação de email

2. **Rate Limiting:**
   - Adicionar rate limiting no endpoint de registro
   - Prevenir abuso e criação em massa de contas

3. **Captcha (Opcional):**
   - Adicionar reCAPTCHA ou hCaptcha no formulário de registro
   - Prevenir bots

4. **Testes Automatizados:**
   - Criar testes E2E com Playwright/Cypress
   - Testar fluxos completos de registro e login

5. **Monitoramento:**
   - Adicionar logging mais detalhado
   - Integrar com ferramenta de monitoramento (Sentry, etc.)

## Referências

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Documentos do projeto:
  - `SUPABASE_AUTH_RELATIONSHIP.md` - Relacionamento Auth ↔ Tenant ↔ Player
  - `FIX_LOGIN_REDIRECT.md` - Fix do problema de redirect no login
  - `SIMPLIFIED_LOGIN_FLOW.md` - Simplificação do fluxo de login
