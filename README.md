# 🎯 Poker SaaS - Sistema Multi-Tenant de Gestão de Poker

> **Sistema SaaS completo** para gerenciamento de home games de poker com autenticação, multi-tenancy, PokerBot IA, sistema de convites, geração de PDFs e muito mais!

![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![PHP](https://img.shields.io/badge/PHP-8.x-purple?logo=php)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-cyan?logo=tailwindcss)
![JWT](https://img.shields.io/badge/JWT-Auth-green?logo=jsonwebtokens)
![Hostinger](https://img.shields.io/badge/Deploy-Hostinger-green)
![SaaS](https://img.shields.io/badge/Architecture-SaaS-gold)

## 🚀 **Funcionalidades Principais**

### 🔐 **Sistema SaaS Multi-Tenant**
- **Autenticação JWT**: Login seguro com tokens e refresh automático
- **Multi-tenancy**: Múltiplos grupos de poker isolados
- **Controle de Acesso**: Super Admin, Tenant Admin e Usuários
- **Sistema de Convites**: Admins podem convidar novos membros
- **Aprovação de Tenants**: Super Admin aprova novos grupos

### 🎯 **Gestão de Sessões de Poker**
- **Controle de Buy-ins**: Registra todas as entradas de dinheiro
- **Cash-out**: Registra quanto cada jogador saiu com
- **Cálculo Automático**: Determina quem deve e quem deve receber
- **Otimização de Pagamentos**: Minimiza transferências (N² → N-1)
- **Sistema de Recomendações**: Pagamentos específicos entre jogadores

### 🤖 **PokerBot - Agente IA Inteligente**
- **Análise de Dados**: Responde perguntas sobre estatísticas
- **Criação de Sessões**: "Criar sessão hoje" via comando
- **Geração de PDFs**: Relatórios automáticos de sessões
- **Envio de Convites**: Convidar jogadores via email
- **Interface Chat**: Interação natural com o agente
- **Ações Rápidas**: Botões para ações comuns

### 🍽️ **Sistema de Janta Inteligente**
- **Divisão Igual**: Para churrascos, pizzas (valor ÷ pessoas)
- **Divisão Personalizada**: Para pedidos individuais
- **Controle de Pagamentos**: Checkboxes para marcar quem pagou
- **Histórico Completo**: Edita jantas de sessões passadas
- **Botão Salvar Rápido**: Salva alterações sem entrar em modo edição

### 👥 **Gerenciamento de Usuários**
- **Dashboard Super Admin**: Visão global de todos os tenants
- **Gestão de Membros**: Admins podem remover/gerenciar membros
- **Reset de Senhas**: Admins podem alterar senhas dos membros
- **Convites por Email**: Sistema automatizado de convites
- **Auditoria**: Logs de todas as ações importantes

### 📊 **Relatórios e Analytics**
- **PDFs Automáticos**: Relatórios de sessões e mensais
- **Rankings**: Estatísticas de performance dos jogadores
- **Dashboard Administrativo**: Métricas e insights
- **Histórico Detalhado**: Todas as sessões com filtros

### 📧 **Sistema de Email**
- **PHPMailer**: Envio real de emails via SMTP
- **Templates HTML**: Emails profissionais e responsivos
- **Notificações**: Convites, aprovações, alertas
- **Configuração SMTP**: noreply@luisfboff.com

## 🏗️ **Arquitetura SaaS Multi-Tenant**

### **Frontend (React + Vite)**
```
src/
├── App.jsx                    # Router principal com rotas protegidas
├── main.jsx                   # Ponto de entrada da aplicação
├── index.css                  # Estilos globais + Tailwind
├── contexts/
│   ├── AuthContext.jsx        # Estado global de autenticação
│   └── AgentContext.jsx       # Estado do PokerBot Agente
├── components/
│   ├── Layout/                # Layout principal autenticado
│   ├── ProtectedRoute/        # Controle de acesso por roles
│   ├── PokerBot/              # Interface do agente IA
│   ├── SessionManager/        # Gerenciamento de sessões
│   └── ErrorBoundary/         # Tratamento de erros React
├── pages/
│   ├── Login/                 # Página de login
│   ├── Register/              # Registro de novos tenants
│   ├── Home/                  # Dashboard principal
│   ├── NewSession/            # Criar nova sessão
│   ├── History/               # Histórico de sessões
│   ├── Ranking/               # Rankings e estatísticas
│   ├── Invites/               # Gerenciar convites (renomeado para "Convidados")
│   ├── SuperAdmin/            # Dashboard super admin
│   └── AcceptInvite/          # Aceitar convites via email
└── services/
    └── api.js                 # Cliente HTTP para todas as APIs
```

### **Backend (PHP + MySQL)**
```
api/
├── config.php                # Configuração do banco de dados
├── jwt_helper.php            # Geração e validação de JWT tokens
├── middleware/
│   └── auth_middleware.php   # Middleware de autenticação e autorização
├── auth.php                  # Sistema de autenticação (login/logout)
├── register.php              # Registro de novos tenants
├── approve.php               # Aprovação de tenants pelo super admin
├── session.php               # CRUD de sessões de poker (filtrado por tenant)
├── players.php               # API de jogadores únicos
├── invite.php                # Sistema de convites para membros
├── accept_invite.php         # Processar convites via email
├── super_admin.php           # Dashboard e APIs do super admin
├── agent.php                 # APIs do PokerBot Agente
├── pdf_generator.php         # Geração de relatórios em PDF
├── email_config.php          # Configuração SMTP e templates
├── setup_saas.sql            # Script de criação do banco
├── migration_existing_data.sql # Migração de dados antigos
└── update_roles.sql          # Atualização de roles
```

### **Banco de Dados Multi-Tenant (MySQL)**
```sql
-- 🏢 TENANTS (Grupos de Poker)
tenants (id, name, email, plan, status, max_users, max_sessions_per_month)

-- 👥 USUÁRIOS (Multi-tenant)
users (id, tenant_id, name, email, password_hash, role, is_active, login_attempts)

-- 🎰 SESSÕES (Filtradas por tenant)
sessions (id, tenant_id, date, players_data, recommendations, created_by)

-- 🔑 GESTÃO DE TOKENS
user_sessions (id, user_id, token_hash, refresh_token, expires_at)

-- 📧 CONVITES
user_invites (id, tenant_id, email, name, role, invite_token, status, expires_at)

-- 📋 AUDITORIA
audit_logs (id, tenant_id, user_id, action, table_name, record_id, old_data, new_data)
```

## 🔐 **Controle de Acesso e Roles**

### **👑 Super Admin (Luis)**
- **Visão Global**: Dashboard com todos os tenants
- **Gestão de Tenants**: Aprovar, suspender, alterar planos
- **Gestão de Usuários**: Ver, remover, alterar senhas de qualquer usuário
- **Métricas Globais**: Estatísticas de toda a plataforma
- **Auditoria**: Logs de todas as ações do sistema

### **🏢 Tenant Admin (Dono do Grupo)**
- **Gestão do Grupo**: Convidar, remover membros
- **Criar Sessões**: Adicionar novas sessões de poker
- **Relatórios**: Gerar PDFs das sessões
- **Configurações**: Gerenciar dados do seu grupo

### **👤 Usuário (Membro do Grupo)**
- **Visualizar**: Ver sessões e estatísticas do grupo
- **Rankings**: Acompanhar performance pessoal
- **Histórico**: Consultar sessões passadas
- **Sem Edição**: Apenas visualização (não pode criar/editar)

## ⚙️ **Sistema Multi-Tenant (Configurado)**

### **✅ Status Atual**
O sistema SaaS multi-tenant está **100% configurado e funcionando**:
- 🟢 **Banco MySQL** - Estrutura multi-tenant completa
- 🟢 **Autenticação JWT** - Tokens seguros com refresh
- 🟢 **Isolamento de Dados** - Cada tenant vê apenas seus dados
- 🟢 **Sistema de Convites** - Emails automáticos funcionando
- 🟢 **PokerBot Agente** - IA integrada e ativa

### **📊 Tabelas do Sistema SaaS**
- ✅ `tenants` - Grupos de poker (multi-tenant)
- ✅ `users` - Usuários com roles e tenant_id
- ✅ `sessions` - Sessões filtradas por tenant
- ✅ `user_sessions` - Gestão de tokens JWT
- ✅ `user_invites` - Sistema de convites
- ✅ `audit_logs` - Auditoria completa

## 🚀 **Como Executar**

### **Desenvolvimento Local**
```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor de desenvolvimento
npm run dev

# 3. Acessar no navegador
http://localhost:5173
```

### **Produção (Hostinger) - ✅ Já Configurado**
O sistema já está **totalmente configurado** e funcionando em produção:
- ✅ **Arquivos enviados** - Projeto completo no servidor
- ✅ **Domínio configurado** - Apontando para a pasta correta
- ✅ **Banco conectado** - MySQL funcionando perfeitamente
- ✅ **Sistema operacional** - Pronto para uso

## 💡 **Como Usar o Sistema SaaS**

### **🔐 Para Novos Grupos (Tenant Admins)**
1. **Acesse**: `https://poker.luisfboff.com/register`
2. **Cadastre seu grupo** com nome e email
3. **Aguarde aprovação** do Super Admin (Luis)
4. **Receba email** de confirmação
5. **Faça login** e comece a usar!

### **👥 Para Convidar Membros**
1. **Acesse**: Aba "Convidados" (apenas admins)
2. **Clique**: "📧 Enviar Convite"
3. **Digite**: Email e nome do jogador
4. **Escolha**: Role (Admin ou Membro)
5. **Envie**: Convite automático por email

### **🎰 Gerenciar Sessões de Poker**
1. **Criar**: Nova sessão (apenas admins)
2. **Adicionar jogadores** e registrar buy-ins
3. **Registrar cash-outs** ao final
4. **Ver transferências** otimizadas automaticamente
5. **Gerar PDF** da sessão via PokerBot

### **🤖 Usar o PokerBot Agente**
1. **Clique**: Botão do robô (canto inferior direito)
2. **Digite comandos**: "Criar sessão hoje", "Gerar PDF"
3. **Use botões**: Ações rápidas na aba "Ações"
4. **Faça perguntas**: "Quem ganhou mais este mês?"
5. **Monitore**: Status do agente na aba "Status"

### **📊 Dashboard Super Admin**
1. **Visão Geral**: Estatísticas globais
2. **Tenants**: Gerenciar todos os grupos
3. **Usuários**: Ver e gerenciar todos os usuários
4. **Atividade**: Logs de auditoria
5. **Receita**: Relatórios financeiros

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
- **React 18**: Biblioteca para interfaces reativas
- **Vite**: Build tool rápido e moderno  
- **Tailwind CSS**: Framework CSS utilitário
- **React Router**: Navegação SPA
- **Context API**: Gerenciamento de estado global
- **JavaScript ES6+**: Sintaxe moderna

### **Backend**
- **PHP 8.x**: Linguagem server-side
- **MySQL 8.0**: Banco de dados relacional
- **JWT**: Autenticação com tokens
- **PHPMailer**: Sistema de emails
- **PDO**: Camada de abstração do banco
- **TCPDF**: Geração de relatórios PDF

### **Inteligência Artificial**
- **Groq API**: LLM para o PokerBot
- **Llama 3.1**: Modelo de linguagem
- **Function Calling**: Agente ativo
- **Context Awareness**: IA contextual

### **DevOps & Deploy**
- **GitHub Actions**: CI/CD automatizado
- **FTP Deploy**: Deploy automático para Hostinger
- **Environment Variables**: Configuração segura via GitHub Secrets
- **Composer**: Gerenciamento de dependências PHP

### **Hospedagem & Infraestrutura**
- **Hostinger**: Hospedagem compartilhada
- **Apache**: Servidor web com mod_rewrite
- **SSL**: Certificado de segurança
- **MySQL**: Banco de dados na nuvem
- **SMTP**: Email server configurado

## 📊 **Métricas do Sistema SaaS**

### **📈 Escala e Performance**
- 🏢 **Multi-tenant**: Suporte a múltiplos grupos
- 👥 **Usuários**: Ilimitados por tenant
- 🎰 **Sessões**: Histórico completo e pesquisável
- ⚡ **Performance**: < 2s carregamento
- 📱 **100% Responsivo**: Mobile e desktop

### **🔧 Arquivos e Código**
- 📁 **~50 arquivos** essenciais (otimizado)
- 🎯 **13 arquivos** de documentação técnica
- ⚡ **15+ componentes** React
- 🔧 **14 endpoints** PHP
- 🗄️ **6 tabelas** MySQL multi-tenant
- 🤖 **1 agente IA** ativo

### **🛡️ Segurança e Confiabilidade**
- 🔐 **JWT Authentication**: Tokens seguros
- 🏢 **Tenant Isolation**: Dados completamente isolados
- 📋 **Audit Logs**: Rastreamento completo de ações
- 🔒 **Password Hashing**: bcrypt seguro
- ✅ **Input Validation**: Sanitização em todas as APIs

## 🌐 **URLs e Acesso**

### **🔗 Links Principais**
- **🏠 Sistema Principal**: `https://poker.luisfboff.com/`
- **🔐 Login**: `https://poker.luisfboff.com/login`
- **📝 Registro**: `https://poker.luisfboff.com/register`
- **👑 Super Admin**: `https://poker.luisfboff.com/admin`

### **📧 Contatos**
- **Super Admin**: Luis Fernando Boff
- **Email**: luisfboff@hotmail.com
- **Sistema**: noreply@luisfboff.com

## 🚀 **Deploy e CI/CD**

### **✅ Automatização Completa**
- **GitHub Actions**: Deploy automático a cada push
- **Build Process**: Vite + Composer + FTP
- **Environment**: GitHub Secrets para configurações sensíveis
- **Zero Downtime**: Deploy sem interrupção do serviço

## 📚 **Documentação Técnica**

Para documentação detalhada, consulte:
- 📖 `explicacoes/APRENDIZADOS_PROJETO_SAAS.md` - Aprendizados e erros
- 📖 `explicacoes/PLANO_POKERBOT_AGENTE.md` - Documentação do PokerBot
- 📖 `explicacoes/CONFIGURACAO_SMTP_EMAIL.md` - Setup de emails
- 📖 `explicacoes/SETUP_GITHUB_SECRETS.md` - Configuração de deploy
- 📖 `explicacoes/HISTORICO_MIGRACAO_SAAS.md` - Histórico da migração
- 📖 `RELATORIO_LIMPEZA_PROJETO.md` - Relatório de limpeza
- 📖 `PROMPT_REPLICACAO_PROJETO_SAAS.md` - Guia para replicar projeto
- 📖 `GUIA_ALINHAMENTO_PERFEITO_SAAS.md` - Guia de alinhamento

---

## 🧹 **Limpeza e Otimização do Projeto**

### **✅ Arquivos Removidos (Limpeza Executada)**
- ❌ `test-index.html` - Arquivo de teste HTML simples
- ❌ `index-CFocYvPT.js` - Build antigo duplicado na raiz
- ❌ `api/migration_existing_data.sql` - Script SQL já executado
- ❌ `api/update_roles.sql` - Script SQL já executado

### **📁 Documentação Reorganizada**
- ✅ `api/README_MIGRACAO_SAAS.md` → `explicacoes/HISTORICO_MIGRACAO_SAAS.md`
- ✅ README.md atualizado com estrutura atual
- ✅ Referências a arquivos inexistentes removidas

### **🎯 Resultado da Limpeza**
- **Projeto mais limpo** e profissional
- **Estrutura organizada** sem arquivos desnecessários
- **Documentação atualizada** e precisa
- **Manutenção facilitada** com menos arquivos

---

## 🏆 **Transformação Completa: Single-User → SaaS**

**De um sistema simples para amigos, transformamos em uma plataforma SaaS robusta e escalável!**

✅ **Antes**: Sistema local para um grupo  
🚀 **Depois**: Plataforma SaaS multi-tenant com IA

**Desenvolvido com ❤️ para revolucionar o gerenciamento de home games de poker!** 🎯🤖
