# Configuração de Autenticação com OAuth

Este documento descreve como configurar a autenticação usando Supabase com suporte a login via Google e Microsoft.

## 1. Configuração do Supabase

### 1.1 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jhodhxvvhohygijqcxbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impob2RoeHZ2aG9oeWdpanFjeGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTg3ODUsImV4cCI6MjA3NjQ3NDc4NX0.XPzqxEm6rYFe6ctVbYs7AkJoI-cTjEu8pJjBftCkQGg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impob2RoeHZ2aG9oeWdpanFjeGJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg5ODc4NiwiZXhwIjoyMDc2NDc0Nzg2fQ.O6ZcMyGgKrzUDs1vFcijCqKpqsPzjfywcwZtH2vlVUc
SUPABASE_JWT_SECRET=wjsrCQNHbvavr8rAOMwftEJeb6AZ03vZAQwlMZ+bUx8ZHWXYbNMvBxSJajNWwHD3XY5CREORP24TEFEOjmA6Dw==

# Database Configuration (opcional - para conexões diretas)
POSTGRES_URL=postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_USER=postgres
POSTGRES_HOST=db.jhodhxvvhohygijqcxbo.supabase.co
POSTGRES_PASSWORD=affJLwPDtzPm0LYI
POSTGRES_DATABASE=postgres

# JWT Configuration (opcional)
JWT_SECRET=your-custom-jwt-secret

# Next.js Configuration
NEXT_PUBLIC_API_URL=/api
```

## 2. Configuração do Google OAuth

### 2.1 Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google+ (Google+ API)

### 2.2 Criar Credenciais OAuth 2.0

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth client ID"
3. Selecione "Web application"
4. Configure:
   - **Name**: Poker Manager
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desenvolvimento)
     - `https://your-domain.com` (produção)
   - **Authorized redirect URIs**:
     - `https://jhodhxvvhohygijqcxbo.supabase.co/auth/v1/callback`
     - `http://localhost:3000/api/auth/callback` (desenvolvimento)

5. Copie o **Client ID** e **Client Secret**

### 2.3 Configurar no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá para "Authentication" > "Providers"
4. Encontre "Google" e clique em "Enable"
5. Cole o **Client ID** e **Client Secret**
6. Certifique-se de que a URL de callback está configurada:
   ```
   https://jhodhxvvhohygijqcxbo.supabase.co/auth/v1/callback
   ```
7. Salve as configurações

## 3. Configuração do Microsoft OAuth (Azure AD)

### 3.1 Registrar Aplicação no Azure Portal

1. Acesse [Azure Portal](https://portal.azure.com/)
2. Vá para "Azure Active Directory" > "App registrations"
3. Clique em "New registration"
4. Configure:
   - **Name**: Poker Manager
   - **Supported account types**: 
     - "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: 
     - Platform: Web
     - URI: `https://jhodhxvvhohygijqcxbo.supabase.co/auth/v1/callback`

### 3.2 Criar Client Secret

1. No app registrado, vá para "Certificates & secrets"
2. Clique em "New client secret"
3. Adicione uma descrição e escolha a validade
4. Copie o **Value** (Client Secret) - você não poderá vê-lo novamente!

### 3.3 Configurar Permissões

1. Vá para "API permissions"
2. Adicione as seguintes permissões da "Microsoft Graph":
   - `email`
   - `openid`
   - `profile`
3. Clique em "Grant admin consent"

### 3.4 Configurar no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá para "Authentication" > "Providers"
4. Encontre "Azure (Microsoft)" e clique em "Enable"
5. Configure:
   - **Azure Tenant ID**: (encontre no Overview do app no Azure)
   - **Application (client) ID**: (encontre no Overview do app no Azure)
   - **Client Secret**: (o valor que você copiou anteriormente)
6. Certifique-se de que a URL de callback está configurada:
   ```
   https://jhodhxvvhohygijqcxbo.supabase.co/auth/v1/callback
   ```
7. Salve as configurações

## 4. URLs de Redirecionamento

As URLs de callback configuradas no código são:

- **Desenvolvimento**: `http://localhost:3000/api/auth/callback`
- **Produção**: `https://your-domain.com/api/auth/callback`

O middleware da aplicação redireciona automaticamente para `/api/auth/callback`, que:
1. Valida o código OAuth
2. Cria ou atualiza o usuário no banco de dados
3. Verifica se existe um convite pendente para o email
4. Redireciona para o dashboard

## 5. Fluxo de Autenticação

### 5.1 Login com Email/Senha

1. Usuário preenche email e senha
2. Sistema valida credenciais via Supabase Auth
3. Busca dados do usuário na tabela `users`
4. Armazena sessão usando Zustand
5. Redireciona para dashboard

### 5.2 Login com OAuth (Google/Microsoft)

1. Usuário clica no botão OAuth
2. Redireciona para provedor OAuth
3. Usuário autoriza a aplicação
4. Provedor redireciona para `/api/auth/callback`
5. Sistema verifica se email tem convite pendente
6. Cria usuário ou atualiza último login
7. Armazena sessão usando Zustand
8. Redireciona para dashboard

### 5.3 Aceitar Convite com OAuth

1. Usuário recebe email com link de convite
2. Clica no link com token
3. Na página de aceite, clica em OAuth
4. Token do convite é salvo no sessionStorage
5. Após callback OAuth, cria conta vinculada ao convite
6. Redireciona para dashboard

## 6. Segurança

### 6.1 Tokens de Convite

- Tokens são hash SHA-256 antes de serem armazenados
- Expiram em 7 dias
- Validados no servidor antes de aceitar

### 6.2 Proteção de Rotas

- Middleware verifica autenticação em todas as rotas protegidas
- Rotas públicas: `/login`, `/register`, `/accept-invite`, `/forgot-password`
- Todas as outras rotas requerem autenticação

### 6.3 Sessões

- Sessões gerenciadas pelo Supabase Auth
- Auto-refresh de tokens
- Persistência em localStorage via Zustand
- Validação no servidor para rotas de API

## 7. Testando a Configuração

### 7.1 Teste Local

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/login` e teste:
- Login com email/senha
- Login com Google
- Login com Microsoft

### 7.2 Verificar Logs

- Logs do Supabase: Dashboard > Logs
- Logs da aplicação: Console do navegador
- Logs do servidor: Terminal onde o Next.js está rodando

## 8. Troubleshooting

### Erro: "No invitation found"
- Certifique-se de que existe um convite pendente para o email OAuth
- Verifique a tabela `user_invites` no Supabase

### Erro: "Invalid redirect URI"
- Verifique se as URLs de callback estão corretas no Google Cloud/Azure
- Certifique-se de que a URL do Supabase está correta

### Erro: "Session expired"
- Tokens OAuth expiram - refaça o login
- Verifique a configuração de auto-refresh no Supabase

### Erro ao criar usuário
- Verifique se a tabela `users` existe
- Verifique se o tenant_id do convite é válido
- Verifique logs do Supabase para erros de SQL

## 9. Próximos Passos

- [ ] Configurar envio de emails para convites
- [ ] Adicionar mais provedores OAuth (GitHub, LinkedIn, etc.)
- [ ] Implementar autenticação de dois fatores (2FA)
- [ ] Adicionar rate limiting para prevenção de abuso
- [ ] Configurar monitoramento de tentativas de login
