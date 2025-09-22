# 🚀 **PROMPT COMPLETO PARA REPLICAR PROJETO SAAS**

## 📋 **VISÃO GERAL DO SISTEMA**

Este é um sistema SaaS multi-tenant de gestão de poker que funciona com:
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: PHP + MySQL + JWT
- **Deploy**: GitHub Actions + FTP + Hostinger
- **Email**: PHPMailer + SMTP
- **IA**: Groq API + Llama 3.1

---

## 🏗️ **ARQUITETURA COMPLETA**

### **1. ESTRUTURA DE PASTAS**
```
projeto/
├── 📁 src/                    # Frontend React
│   ├── App.jsx               # Router principal
│   ├── main.jsx              # Entry point
│   ├── index.css             # Estilos globais
│   ├── contexts/             # Estado global (Auth, Agent)
│   ├── components/           # Componentes React
│   ├── pages/                # Páginas da aplicação
│   └── services/             # Cliente HTTP para APIs
├── 📁 api/                   # Backend PHP
│   ├── config.php            # Conexão MySQL + CORS
│   ├── jwt_helper.php        # Geração/validação JWT
│   ├── middleware/           # Auth middleware
│   ├── auth.php              # Login/logout
│   ├── register.php          # Registro tenants
│   ├── session.php           # CRUD sessões
│   ├── agent.php             # APIs PokerBot
│   ├── email_config.php      # Config SMTP
│   ├── setup_saas.sql        # Script banco
│   └── composer.json         # Dependências PHP
├── 📁 .github/workflows/     # CI/CD
│   └── deploy-hostinger.yml  # Deploy automático
├── 📁 explicacoes/           # Documentação
├── 📄 package.json           # Dependências Node.js
├── 📄 vite.config.js         # Config Vite
├── 📄 tailwind.config.js     # Config Tailwind
├── 📄 .htaccess              # Rewrite rules Apache
└── 📄 README.md              # Documentação
```

### **2. BANCO DE DADOS MULTI-TENANT**
```sql
-- 🏢 TENANTS (Grupos/Empresas)
tenants (id, name, email, status, plan, max_users, max_sessions_per_month)

-- 👥 USUÁRIOS (Multi-tenant)
users (id, tenant_id, name, email, password_hash, role, is_active)

-- 🎰 SESSÕES (Filtradas por tenant)
sessions (id, tenant_id, date, players_data, recommendations, created_by)

-- 🔑 GESTÃO DE TOKENS JWT
user_sessions (id, user_id, token_hash, refresh_token, expires_at)

-- 📧 CONVITES
user_invites (id, tenant_id, email, name, role, invite_token, status)

-- 📋 AUDITORIA
audit_logs (id, tenant_id, user_id, action, table_name, old_data, new_data)
```

---

## 🔐 **SISTEMA DE ROLES E PERMISSÕES**

### **👑 Super Admin**
- Visão global de todos os tenants
- Aprovar/suspender tenants
- Gerenciar qualquer usuário
- Dashboard com métricas globais

### **🏢 Tenant Admin**
- Gerenciar seu grupo/empresa
- Convidar/remover membros
- Criar/editar sessões
- Gerar relatórios

### **👤 Usuário**
- Visualizar dados do seu tenant
- Ver estatísticas pessoais
- Sem permissões de edição

---

## ⚙️ **CONFIGURAÇÃO COMPLETA**

### **1. CONFIGURAÇÃO DO HOSTINGER**

#### **A. Domínio e Subdomínio**
```
1. Criar subdomínio: poker.seudominio.com
2. Configurar "Pasta personalizada": /public_html/poker/
3. NÃO marcar "Usar diretório public_html"
4. DNS apontando para servidor Hostinger
```

#### **B. Banco MySQL**
```
1. Criar banco: poker_settlements
2. Criar usuário com permissões completas
3. Executar script setup_saas.sql
4. Anotar credenciais: host, user, password, database
```

#### **C. Email SMTP**
```
1. Criar email: noreply@seudominio.com
2. Senha forte para o email
3. Configurar SMTP:
   - Host: mail.seudominio.com
   - Porta: 587
   - Segurança: TLS
```

#### **D. FTP**
```
1. Criar usuário FTP ou usar principal
2. Anotar credenciais: host, user, password
3. Diretório de destino: /public_html/poker/
```

### **2. CONFIGURAÇÃO GITHUB SECRETS**

#### **A. Secrets de Banco de Dados**
```
DB_HOST = mysql.seudominio.com
DB_NAME = poker_settlements
DB_USER = seu_usuario_mysql
DB_PASSWORD = sua_senha_mysql
```

#### **B. Secrets de FTP**
```
HOSTINGER_FTP_HOST = ftp.seudominio.com
HOSTINGER_FTP_USER = seu_usuario_ftp
HOSTINGER_FTP_PASSWORD = sua_senha_ftp
```

#### **C. Secrets de Email**
```
SMTP_HOST = mail.seudominio.com
SMTP_PORT = 587
SMTP_USERNAME = noreply@seudominio.com
SMTP_PASSWORD = senha_do_email
SMTP_ENCRYPTION = tls
```

#### **D. Secrets de IA (Opcional)**
```
GROQ_API_KEY = sua_chave_groq_api
```

---

## 🚀 **CONFIGURAÇÃO DO DEPLOY**

### **1. ARQUIVO .github/workflows/deploy-hostinger.yml**
```yaml
name: 🚀 Deploy para Hostinger

on:
  push:
    branches: [ main, master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: 📥 Checkout código
      uses: actions/checkout@v4
      
    - name: 🔧 Configurar Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: 📦 Instalar dependências
      run: npm install
        
    - name: 🏗️ Build do projeto
      run: |
        # Criar .env para frontend (se usar variáveis)
        echo "VITE_GROQ_API_KEY=${{ secrets.GROQ_API_KEY }}" > .env
        
        npm run build
        
        # Configurar banco e email para API
        echo "DB_HOST=${{ secrets.DB_HOST }}" > api/.env
        echo "DB_NAME=${{ secrets.DB_NAME }}" >> api/.env
        echo "DB_USER=${{ secrets.DB_USER }}" >> api/.env
        echo "DB_PASSWORD=${{ secrets.DB_PASSWORD }}" >> api/.env
        echo "SMTP_HOST=${{ secrets.SMTP_HOST }}" >> api/.env
        echo "SMTP_PORT=${{ secrets.SMTP_PORT }}" >> api/.env
        echo "SMTP_USERNAME=${{ secrets.SMTP_USERNAME }}" >> api/.env
        echo "SMTP_PASSWORD=${{ secrets.SMTP_PASSWORD }}" >> api/.env
        echo "SMTP_ENCRYPTION=${{ secrets.SMTP_ENCRYPTION }}" >> api/.env
        
        # Instalar PHPMailer
        cd api
        curl -sS https://getcomposer.org/installer | php
        php composer.phar install --no-dev --optimize-autoloader
        cd ..
        
    - name: 🚀 Deploy Frontend via FTP
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: ${{ secrets.HOSTINGER_FTP_HOST }}
        username: ${{ secrets.HOSTINGER_FTP_USER }}
        password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
        local-dir: ./dist/
        server-dir: /poker/
        
    - name: 🔧 Deploy API via FTP
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: ${{ secrets.HOSTINGER_FTP_HOST }}
        username: ${{ secrets.HOSTINGER_FTP_USER }}
        password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
        local-dir: ./api/
        server-dir: /poker/api/
```

### **2. ARQUIVO .htaccess**
```apache
RewriteEngine On

# Excluir APIs do redirecionamento para React
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . index.html [L]
```

---

## 📦 **DEPENDÊNCIAS E CONFIGURAÇÕES**

### **1. package.json**
```json
{
  "name": "poker-saas",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.0"
  }
}
```

### **2. api/composer.json**
```json
{
    "require": {
        "phpmailer/phpmailer": "^6.8"
    }
}
```

### **3. vite.config.js**
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
});
```

---

## 🔧 **ARQUIVOS DE CONFIGURAÇÃO PHP**

### **1. api/config.php**
```php
<?php
// Configuração simplificada - SEM INFORMAÇÕES SENSÍVEIS
error_reporting(0);
ini_set('display_errors', 0);

// Carregar .env se existir
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Conexão com banco (usando .env)
try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? 'test';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASSWORD'] ?? '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
    exit;
}

// Funções auxiliares
function success($data) {
    echo json_encode(['data' => $data]);
    exit;
}

function error($msg, $code = 500) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}
?>
```

### **2. api/email_config.php**
```php
<?php
require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Carregar variáveis de ambiente
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Configurações SMTP - Seguras via GitHub Secrets
define('SMTP_HOST', $_ENV['SMTP_HOST'] ?? 'smtp.hostinger.com');
define('SMTP_PORT', $_ENV['SMTP_PORT'] ?? 587);
define('SMTP_USERNAME', $_ENV['SMTP_USERNAME'] ?? 'noreply@seudominio.com');
define('SMTP_PASSWORD', $_ENV['SMTP_PASSWORD'] ?? '');
define('SMTP_ENCRYPTION', $_ENV['SMTP_ENCRYPTION'] ?? 'tls');

define('FROM_EMAIL', 'noreply@seudominio.com');
define('FROM_NAME', 'Seu Sistema SaaS');

function sendEmail($to, $subject, $body, $isHTML = true) {
    $mail = new PHPMailer(true);
    
    try {
        // Configuração SMTP
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = SMTP_ENCRYPTION;
        $mail->Port = SMTP_PORT;
        
        // Remetente e destinatário
        $mail->setFrom(FROM_EMAIL, FROM_NAME);
        $mail->addAddress($to);
        
        // Conteúdo
        $mail->isHTML($isHTML);
        $mail->Subject = $subject;
        $mail->Body = $body;
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Erro ao enviar email: " . $mail->ErrorInfo);
        return false;
    }
}
?>
```

---

## 🎯 **FUNCIONALIDADES PRINCIPAIS**

### **1. Sistema Multi-Tenant**
- Isolamento completo de dados por tenant
- Sistema de aprovação de novos tenants
- Controle de limites por plano

### **2. Autenticação JWT**
- Login seguro com tokens
- Refresh automático de tokens
- Middleware de autenticação

### **3. Sistema de Convites**
- Convites por email
- Aprovação automática via link
- Controle de roles por convite

### **4. PokerBot IA (Opcional)**
- Integração com Groq API
- Análise de dados via chat
- Ações automatizadas

### **5. Relatórios PDF**
- Geração automática de relatórios
- Templates personalizáveis
- Envio por email

---

## 🔒 **SEGURANÇA E BOAS PRÁTICAS**

### **1. Zero Credenciais no Código**
- Todas as senhas via GitHub Secrets
- Arquivo .env gerado automaticamente
- Configuração via variáveis de ambiente

### **2. Isolamento Multi-Tenant**
- Filtros por tenant_id em todas as queries
- Middleware de autorização por role
- Logs de auditoria completos

### **3. Validação e Sanitização**
- Input validation em todas as APIs
- Prepared statements para SQL
- Sanitização de dados de entrada

---

## 📊 **PASSOS PARA REPLICAR**

### **1. Preparação (5 minutos)**
```
1. Criar repositório no GitHub
2. Configurar domínio no Hostinger
3. Criar banco MySQL
4. Configurar email SMTP
5. Anotar todas as credenciais
```

### **2. Configuração GitHub (10 minutos)**
```
1. Adicionar todos os secrets necessários
2. Criar arquivo .github/workflows/deploy-hostinger.yml
3. Configurar branch protection se necessário
```

### **3. Estrutura do Projeto (15 minutos)**
```
1. Criar estrutura de pastas
2. Configurar package.json e composer.json
3. Configurar vite.config.js e tailwind.config.js
4. Criar .htaccess
```

### **4. Backend PHP (30 minutos)**
```
1. Criar api/config.php
2. Criar api/email_config.php
3. Implementar APIs principais
4. Configurar middleware de auth
5. Executar setup_saas.sql
```

### **5. Frontend React (45 minutos)**
```
1. Configurar React Router
2. Criar contextos de Auth e Agent
3. Implementar páginas principais
4. Configurar cliente HTTP
5. Implementar componentes
```

### **6. Deploy e Teste (10 minutos)**
```
1. Fazer commit inicial
2. Verificar GitHub Actions
3. Testar deploy no servidor
4. Verificar funcionalidades
```

---

## 🎉 **RESULTADO FINAL**

Após seguir este prompt, você terá:

✅ **Sistema SaaS Multi-Tenant Completo**
- Frontend React moderno e responsivo
- Backend PHP robusto e seguro
- Banco MySQL com estrutura multi-tenant
- Deploy automático via GitHub Actions

✅ **Segurança Total**
- Zero credenciais no código
- JWT authentication
- Isolamento de dados por tenant
- Logs de auditoria

✅ **Funcionalidades Avançadas**
- Sistema de convites por email
- PokerBot com IA (opcional)
- Geração de relatórios PDF
- Dashboard administrativo

✅ **Escalabilidade**
- Suporte a múltiplos tenants
- Controle de limites por plano
- Deploy automatizado
- Monitoramento de performance

---

## 💡 **DICAS IMPORTANTES**

1. **SEMPRE use GitHub Secrets** - Nunca commite credenciais
2. **Teste localmente primeiro** - Use npm run dev para desenvolvimento
3. **Monitore os logs** - Verifique GitHub Actions e logs do servidor
4. **Backup regular** - Configure backup automático do banco
5. **Documente mudanças** - Mantenha README atualizado

---

## 🧹 **LIMPEZA E OTIMIZAÇÃO**

### **✅ Limpeza Executada no Projeto Original**
```bash
# ✅ Arquivos removidos após análise:
rm test-index.html                    # Arquivo de teste HTML
rm index-CFocYvPT.js                  # Build antigo duplicado
rm api/migration_existing_data.sql    # Script SQL executado
rm api/update_roles.sql               # Script SQL executado

# ✅ Documentação reorganizada:
mv api/README_MIGRACAO_SAAS.md explicacoes/HISTORICO_MIGRACAO_SAAS.md
```

### **📁 Estrutura Final Limpa**
```
projeto/
├── src/                    # Frontend React (limpo)
├── api/                    # Backend PHP (apenas essenciais)
├── explicacoes/            # Documentação organizada
├── .github/workflows/      # Deploy automático
├── README.md              # Documentação atualizada
└── Arquivos de config      # Configurações essenciais
```

### **🎯 Benefícios da Limpeza**
- **Projeto mais profissional** sem arquivos desnecessários
- **Estrutura organizada** e fácil de navegar
- **Documentação atualizada** e precisa
- **Manutenção facilitada** com menos arquivos

---

**🚀 Este prompt contém TUDO necessário para replicar um sistema SaaS profissional e escalável!**
