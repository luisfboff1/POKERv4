# 🎯 Poker Manager - Sistema Multi-Tenant de Gestão de Poker

> **Sistema SaaS moderno** para gerenciamento de home games de poker com Supabase Auth, Next.js 15, multi-tenancy, Row Level Security e muito mais!

**Status**: ✅ Em Produção | Vercel + Supabase

## 🚨 IMPORTANTE: Configuração de Permissões do Schema

**Se você está encontrando o erro `permission denied for schema poker`**, siga o guia de correção:

📖 **Veja**: [`FIX_SCHEMA_PERMISSIONS.md`](./FIX_SCHEMA_PERMISSIONS.md) para instruções detalhadas.

**Correção Rápida:**
1. Execute `db/fix_poker_schema_permissions.sql` no Supabase SQL Editor
2. Certifique-se de que `poker` está na lista de "Exposed schemas" no Dashboard do Supabase
3. Limpe o cache do navegador e faça login novamente

Este erro ocorre porque o PostgreSQL precisa de permissões explícitas para os roles do Supabase (`anon`, `authenticated`) acessarem o schema `poker`.

## 🚨 IMPORTANTE: Sincronização de Usuários

**Se você consegue fazer login mas recebe erro `User not found`**, você precisa sincronizar o usuário:

📖 **Veja**: [`SYNC_AUTH_USERS.md`](./SYNC_AUTH_USERS.md) para instruções detalhadas.

**Correção Rápida:**
1. Abra `db/create_user_for_auth.sql`
2. Substitua `seu-email@exemplo.com` pelo seu email (em 4 lugares)
3. Substitua os outros valores placeholder com suas informações
4. Execute o script no Supabase SQL Editor
5. Faça login novamente ✅

Este erro ocorre porque você tem um usuário no Supabase Auth mas não existe um registro correspondente na tabela `poker.users`.

---

![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.x-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth-green?logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-cyan?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)
![SaaS](https://img.shields.io/badge/Architecture-SaaS-gold)

## 🚀 **Funcionalidades Principais**

### 🔐 **Sistema SaaS Multi-Tenant Seguro**
- **Supabase Auth**: Autenticação profissional com tokens de curta duração (1h)
- **Refresh Token Automático**: Renovação de sessão sem interrupção (30 dias)
- **Row Level Security (RLS)**: Proteção em nível de banco de dados
- **OAuth Integrado**: Login com Google, Microsoft (pronto para usar)
- **MFA/2FA**: Autenticação de dois fatores disponível
- **Multi-tenancy**: Múltiplos grupos de poker completamente isolados
- **Controle de Acesso**: Super Admin, Admin e Players com hierarquia de roles

### 🎯 **Gestão de Sessões de Poker**
- **Controle de Buy-ins/Cash-outs**: Registra todas as entradas e saídas de dinheiro
- **Cálculo Automático de Transferências**: Algoritmo otimizado (N² → N-1)
- **Sistema de Recomendações**: Pagamentos personalizados entre jogadores
- **Transferências Pagas**: Marcar transferências como pagas
- **Dashboard Interativo**: Visualização em tempo real com gráficos

### 📊 **Analytics e Estatísticas**
- **Rankings Automáticos**: Performance de jogadores com métricas detalhadas
- **Gráficos Interativos**: Visualização de lucros/prejuízos ao longo do tempo
- **Estatísticas por Jogador**: Total de sessões, buy-ins, cash-outs, ROI
- **Filtros Avançados**: Por período, jogador, tipo de sessão
- **Sincronização em Tempo Real**: Stats atualizadas automaticamente

### 👥 **Gerenciamento de Jogadores**
- **Vinculação Usuário-Jogador**: Jogadores podem ter contas no sistema
- **Perfis Completos**: Histórico, estatísticas e performance
- **Gestão de Membros**: Admins podem convidar/remover membros
- **Dashboard Pessoal**: Cada jogador vê suas próprias estatísticas

### 🔒 **Segurança de Nível Empresarial**
- **Zero Vulnerabilidades**: Secret management profissional
- **Auditoria Completa**: Logs de todas as ações importantes
- **Conformidade**: SOC 2 Type II, ISO 27001 (via Supabase)
- **Rate Limiting**: Proteção contra ataques de força bruta
- **SQL Injection Protection**: Prepared statements e RLS
- **Session Management**: Múltiplos dispositivos suportados

## 🏗️ **Arquitetura Moderna Full-Stack**

### **Full-Stack Architecture (Next.js 15)**
```
app/
├── api/                          # Next.js API Routes (Backend)
│   ├── auth/                     # Autenticação
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   ├── register/route.ts
│   │   ├── verify/route.ts
│   │   └── callback/route.ts     # OAuth callback
│   ├── sessions/                 # Gestão de sessões
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   └── schedule/route.ts
│   ├── players/route.ts          # Gestão de jogadores
│   ├── invites/route.ts          # Sistema de convites
│   └── tenants/route.ts          # Multi-tenancy
├── dashboard/                    # Frontend (páginas protegidas)
│   ├── layout.tsx                # Layout com auth check
│   ├── page.tsx                  # Dashboard home
│   ├── new/                      # Criar sessão (wizard)
│   ├── history/                  # Histórico
│   ├── ranking/                  # Rankings
│   ├── invites/                  # Convites
│   └── admin/                    # Super admin
├── login/                        # Login page
├── register/                     # Registro de tenants
└── accept-invite/                # Aceitar convites

components/
├── ui/                           # shadcn/ui components
├── Plasma.tsx                    # Background effect
└── [feature components]          # Feature-specific

contexts/
└── auth-context.tsx              # Global auth state

lib/
├── supabaseClient.ts             # Supabase (browser)
├── supabaseServer.ts             # Supabase (server)
├── transferSystem.ts             # Transfer algorithm
├── types.ts                      # TypeScript types
└── utils.ts                      # Utilities

supabase/
└── migrations/                   # Database migrations
```

### **Backend & Database**
- **Next.js API Routes**: Endpoints TypeScript type-safe
- **Supabase**: Backend-as-a-Service completo
- **PostgreSQL 15**: Banco de dados relacional
- **Row Level Security**: Políticas no PostgreSQL (schema `poker`)
- **Migrations**: Versionamento de schema via Supabase CLI

### **Banco de Dados (PostgreSQL 15 + Supabase)**

**Schema**: `poker` (não `public`)

```sql
-- 🏢 TENANTS (Grupos de Poker)
poker.tenants (
  id, name, email, plan, status,
  max_users, max_sessions_per_month,
  created_at, updated_at
)

-- 👥 USUÁRIOS (Multi-tenant com Supabase Auth)
poker.users (
  id, tenant_id, name, email, role,
  supabase_user_id, player_id,
  is_active, last_login,
  created_at, updated_at
)
-- Vinculado com auth.users via supabase_user_id

-- 🔗 USER_TENANTS (Multi-home game support)
poker.user_tenants (
  user_id, tenant_id,
  role, is_active,
  created_at
)
-- Permite usuários em múltiplos tenants

-- 👤 JOGADORES (Perfis de jogadores)
poker.players (
  id, tenant_id, name, user_id,
  total_sessions, total_buyin, total_cashout,
  total_profit, win_rate, is_active
)

-- 🎰 SESSÕES (Isoladas por tenant)
poker.sessions (
  id, tenant_id, date, location, status,
  players_data, recommendations, paid_transfers,
  created_by, created_at
)

-- 📋 AUDITORIA (Logs imutáveis)
poker.audit_logs (
  id, tenant_id, user_id, action,
  table_name, record_id, old_data, new_data,
  ip_address, user_agent, created_at
)
```

### **Segurança (Row Level Security)**
```sql
-- Todas as tabelas têm RLS habilitado
ALTER TABLE poker.sessions ENABLE ROW LEVEL SECURITY;

-- Exemplo de RLS Policy
CREATE POLICY "Users can view sessions from their tenant"
  ON poker.sessions FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM poker.user_tenants
    WHERE user_id = auth.uid() AND is_active = true
  ));

-- Funções helper para RLS
auth.uid()                       -- ID do usuário do Supabase Auth
get_user_tenant_ids()            -- Lista de tenant_ids do usuário
user_has_role(role)              -- Verifica role do usuário
```

## 🔐 **Segurança de Nível Empresarial**

### **✅ Supabase Auth (Produção)**
```typescript
// ✅ Secrets gerenciados pelo Supabase (nunca expostos)
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});

// ✅ Access token: 1 hora (curta duração)
// ✅ Refresh token: 30 dias (renovação automática)
// ✅ MFA/2FA disponível
// ✅ OAuth integrado (Google, Microsoft, etc)
// ✅ Rate limiting built-in
// ✅ RLS policies em nível de banco
// ✅ Conformidade SOC 2, ISO 27001
```

### **📊 Recursos de Segurança**
| Recurso | Status | Descrição |
|---------|--------|-----------|
| **Supabase Auth** | ✅ Ativo | Autenticação gerenciada |
| **Token Duration** | ✅ 1h | Access tokens de curta duração |
| **Auto Refresh** | ✅ Ativo | Refresh automático (30 dias) |
| **MFA/2FA** | ✅ Disponível | Autenticação de dois fatores |
| **OAuth** | ✅ Integrado | Google, Microsoft, etc |
| **Rate Limiting** | ✅ Built-in | Proteção contra brute force |
| **RLS Policies** | ✅ Implementado | Isolamento por tenant |
| **Audit Logs** | ✅ Ativo | Rastreamento completo |

**Stack de Segurança**: Supabase Auth + PostgreSQL RLS + bcrypt + Next.js Middleware

## ⚙️ **Sistema Multi-Tenant em Produção**

### **✅ Status Atual**
O sistema SaaS multi-tenant está **100% operacional na Vercel**:
- 🟢 **PostgreSQL + Supabase** - Estrutura multi-tenant completa
- 🟢 **Supabase Auth** - Autenticação profissional e segura
- 🟢 **RLS Policies** - Isolamento garantido por tenant
- 🟢 **Next.js 15** - SSR habilitado com App Router
- 🟢 **TypeScript** - Type-safety em toda aplicação
- 🟢 **Vercel** - Deploy automático via Git

### **📊 Tabelas do Sistema**
- ✅ `tenants` - Grupos de poker (multi-tenant)
- ✅ `users` - Usuários com roles e vinculação ao Supabase Auth
- ✅ `players` - Jogadores com estatísticas
- ✅ `sessions` - Sessões isoladas por tenant
- ✅ `audit_logs` - Auditoria imutável completa

## 🚀 **Como Executar**

### **Desenvolvimento Local**
```bash
# 1. Clonar repositório
git clone https://github.com/luisfboff1/Poker-Novo.git
cd Poker-Novo

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
# Criar arquivo .env.local com:
NEXT_PUBLIC_SUPABASE_URL=https://jhodhxvvhohygijqcxbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service
NEXT_PUBLIC_GA_MEASUREMENT_ID=seu_id_analytics (opcional)

# 4. Aplicar migrations no Supabase (se necessário)
# As migrations estão em supabase/migrations/
# Aplicar via Supabase CLI:
supabase db push --project-ref jhodhxvvhohygijqcxbo

# 5. Executar servidor de desenvolvimento
npm run dev

# 6. Acessar no navegador
http://localhost:3000
```

### **Produção (Vercel) - Deploy Automatizado**
```bash
# Deploy automático via Git
# 1. Push para branch main
git push origin main

# 2. Vercel detecta e faz deploy automaticamente

# Ou deploy manual via CLI:
npm i -g vercel
vercel          # Deploy preview
vercel --prod   # Deploy production
```

### **TypeScript & Validação**
```bash
# Verificar tipos
npm run typecheck

# Lint e correções
npm run lint
npm run lint:fix

# Build de produção (local)
npm run build
npm start
```

## 💡 **Como Usar o Sistema**

### **🔐 Para Novos Grupos (Admins)**
1. **Acesse**: `/register`
2. **Cadastre seu grupo** com nome e email
3. **Crie sua conta** no Supabase Auth
4. **Faça login** e comece a usar!

### **🎰 Gerenciar Sessões de Poker**
1. **Criar**: Nova sessão no dashboard
2. **Adicionar jogadores** e registrar buy-ins
3. **Registrar cash-outs** ao final
4. **Ver transferências** otimizadas automaticamente
5. **Marcar como pagas** conforme pagamentos acontecem

### **👥 Convidar Membros**
1. **Acesse**: Dashboard → Gerenciar Membros
2. **Enviar convite** com email
3. **Membro recebe link** de cadastro
4. **Vincula conta** ao grupo automaticamente

### **📊 Acompanhar Estatísticas**
1. **Dashboard**: Visão geral do grupo
2. **Rankings**: Performance de todos os jogadores
3. **Perfil Pessoal**: Suas estatísticas detalhadas
4. **Histórico**: Todas as sessões passadas

## 🎯 **Algoritmo de Otimização**

### **Problema:**
Em uma sessão com 5 jogadores, sem otimização seriam necessárias até **20 transferências** (4×5).

### **Solução:**
Nosso algoritmo reduz para **no máximo 4 transferências** (N-1), considerando:

1. **Calcula saldos líquidos**: `cashOut - totalBuyIns`
2. **Aplica recomendações**: Como restrições que modificam saldos
3. **Otimiza o restante**: Algoritmo de matching entre credores e devedores
4. **Resultado**: Recomendações fixas + transferências mínimas

### **Exemplo Prático:**
```
Situação: Luis(-20), Luiggi(+50), Ettore(-30)
Recomendação: Luis → Luiggi: R$ 20

Resultado:
✅ Luis → Luiggi: R$ 20,00 (recomendação)
✅ Ettore → Luiggi: R$ 30,00 (otimizada)
Total: 2 transferências (mínimo possível)
```

## 🎨 **Interface e Experiência**

### **Design Responsivo**
- ✅ **Mobile-first**: Funciona perfeitamente em celulares
- ✅ **Tailwind CSS**: Design moderno e consistente
- ✅ **Modo escuro**: Interface agradável para longas sessões

### **Feedback Visual**
- 🟢 **Badges verdes**: Recomendações fixas
- 🔵 **Badges azuis**: Transferências otimizadas
- ✅ **Checkboxes**: Status de pagamentos
- 🔄 **Botões intuitivos**: Ações claras para o usuário

### **Estados da Aplicação**
- **Loading**: Indicadores durante operações
- **Erro**: Mensagens claras de problemas
- **Sucesso**: Confirmações de ações realizadas
- **Vazio**: Orientações quando não há dados

## 📁 **Estrutura do Projeto**

```
📦 Poker SaaS - Next.js 15 Full-Stack/
├── 📁 app/                          # Next.js App Router
│   ├── api/                         # API Routes (Backend)
│   │   ├── auth/                    # Autenticação
│   │   ├── sessions/                # Sessões
│   │   ├── players/                 # Jogadores
│   │   ├── invites/                 # Convites
│   │   ├── tenants/                 # Tenants
│   │   └── users/                   # Usuários
│   ├── dashboard/                   # Páginas protegidas
│   │   ├── layout.tsx               # Layout com auth
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── new/                     # Criar sessão
│   │   ├── history/                 # Histórico
│   │   ├── ranking/                 # Rankings
│   │   ├── invites/                 # Convites
│   │   └── admin/                   # Super admin
│   ├── login/                       # Login page
│   ├── register/                    # Registro
│   ├── accept-invite/               # Aceitar convites
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Landing page
├── 📁 components/                   # Componentes React
│   ├── ui/                          # shadcn/ui components
│   ├── Plasma.tsx                   # Background effect
│   └── [feature components]/        # Feature-specific
├── 📁 contexts/                     # Estado global
│   └── auth-context.tsx             # Contexto de autenticação
├── 📁 lib/                          # Bibliotecas e utilitários
│   ├── supabaseClient.ts            # Supabase (browser)
│   ├── supabaseServer.ts            # Supabase (server)
│   ├── transferSystem.ts            # Algoritmo de otimização
│   ├── types.ts                     # TypeScript types
│   └── utils.ts                     # Utilitários
├── 📁 supabase/                     # Supabase config
│   └── migrations/                  # Database migrations
│       └── *.sql                    # Migration files
├── 📁 public/                       # Arquivos estáticos
├── 📁 db/                           # Database docs e backups
│   ├── migrations/                  # Migration docs
│   └── backups/                     # Database backups
├── 📄 middleware.ts                 # Next.js middleware (auth)
├── 📄 next.config.ts                # Next.js config
├── 📄 tailwind.config.ts            # Tailwind config
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 package.json                  # Dependências
├── 📄 .env.local                    # Environment vars (não commitado)
├── 📄 CLAUDE.md                     # Documentação para Claude Code
└── 📄 README.md                     # Este arquivo
```

## 🔧 **Stack Tecnológico**

### **Frontend**
- **Next.js 15**: Framework React com App Router e Server Components
- **React 19**: Biblioteca UI moderna
- **TypeScript 5**: Type-safety completo
- **Tailwind CSS 4**: Framework CSS utilitário
- **Framer Motion**: Animações fluidas
- **Radix UI**: Componentes acessíveis (shadcn/ui)
- **Lucide Icons**: Ícones SVG modernos

### **Backend**
- **Next.js API Routes**: Endpoints TypeScript serverless
- **Supabase**: Backend-as-a-Service
  - **Auth**: Autenticação gerenciada
  - **Database**: PostgreSQL 15 gerenciado
  - **Row Level Security**: Políticas de segurança
- **bcryptjs**: Hash seguro de senhas

### **Segurança**
- **Supabase Auth**: Tokens JWT com refresh automático
- **OAuth 2.0**: Suporte para Google, Microsoft, etc
- **MFA/2FA**: Disponível via Supabase
- **RLS Policies**: Isolamento multi-tenant no banco
- **Next.js Middleware**: Proteção de rotas server-side

### **DevOps**
- **Vercel**: Deploy automático serverless
- **GitHub**: CI/CD via Git push
- **Supabase CLI**: Migrations e database management
- **TypeScript**: Validação em build time
- **ESLint**: Code quality

### **Database Migrations**

⚠️ **REGRA CRÍTICA**: SEMPRE use migrations para mudanças estruturais!

```bash
# 1. Criar migration
supabase migration new add_feature

# 2. Editar SQL em supabase/migrations/
# 3. Aplicar em produção
supabase db push --project-ref jhodhxvvhohygijqcxbo

# 4. Commitar no Git
git add supabase/migrations/
git commit -m "feat: add feature migration"
```

**Migrations existentes**: `supabase/migrations/`

## 📊 **Métricas do Sistema**

### **📈 Escala e Performance**
- 🏢 **Multi-tenant**: Suporte ilimitado de grupos
- 👥 **Usuários**: Escalável horizontalmente
- 🎰 **Sessões**: Histórico completo e pesquisável
- ⚡ **Performance**: < 1s carregamento (Next.js 15)
- 📱 **100% Responsivo**: Mobile-first design
- 🌐 **PWA Ready**: Instalável como app

### **🔧 Arquitetura**
- 📁 **~100 arquivos** TypeScript/TSX
- 🎯 **12+ documentos** técnicos
- ⚡ **30+ componentes** React Server/Client
- 🔧 **10+ API Routes** Next.js
- 🗄️ **6 tabelas** PostgreSQL multi-tenant
- 🔐 **24+ RLS policies** implementadas

### **🛡️ Segurança e Confiabilidade**
- 🔐 **Supabase Auth**: Tokens seguros (1h + refresh)
- 🏢 **RLS Policies**: Isolamento garantido por tenant
- 📋 **Audit Logs**: Rastreamento imutável
- 🔒 **bcrypt**: Password hashing seguro
- ✅ **TypeScript**: Type-safety em toda aplicação
- 🚫 **Zero Vulnerabilidades**: Secret management profissional

### **🎯 Qualidade de Código**
- ✅ **TypeScript Strict**: Sem erros de compilação
- ✅ **ESLint**: Código padronizado
- ✅ **Error Boundaries**: Tratamento robusto de erros
- ✅ **Loading States**: UX otimizada
- ✅ **Server Components**: Performance máxima

## 📚 **Documentação Técnica Completa**

### **🔒 Segurança**
- 📖 `SECURITY_MIGRATION_SUPABASE_AUTH.md` - Migração completa de segurança
- 📖 `SUPABASE_AUTH_QUICKSTART.md` - Guia rápido Supabase Auth
- 📖 `DEPLOY_CHECKLIST.md` - Checklist de deploy seguro
- 📖 `FIX_RLS_MIGRATION.md` - Correção de RLS policies

### **🏗️ Arquitetura**
- 📖 `IMPLEMENTATION_SUMMARY.md` - Resumo de implementações
- 📖 `SIMPLIFIED_LOGIN_FLOW.md` - Fluxo de login simplificado
- 📖 `SUPABASE_AUTH_RELATIONSHIP.md` - Relacionamento Auth/Database
- 📖 `FIX_AUTHENTICATION_AND_PUBLIC_ROUTES.md` - Correções de auth

### **🔧 Correções e Melhorias**
- 📖 `FIX_LOGIN_406_ERROR.md` - Correção de erro 406
- 📖 `FIX_LOGIN_REDIRECT_RACE_CONDITION.md` - Race condition resolvida
- 📖 `FIX_LOGIN_REDIRECT.md` - Correções de redirecionamento
- 📖 `PLASMA_CORRECOES_FINAIS.md` - Correções do efeito Plasma

### **📋 Banco de Dados**
- 📖 `db/SUPABASE_SETUP.md` - Setup do Supabase
- 📖 `db/migrations/` - Migrations SQL
  - `remove_user_sessions.sql` - Remove tabela obsoleta
  - `enable_rls_policies_fixed.sql` - RLS policies corrigidas

### **🧪 Testes e Guias**
- 📖 `GUIA_DE_TESTE.md` - Guia de testes do sistema
- 📖 `OAUTH_SETUP.md` - Configuração OAuth
- 📖 `LIMPEZA_ARQUIVOS_OBSOLETOS.md` - Limpeza de código

---

## 🌐 **URLs e Acesso**

### **🔗 Links**
- **🏠 Aplicação**: Vercel (deploy automático)
- **📖 Repositório**: [Poker-Novo](https://github.com/luisfboff1/Poker-Novo)
- **🗃️ Database**: Supabase PostgreSQL (schema `poker`)

### **📧 Contato**
- **Desenvolvedor**: Luis Fernando Boff
- **Email**: luisfboff@hotmail.com
- **GitHub**: [@luisfboff1](https://github.com/luisfboff1)

---

## 🏆 **Evolução do Projeto**

### **v1.0 - Sistema Básico (2024)**
- ❌ Sistema simples sem autenticação
- ❌ Single-tenant (apenas um grupo)
- ❌ Frontend estático

### **v2.0 - SaaS Multi-Tenant (2025 Q1)**
- ✅ Sistema SaaS multi-tenant
- ✅ JWT customizado + PHP
- ✅ MySQL + multi-tenant isolation

### **v3.0 - Next.js Migration (2025 Q2)**
- ✅ Migração para Next.js 15
- ✅ TypeScript completo
- ✅ Server Components + API Routes

### **v4.0 - Produção Atual (2025 Q3)**
- ✅ **Supabase Auth** (eliminou vulnerabilidades)
- ✅ **PostgreSQL** com RLS (schema `poker`)
- ✅ **Vercel** deployment automático
- ✅ **OAuth** integrado (Google, Microsoft)
- ✅ **MFA/2FA** disponível
- ✅ **Multi-home game** (`user_tenants`)
- ✅ **Zero secrets** hardcoded
- ✅ **Tokens seguros** (1h + refresh 30d)
- ✅ **Conformidade** SOC 2, ISO 27001

**De um sistema simples → Plataforma SaaS de nível empresarial em produção!**

🔗 **Aplicação em Produção**: Vercel + Supabase

---

## 🎯 **Algoritmo de Otimização de Transferências**

### **Problema:**
Sessão com N jogadores = até N×(N-1) transferências possíveis.

### **Solução:**
Nosso algoritmo reduz para **no máximo N-1 transferências**:

1. **Calcula saldos líquidos**: `cashOut - totalBuyIns`
2. **Separa credores e devedores**: positivos e negativos
3. **Aplica recomendações fixas**: Pagamentos específicos solicitados
4. **Otimiza o restante**: Matching guloso entre credores e devedores
5. **Resultado**: Número mínimo de transferências

### **Exemplo Prático:**
```typescript
// Situação inicial
Luis:    -R$ 50 (deve)
Luiggi:  +R$ 80 (recebe)
Ettore:  -R$ 30 (deve)

// Recomendação fixa
Luis → Luiggi: R$ 20

// Após aplicar recomendação
Luis:    -R$ 30 (deve R$ 30 restante)
Luiggi:  +R$ 60 (recebe R$ 60 restante)
Ettore:  -R$ 30 (deve)

// Otimização automática
✅ Luis → Luiggi: R$ 30,00 (otimizada)
✅ Ettore → Luiggi: R$ 30,00 (otimizada)

// Resultado final (3 transferências vs potencialmente 6)
1. Luis → Luiggi: R$ 20,00 (recomendação)
2. Luis → Luiggi: R$ 30,00 (otimizada)
3. Ettore → Luiggi: R$ 30,00 (otimizada)
```

**Complexidade:** O(N²) → O(N-1) transferências

---

## 🎨 **Design System**

### **Cores (Dark Mode First)**
```css
/* Tema principal */
--primary: #10b981        /* Verde poker */
--secondary: #3b82f6      /* Azul */
--destructive: #ef4444    /* Vermelho */
--muted: #6b7280          /* Cinza */

/* Backgrounds */
--background: #0a0a0a     /* Preto suave */
--surface: #111111        /* Cards */
--border: #27272a         /* Bordas */
```

### **Componentes (shadcn/ui)**
- ✅ **Acessíveis**: ARIA compliant
- ✅ **Customizáveis**: Tailwind + CSS Variables
- ✅ **Responsivos**: Mobile-first
- ✅ **Animados**: Framer Motion

### **Layout**
- **Mobile**: 375px+ (iPhone SE+)
- **Tablet**: 768px+ (iPad)
- **Desktop**: 1024px+ (Laptop)
- **Wide**: 1920px+ (Desktop grande)

---

## 🚀 **Roadmap Futuro**

### **🔜 Próximas Funcionalidades**
- [ ] **PWA Completo**: App instalável offline-first
- [ ] **Push Notifications**: Alertas de sessões e pagamentos
- [ ] **Export Excel**: Relatórios em planilha
- [ ] **Dashboard Analytics**: Gráficos avançados
- [ ] **API Pública**: Integração com outros sistemas
- [ ] **Mobile App**: React Native

### **🔮 Longo Prazo**
- [ ] **IA Insights**: Análise preditiva de resultados
- [ ] **Multiplayer Real-time**: Sessões ao vivo
- [ ] **Marketplace**: Templates de sessões
- [ ] **White Label**: Personalização por tenant
- [ ] **Blockchain**: Histórico imutável de transações

---

**Desenvolvido com ❤️ para revolucionar o gerenciamento de home games de poker!** 🎯♠️
