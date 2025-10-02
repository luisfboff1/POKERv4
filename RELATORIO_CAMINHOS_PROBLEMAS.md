# 📋 RELATÓRIO: Problemas de Caminhos no Repositório

## 🔍 Análise Completa de Caminhos Absolutos vs Relativos

Este documento lista **todos** os problemas de caminhos encontrados no repositório e suas respectivas correções.

---

## ✅ ARQUIVOS SEM PROBLEMAS (USO CORRETO DE __DIR__)

Os seguintes arquivos **já utilizam caminhos relativos corretamente**:

### PHP Files ✅
- `api/config.php` - linha 7: `__DIR__ . '/.env'` ✅
- `api/config.php` - linha 8: `__DIR__ . '/.env'` ✅
- `api/auth.php` - linha 7: `require_once 'config.php'` ✅
- `api/auth.php` - linha 8: `require_once 'jwt_helper.php'` ✅
- `api/session.php` - linha 7: `require_once 'config.php'` ✅
- `api/session.php` - linha 8: `require_once 'middleware/auth_middleware.php'` ✅
- `api/middleware/auth_middleware.php` - linha 7: `require_once __DIR__ . '/../jwt_helper.php'` ✅
- `api/email_config.php` - linha 3: `require_once __DIR__ . '/vendor/autoload.php'` ✅
- `api/email_config.php` - linha 10: `__DIR__ . '/.env'` ✅
- `api/register.php` - linha 7: `require_once 'config.php'` ✅
- `api/invite.php` - linha 7: `require_once 'config.php'` ✅
- `api/invite.php` - linha 8: `require_once 'middleware/auth_middleware.php'` ✅
- `api/invite.php` - linha 9: `require_once 'email_config.php'` ✅
- `api/accept_invite.php` - linha 7: `require_once 'config.php'` ✅

---

## ⚠️ PROBLEMAS ENCONTRADOS

### 1️⃣ PROBLEMA: Caminhos Absolutos no email_config.php

**Arquivo:** `api/email_config.php`  
**Linha:** 82  
**Código Problemático:**
```php
file_put_contents(__DIR__ . '/email_log.txt', json_encode($logData) . "\n", FILE_APPEND);
```

**Problema:**
- Salva logs de email na pasta `/api/email_log.txt` que pode crescer indefinidamente
- Deve usar um diretório de logs configurável ou /tmp

**Correção Recomendada:**
```php
// Usar diretório temporário ou configurável
$logFile = sys_get_temp_dir() . '/poker_email_log.txt';
file_put_contents($logFile, json_encode($logData) . "\n", FILE_APPEND);
```

**Severidade:** 🟡 MÉDIA (funciona, mas não é ideal)

---

### 2️⃣ PROBLEMA: Hardcoded URLs no email_config.php

**Arquivo:** `api/email_config.php`  
**Linha:** 33  
**Código Problemático:**
```php
define('BASE_URL', 'https://poker.luisfboff.com');
```

**Problema:**
- URL hardcoded que só funciona em produção
- Vai quebrar em ambiente de desenvolvimento local ou staging
- Deve usar variável de ambiente ou detectar automaticamente

**Correção Recomendada:**
```php
// Usar variável de ambiente com fallback
define('BASE_URL', $_ENV['BASE_URL'] ?? 'https://poker.luisfboff.com');

// OU detectar automaticamente:
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'poker.luisfboff.com';
define('BASE_URL', $protocol . '://' . $host);
```

**Severidade:** 🟠 ALTA (quebra em outros ambientes)

---

### 3️⃣ PROBLEMA: Diretórios Fixos no pdf_generator.php

**Arquivo:** `api/pdf_generator.php`  
**Linhas:** 42, 45-46, 54, 75-76, 86  
**Código Problemático:**
```php
// Linha 42
$filePath = __DIR__ . "/temp_pdfs/" . $fileName;

// Linhas 45-46
if (!is_dir(__DIR__ . "/temp_pdfs/")) {
    mkdir(__DIR__ . "/temp_pdfs/", 0755, true);
}

// Linha 54
'download_url' => "/api/download_pdf.php?file=" . urlencode($fileName),

// Linhas 75-76
if (!is_dir(__DIR__ . "/temp_pdfs/")) {
    mkdir(__DIR__ . "/temp_pdfs/", 0755, true);
}

// Linha 86
'download_url' => "/api/download_pdf.php?file=" . urlencode($fileName),
```

**Problemas:**
1. Cria pasta `/api/temp_pdfs/` que pode acumular arquivos
2. URL `/api/download_pdf.php` é hardcoded (não considera subdiretorios)
3. Não há limpeza automática de arquivos antigos

**Correção Recomendada:**
```php
// Usar diretório temporário do sistema
$tempDir = sys_get_temp_dir() . '/poker_pdfs';
if (!is_dir($tempDir)) {
    mkdir($tempDir, 0755, true);
}

$filePath = $tempDir . '/' . $fileName;

// URL relativa considerando o contexto
$baseApiPath = dirname($_SERVER['SCRIPT_NAME']);
$downloadUrl = $baseApiPath . '/download_pdf.php?file=' . urlencode($fileName);

// Adicionar limpeza de arquivos antigos (>24h)
function cleanOldPDFs($dir) {
    $files = glob($dir . '/*');
    $now = time();
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file) >= 24 * 3600)) {
            unlink($file);
        }
    }
}
cleanOldPDFs($tempDir);
```

**Severidade:** 🟠 ALTA (pode causar problemas de espaço e paths incorretos)

---

### 4️⃣ PROBLEMA: Hardcoded URLs no register.php

**Arquivo:** `api/register.php`  
**Linhas:** 125-126  
**Código Problemático:**
```php
$approve_url = "https://" . $_SERVER['HTTP_HOST'] . "/api/approve.php?token=" . $approval_token . "&action=approve";
$reject_url = "https://" . $_SERVER['HTTP_HOST'] . "/api/approve.php?token=" . $approval_token . "&action=reject";
```

**Problema:**
- Assume sempre HTTPS (pode não funcionar em desenvolvimento local)
- Path hardcoded `/api/` pode não funcionar se o app estiver em subdiretório
- Não considera configuração de BASE_URL

**Correção Recomendada:**
```php
// Usar BASE_URL já definido ou detectar protocolo
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];

// Detectar o path base automaticamente
$basePath = dirname($_SERVER['SCRIPT_NAME']); // Ex: /poker/api
$approve_url = $protocol . "://" . $host . $basePath . "/approve.php?token=" . $approval_token . "&action=approve";
$reject_url = $protocol . "://" . $host . $basePath . "/approve.php?token=" . $approval_token . "&action=reject";

// OU usar BASE_URL se disponível:
$approve_url = BASE_URL . "/api/approve.php?token=" . $approval_token . "&action=approve";
$reject_url = BASE_URL . "/api/approve.php?token=" . $approval_token . "&action=reject";
```

**Severidade:** 🟠 ALTA (quebra em desenvolvimento local sem HTTPS)

---

### 5️⃣ PROBLEMA: URL Hardcoded no invite.php

**Arquivo:** `api/invite.php`  
**Linha:** 308  
**Código Problemático:**
```php
$accept_url = BASE_URL . "/accept-invite?token=" . $token;
```

**Problema:**
- Depende da constante BASE_URL estar definida
- Path `/accept-invite` assume que o frontend está na raiz
- Pode quebrar se o app estiver em subdiretório (ex: `/poker/`)

**Correção Recomendada:**
```php
// Garantir que BASE_URL está definido
if (!defined('BASE_URL')) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    define('BASE_URL', $protocol . '://' . $host);
}

// Considerar subdiretório se houver
$basePath = '/poker'; // ou detectar: dirname(dirname($_SERVER['SCRIPT_NAME']));
$accept_url = BASE_URL . $basePath . "/accept-invite?token=" . $token;
```

**Severidade:** 🟡 MÉDIA (funciona em prod, mas pode quebrar em outros ambientes)

---

### 6️⃣ PROBLEMA: Path Fixo no .htaccess

**Arquivo:** `.htaccess`  
**Linha:** 6  
**Código Problemático:**
```apache
RewriteBase /poker/
```

**Problema:**
- Path `/poker/` está hardcoded
- Só funciona se o app estiver exatamente em `/poker/`
- Não funciona em desenvolvimento local na raiz
- Não funciona se deployado em outro subdiretório

**Correção Recomendada:**
```apache
# Opção 1: Remover RewriteBase (deixar o Apache detectar automaticamente)
<IfModule mod_rewrite.c>
  RewriteEngine On
  # RewriteBase removido - será detectado automaticamente
  
  # ... resto das regras
</IfModule>

# Opção 2: Usar variável de ambiente
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Detectar base automaticamente ou usar variável
  # Se APP_BASE_PATH estiver definido no ambiente, usar; senão usar /
  RewriteCond %{ENV:APP_BASE_PATH} !^$
  RewriteBase %{ENV:APP_BASE_PATH}
  
  # ... resto das regras
</IfModule>

# Opção 3: Comentar e documentar
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # ⚠️ CONFIGURE O CAMINHO BASE DE ACORDO COM SEU AMBIENTE:
  # Produção: /poker/
  # Dev local: /
  # Staging: /staging/
  RewriteBase /poker/
  
  # ... resto das regras
</IfModule>
```

**Severidade:** 🔴 CRÍTICA (impede uso em outros ambientes)

---

### 7️⃣ PROBLEMA: Server Directory Fixo no GitHub Actions

**Arquivo:** `.github/workflows/deploy-hostinger.yml`  
**Linha:** 104  
**Código Problemático:**
```yaml
server-dir: /poker/
```

**Problema:**
- Path `/poker/` está hardcoded no workflow
- Só funciona para este deploy específico
- Se precisar deployar em outro diretório, precisa editar o workflow
- Não é reutilizável para outros projetos ou ambientes

**Correção Recomendada:**
```yaml
# Usar variável de ambiente do GitHub Secrets
- name: 🚀 Deploy para Hostinger via FTP
  uses: SamKirkland/FTP-Deploy-Action@v4.3.4
  with:
    server: ${{ secrets.HOSTINGER_FTP_HOST }}
    username: ${{ secrets.HOSTINGER_FTP_USER }}
    password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
    port: 21
    protocol: ftp
    local-dir: ./dist/
    # Usar variável configurável ao invés de hardcode
    server-dir: ${{ secrets.HOSTINGER_DEPLOY_PATH || '/poker/' }}
    # ...resto da configuração
```

**E adicionar novo secret no GitHub:**
- Nome: `HOSTINGER_DEPLOY_PATH`
- Valor: `/poker/` (ou qualquer outro path desejado)

**Severidade:** 🟡 MÉDIA (funciona, mas não é flexível)

---

### 8️⃣ PROBLEMA: URLs Fixas em accept_invite.php

**Arquivo:** `api/accept_invite.php`  
**Linha:** 416  
**Código Problemático:**
```php
<a href="/login" class="btn">🚀 Fazer Login</a>
```

**Problema:**
- Link hardcoded `/login` assume que está na raiz
- Não funciona se o app estiver em subdiretório (ex: `/poker/login`)

**Correção Recomendada:**
```php
<?php
// No início do arquivo, após o require_once
$basePath = dirname(dirname($_SERVER['SCRIPT_NAME'])); // Ex: /poker
if ($basePath === '/') $basePath = ''; // Se estiver na raiz, deixar vazio
?>

<!-- Na linha 416 -->
<a href="<?php echo $basePath; ?>/login" class="btn">🚀 Fazer Login</a>
```

**Severidade:** 🟡 MÉDIA (funciona em prod, mas quebra em outros contextos)

---

## 📊 RESUMO DOS PROBLEMAS

### Por Severidade:
- 🔴 **CRÍTICA** (1): `.htaccess` - RewriteBase hardcoded
- 🟠 **ALTA** (3): BASE_URL, pdf_generator paths, register.php URLs
- 🟡 **MÉDIA** (4): email logs, invite.php, workflow, accept_invite.php

### Por Tipo:
- **URLs Hardcoded** (4): email_config.php, register.php, invite.php, accept_invite.php
- **Paths de Diretório** (3): pdf_generator.php, email_config.php, workflow
- **Configuração Apache** (1): .htaccess

### Por Arquivo:
1. `api/email_config.php` - 2 problemas (BASE_URL + logs)
2. `api/pdf_generator.php` - 3 problemas (temp_pdfs paths)
3. `api/register.php` - 1 problema (approval URLs)
4. `api/invite.php` - 1 problema (accept_url)
5. `api/accept_invite.php` - 1 problema (login link)
6. `.htaccess` - 1 problema (RewriteBase)
7. `.github/workflows/deploy-hostinger.yml` - 1 problema (server-dir)

---

## ✅ RECOMENDAÇÕES GERAIS

### 1. Criar arquivo de configuração centralizado
```php
// api/app_config.php
<?php
// Detectar ambiente
$isProduction = ($_ENV['APP_ENV'] ?? 'production') === 'production';

// Detectar protocolo e host
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

// Detectar base path
$scriptPath = $_SERVER['SCRIPT_NAME'] ?? '';
$basePath = dirname(dirname($scriptPath)); // Sobe 2 níveis de /api/script.php
if ($basePath === '/' || $basePath === '\\') $basePath = '';

// Configurações globais
define('APP_BASE_URL', $_ENV['BASE_URL'] ?? ($protocol . '://' . $host . $basePath));
define('APP_BASE_PATH', $basePath);
define('APP_TEMP_DIR', $_ENV['TEMP_DIR'] ?? sys_get_temp_dir() . '/poker_app');
define('APP_ENV', $_ENV['APP_ENV'] ?? 'production');

// Criar diretório temporário se não existir
if (!is_dir(APP_TEMP_DIR)) {
    mkdir(APP_TEMP_DIR, 0755, true);
}
?>
```

### 2. Incluir app_config.php em todos os arquivos
```php
require_once __DIR__ . '/app_config.php';
```

### 3. Usar variáveis de ambiente para configurações
Adicionar ao `.env`:
```env
BASE_URL=https://poker.luisfboff.com
APP_BASE_PATH=/poker
APP_ENV=production
TEMP_DIR=/tmp/poker_app
```

### 4. Documentar ambientes no README
```markdown
## Configuração de Ambientes

### Desenvolvimento Local
- BASE_URL: http://localhost
- APP_BASE_PATH: / (raiz)

### Produção Hostinger
- BASE_URL: https://poker.luisfboff.com
- APP_BASE_PATH: /poker

### Staging
- BASE_URL: https://staging.poker.luisfboff.com
- APP_BASE_PATH: /staging
```

---

## 🎯 PRIORIDADE DE CORREÇÃO

### 1️⃣ **URGENTE** (Corrigir primeiro):
- `.htaccess` - RewriteBase (bloqueia uso em dev)
- `api/email_config.php` - BASE_URL (quebra em dev)

### 2️⃣ **IMPORTANTE** (Corrigir em seguida):
- `api/pdf_generator.php` - Paths de temp_pdfs
- `api/register.php` - URLs de aprovação

### 3️⃣ **DESEJÁVEL** (Melhorias):
- `api/invite.php` - accept_url
- `api/accept_invite.php` - login link
- `.github/workflows/deploy-hostinger.yml` - server-dir configurável

---

## 📝 NOTAS FINAIS

### Arquivos que JÁ estão CORRETOS ✅:
A maioria dos arquivos PHP já usa `require_once` com caminhos relativos ou `__DIR__` corretamente. Isso é **excelente**!

### Boa Prática Identificada:
```php
require_once __DIR__ . '/../jwt_helper.php';  // ✅ Perfeito!
```

### O que precisa ser evitado:
```php
require_once '/var/www/html/api/config.php';  // ❌ Caminho absoluto
require_once 'C:\xampp\htdocs\api\config.php'; // ❌ Caminho absoluto Windows
define('BASE_URL', 'https://poker.luisfboff.com'); // ❌ URL hardcoded
```

---

**Data do Relatório:** <?php echo date('Y-m-d H:i:s'); ?>  
**Versão:** 1.0  
**Autor:** Análise Automatizada de Código
