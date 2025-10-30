# 🎯 Poker Manager - Sistema Multi-Tenant de Gestão de Poker

> **Sistema SaaS moderno** para gerenciamento de home games de poker com Supabase Auth, Next.js 15, multi-tenancy, analytics em tempo real e muito mais!

## 🚨 IMPORTANTE: Configuração de Permissões do Schema

**Se você está encontrando o erro `permission denied for schema poker`**, siga o guia de correção:

📖 **Veja**: [`FIX_SCHEMA_PERMISSIONS.md`](./FIX_SCHEMA_PERMISSIONS.md) para instruções detalhadas.

**Correção Rápida:**
1. Execute `db/fix_poker_schema_permissions.sql` no Supabase SQL Editor
2. Certifique-se de que `poker` está na lista de "Exposed schemas" no Dashboard do Supabase
3. Limpe o cache do navegador e faça login novamente

Este erro ocorre porque o PostgreSQL precisa de permissões explícitas para os roles do Supabase (`anon`, `authenticated`) acessarem o schema `poker`.

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

### **Frontend (Next.js 15 + React 19)**
```
app/
├── layout.tsx                     # Layout raiz com providers
├── page.tsx                       # Landing page
├── globals.css                    # Estilos globais + Tailwind
├── login/                         # Página de login com OAuth
├── register/                      # Registro de novos tenants
├── dashboard/                     # Dashboard principal autenticado
├── forgot-password/              # Recuperação de senha
├── accept-invite/                # Aceitar convites
└── api/                          # API Routes (Server-side)
    ├── auth/
    │   ├── login/route.ts        # Login com Supabase Auth
    │   ├── logout/route.ts       # Logout e invalidação
    │   └── verify/route.ts       # Verificação de token
    ├── sessions/route.ts         # CRUD de sessões (multi-tenant)
    ├── players/route.ts          # Gerenciamento de jogadores
    └── invites/route.ts          # Sistema de convites

components/
├── ui/                           # Componentes base (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── PlayerDashboard.tsx           # Dashboard do jogador
├── PlayerStatsSyncManager.tsx    # Sincronização de stats
├── TransferManager.tsx           # Gestão de transferências
├── Plasma.tsx                    # Efeito visual de fundo
└── theme-toggle.tsx              # Toggle dark/light mode

contexts/
└── auth-context.tsx              # Estado global de autenticação

lib/
├── supabaseClient.ts             # Cliente Supabase (frontend)
├── supabaseServer.ts             # Cliente Supabase (backend)
├── supabase-auth.ts              # Helpers de autenticação
├── analytics.ts                  # Google Analytics integration
└── types.ts                      # TypeScript types

stores/
└── authStore.ts                  # Zustand store para auth
```

### **Backend (Next.js API Routes + Supabase)**
- **Server-Side Rendering**: Páginas renderizadas no servidor
- **API Routes**: Endpoints TypeScript type-safe
- **Supabase Integration**: Auth + Database unificado
- **Row Level Security**: Políticas no PostgreSQL
- **Service Role**: Acesso administrativo ao banco

### **Banco de Dados (PostgreSQL + Supabase)**
```sql
-- 🏢 TENANTS (Grupos de Poker)
tenants (
  id, name, email, plan, status,
  max_users, max_sessions_per_month,
  created_at, updated_at
)

-- 👥 USUÁRIOS (Multi-tenant com Supabase Auth)
users (
  id, tenant_id, name, email, role,
  is_active, last_login, player_id,
  created_at, updated_at
)
-- Vinculado com auth.users do Supabase

-- 👤 JOGADORES (Perfis de jogadores)
players (
  id, tenant_id, name, user_id,
  total_sessions, total_buyin, total_cashout,
  total_profit, is_active
)

-- 🎰 SESSÕES (Isoladas por tenant)
sessions (
  id, tenant_id, date, location, status,
  players_data, recommendations, paid_transfers,
  created_by, created_at
)

-- � AUDITORIA (Logs imutáveis)
audit_logs (
  id, tenant_id, user_id, action,
  table_name, record_id, old_data, new_data,
  ip_address, user_agent, created_at
)
```

### **Segurança (Row Level Security)**
```sql
-- Exemplo de RLS Policy
CREATE POLICY "Users can view sessions from their tenant"
  ON public.sessions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Funções helper para RLS
get_user_tenant_id()     -- Extrai tenant do JWT
user_has_role(role)      -- Verifica hierarquia de roles
```

## 🔐 **Migração de Segurança Completa**

### **� Antes (Sistema Legado - VULNERÁVEL)**
```typescript
// ⚠️ CRÍTICO: Secret hardcoded no código
const JWT_SECRET = process.env.JWT_SECRET || 
  'poker_jwt_secret_2025_super_secure_key...'; // PÚBLICO NO GITHUB!

// ❌ Token de 24 horas (janela de ataque grande)
// ❌ Gestão manual de sessões
// ❌ Sem MFA, OAuth, rate limiting
```

### **✅ Agora (Supabase Auth - SEGURO)**
```typescript
// ✅ Secrets gerenciados pelo Supabase (nunca expostos)
const { data } = await supabase.auth.signInWithPassword({
  email, password
});

// ✅ Access token: 1 hora (vs 24h)
// ✅ Refresh token: 30 dias (renovação automática)
// ✅ MFA, OAuth, rate limiting built-in
// ✅ RLS policies em nível de banco
// ✅ Conformidade SOC 2, ISO 27001
```

### **📊 Comparação de Segurança**
| Aspecto | Antes (JWT Custom) | Agora (Supabase) |
|---------|-------------------|------------------|
| **Secret Management** | ⚠️ Hardcoded | ✅ Gerenciado |
| **Token Duration** | ❌ 24h | ✅ 1h + refresh |
| **Revocation** | ⚠️ Manual | ✅ Automática |
| **MFA/2FA** | ❌ | ✅ Built-in |
| **OAuth** | ❌ | ✅ Built-in |
| **Rate Limiting** | ❌ | ✅ Built-in |
| **RLS** | ❌ | ✅ Implementado |
| **Manutenção** | ❌ Manual | ✅ Automática |

**Resultado:** Vulnerabilidade crítica eliminada, código ~200 linhas mais limpo.

Ver: `SECURITY_MIGRATION_SUPABASE_AUTH.md`

## ⚙️ **Sistema Multi-Tenant**

### **✅ Status Atual**
O sistema SaaS multi-tenant está **100% configurado e funcionando**:
- 🟢 **PostgreSQL + Supabase** - Estrutura multi-tenant completa
- 🟢 **Supabase Auth** - Autenticação profissional e segura
- 🟢 **RLS Policies** - Isolamento garantido por tenant
- 🟢 **Next.js 15** - Framework moderno e otimizado
- 🟢 **TypeScript** - Type-safety em toda aplicação

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
git clone https://github.com/luisfboff1/POKERv4.git
cd POKERv4

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
# Criar arquivo .env.local com:
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service
NEXT_PUBLIC_GA_MEASUREMENT_ID=seu_id_analytics (opcional)

# 4. Aplicar migrations no Supabase
# Executar no SQL Editor:
# - db/migrations/remove_user_sessions.sql
# - db/migrations/enable_rls_policies_fixed.sql

# 5. Executar servidor de desenvolvimento
pnpm dev

# 6. Acessar no navegador
http://localhost:3000
```

### **Produção (Vercel) - Deploy Automatizado**
```bash
# 1. Conectar repositório no Vercel
# 2. Configurar variáveis de ambiente
# 3. Deploy automático a cada push na main

# Ou deploy manual:
pnpm build
pnpm start
```

### **TypeScript & Validação**
```bash
# Verificar tipos
pnpm typecheck

# Lint
pnpm lint

# Build de produção
pnpm build
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

## 📁 **Estrutura Completa do Projeto SaaS**

```
📦 Poker SaaS - Sistema Multi-Tenant/
├── 📁 src/                          # Frontend React
│   ├── App.jsx                      # Router principal com rotas protegidas
│   ├── main.jsx                     # Ponto de entrada da aplicação
│   ├── index.css                    # Estilos globais + Tailwind
│   ├── contexts/                    # Estado global
│   │   ├── AuthContext.jsx          # Contexto de autenticação
│   │   └── AgentContext.jsx         # Contexto do PokerBot Agente
│   ├── components/                  # Componentes React
│   │   ├── Layout/                  # Layout principal autenticado
│   │   ├── ProtectedRoute/          # Controle de acesso por roles
│   │   ├── PokerBot/                # Interface do agente IA
│   │   ├── SessionManager/          # Gerenciamento de sessões
│   │   └── ErrorBoundary/           # Tratamento de erros React
│   ├── pages/                       # Páginas da aplicação
│   │   ├── Login/                   # Página de login
│   │   ├── Register/                # Registro de novos tenants
│   │   ├── Home/                    # Dashboard principal
│   │   ├── NewSession/              # Criar nova sessão
│   │   ├── History/                 # Histórico de sessões
│   │   ├── Ranking/                 # Rankings e estatísticas
│   │   ├── Invites/                 # Gerenciar convites
│   │   ├── SuperAdmin/              # Dashboard super admin
│   │   └── AcceptInvite/            # Aceitar convites via email
│   └── services/                    # Cliente HTTP para APIs
│       └── api.js                   # Cliente HTTP para todas as APIs
├── 📁 api/                          # Backend PHP Multi-Tenant
│   ├── config.php                   # Configuração do banco + CORS
│   ├── jwt_helper.php               # Geração e validação de JWT
│   ├── middleware/                  # Middleware de autenticação
│   │   └── auth_middleware.php      # Auth e autorização por roles
│   ├── auth.php                     # Sistema de autenticação
│   ├── register.php                 # Registro de novos tenants
│   ├── approve.php                  # Aprovação de tenants
│   ├── session.php                  # CRUD de sessões (filtrado por tenant)
│   ├── players.php                  # API de jogadores únicos
│   ├── invite.php                   # Sistema de convites
│   ├── accept_invite.php            # Processar convites via email
│   ├── super_admin.php              # Dashboard e APIs do super admin
│   ├── agent.php                    # APIs do PokerBot Agente
│   ├── pdf_generator.php            # Geração de relatórios PDF
│   ├── email_config.php             # Configuração SMTP e templates
│   ├── setup_saas.sql               # Script de criação do banco multi-tenant
│   └── composer.json                # Dependências PHP (PHPMailer)
├── 📁 .github/workflows/            # CI/CD Automatizado
│   └── deploy-hostinger.yml         # Deploy automático para Hostinger
├── 📁 explicacoes/                  # Documentação técnica completa
│   ├── APRENDIZADOS_PROJETO_SAAS.md # Aprendizados e erros
│   ├── CONFIGURACAO_SMTP_EMAIL.md   # Setup de emails
│   ├── CORRECOES_SISTEMA_COMPLETAS.md # Correções implementadas
│   ├── ESTRUTURA_ABAS.md            # Estrutura das abas
│   ├── HISTORICO_ABAS.md            # Histórico e navegação
│   ├── HOSTINGER_SETUP.md           # Setup no Hostinger
│   ├── OTIMIZACAO_TRANSFERENCIAS_COMPLETA.md # Doc. otimização
│   ├── PLANO_POKERBOT_AGENTE.md     # Documentação do PokerBot
│   ├── PROMPT_FUNCIONALIDADES.md    # Prompt de funcionalidades
│   ├── SETUP_GITHUB_SECRETS.md      # Configuração de deploy
│   ├── SISTEMA_JANTA_COMPLETO.md    # Doc. sistema de janta
│   ├── HISTORICO_MIGRACAO_SAAS.md   # Histórico da migração para SaaS
│   └── RELATORIO_LIMPEZA_PROJETO.md # Relatório de limpeza do projeto
├── 📁 dist/                         # Build de produção (gerado automaticamente)
│   ├── assets/                      # Assets otimizados
│   ├── favicon.svg                  # Ícone da aplicação
│   ├── index.html                   # HTML principal
│   └── manifest.json                # PWA manifest
├── 📁 public/                       # Arquivos estáticos
│   ├── favicon.svg                  # Ícone da aplicação
│   └── manifest.json                # PWA manifest
├── 📁 node_modules/                 # Dependências Node.js (gerado automaticamente)
├── 📄 .htaccess                     # Rewrite rules Apache (SPA routing)
├── 📄 package.json                  # Dependências Node.js
├── 📄 package-lock.json             # Lock file das dependências
├── 📄 vite.config.js                # Configuração do Vite
├── 📄 tailwind.config.js            # Configuração do Tailwind
├── 📄 postcss.config.js             # Configuração do PostCSS
├── 📄 index.html                    # HTML principal (desenvolvimento)
├── 📄 README.md                     # Documentação completa do projeto
├── 📄 PROMPT_REPLICACAO_PROJETO_SAAS.md # Guia para replicar projeto
├── 📄 GUIA_ALINHAMENTO_PERFEITO_SAAS.md # Guia de alinhamento
└── 📄 RELATORIO_LIMPEZA_PROJETO.md  # Relatório de limpeza
```

## 🔧 **Stack Tecnológico Completo**

### **Frontend**
- **Next.js 15**: Framework React com App Router
- **React 19**: Biblioteca UI com Server Components
- **TypeScript 5**: Tipagem estática e type-safety
- **Tailwind CSS 4**: Framework CSS utilitário moderno
- **Framer Motion**: Animações fluidas
- **Zustand**: State management leve
- **Radix UI**: Componentes acessíveis (shadcn/ui)
- **Lucide Icons**: Ícones modernos

### **Backend**
- **Next.js API Routes**: Endpoints TypeScript type-safe
- **Supabase**: Backend-as-a-Service completo
  - Auth: Autenticação e autorização
  - Database: PostgreSQL gerenciado
  - Storage: Armazenamento de arquivos
  - Realtime: Atualizações em tempo real
- **PostgreSQL 15**: Banco de dados relacional
- **Row Level Security**: Políticas de segurança no banco

### **Autenticação & Segurança**
- **Supabase Auth**: Sistema profissional de auth
- **JWT**: Tokens seguros com refresh automático
- **OAuth 2.0**: Google, Microsoft, etc.
- **MFA/2FA**: Autenticação de dois fatores
- **RLS Policies**: Isolamento de dados por tenant
- **bcrypt**: Hash seguro de senhas

### **Analytics & Monitoring**
- **Vercel Analytics**: Performance e Web Vitals
- **Google Analytics 4**: Tracking de eventos
- **Error Boundary**: Tratamento de erros React
- **Audit Logs**: Rastreamento de ações

### **DevOps & Deploy**
- **Vercel**: Plataforma de deploy otimizada
- **GitHub**: Controle de versão e CI/CD
- **pnpm**: Gerenciador de pacotes rápido
- **Environment Variables**: Configuração segura
- **TypeScript**: Validação em tempo de build

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

### **🔗 Links Principais**
- **🏠 Aplicação**: `https://seu-dominio.vercel.app/`
- **🔐 Login**: `https://seu-dominio.vercel.app/login`
- **📝 Registro**: `https://seu-dominio.vercel.app/register`
- **📊 Dashboard**: `https://seu-dominio.vercel.app/dashboard`

### **📧 Contatos**
- **Desenvolvedor**: Luis Fernando Boff
- **Email**: luisfboff@hotmail.com
- **GitHub**: [@luisfboff1](https://github.com/luisfboff1)
- **Repositório**: [POKERv4](https://github.com/luisfboff1/POKERv4)

---

## 🏆 **Evolução do Projeto**

### **v1.0 - Sistema Básico (2024)**
- ❌ Sistema simples sem autenticação
- ❌ Single-tenant (apenas um grupo)
- ❌ PHP + MySQL tradicional
- ❌ Sem segurança adequada

### **v2.0 - SaaS Multi-Tenant (2025)**
- ✅ Sistema SaaS completo
- ✅ Multi-tenant com isolamento
- ✅ JWT customizado (vulnerável)
- ✅ React + Vite + PHP

### **v3.0 - Next.js Migration (2025)**
- ✅ Migração para Next.js 15
- ✅ TypeScript completo
- ✅ Server Components
- ✅ API Routes modernas

### **v4.0 - Segurança Empresarial (Atual - 2025)**
- ✅ Supabase Auth (elimina vulnerabilidades)
- ✅ PostgreSQL com RLS
- ✅ OAuth integrado
- ✅ MFA/2FA pronto
- ✅ Conformidade SOC 2, ISO 27001
- ✅ Zero secrets hardcoded
- ✅ Tokens de curta duração (1h)
- ✅ Refresh automático (30 dias)

**De um sistema simples para amigos, transformamos em uma plataforma SaaS de nível empresarial!**

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
