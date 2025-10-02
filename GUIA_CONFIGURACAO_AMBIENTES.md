# 🌍 GUIA DE CONFIGURAÇÃO MULTI-AMBIENTE

Este guia explica como configurar o sistema para funcionar em diferentes ambientes sem precisar alterar o código.

---

## 📋 VISÃO GERAL

O sistema agora possui configuração centralizada em `api/app_config.php` que detecta automaticamente:
- Protocolo (HTTP ou HTTPS)
- Host (domínio ou localhost)
- Base path (raiz ou subdiretório)

---

## 🏠 AMBIENTE: DESENVOLVIMENTO LOCAL

### Configuração
```env
# api/.env
APP_ENV=development
BASE_URL=http://localhost
APP_BASE_PATH=/
```

### Apache/Nginx
```apache
# .htaccess
RewriteBase /
# OU comentar a linha para detecção automática
# RewriteBase /poker/
```

### URLs Geradas
- API: `http://localhost/api/session.php`
- Frontend: `http://localhost/login`
- Aceitar convite: `http://localhost/accept-invite?token=...`

### Testar Configuração
```bash
# Ver configurações detectadas
curl http://localhost/api/app_config.php?debug_config
```

---

## 🚀 AMBIENTE: PRODUÇÃO HOSTINGER

### Configuração
```env
# api/.env (GitHub Secrets)
APP_ENV=production
BASE_URL=https://poker.luisfboff.com
APP_BASE_PATH=/poker
```

### Apache
```apache
# .htaccess
RewriteBase /poker/
```

### URLs Geradas
- API: `https://poker.luisfboff.com/poker/api/session.php`
- Frontend: `https://poker.luisfboff.com/poker/login`
- Aceitar convite: `https://poker.luisfboff.com/poker/accept-invite?token=...`

### GitHub Actions
```yaml
# .github/workflows/deploy-hostinger.yml
- name: 🔧 Configurar APIs PHP
  run: |
    echo "BASE_URL=https://poker.luisfboff.com" > dist/api/.env
    echo "APP_BASE_PATH=/poker" >> dist/api/.env
    echo "APP_ENV=production" >> dist/api/.env
    # ... outras variáveis
```

---

## 🧪 AMBIENTE: STAGING

### Configuração
```env
# api/.env
APP_ENV=staging
BASE_URL=https://staging.poker.luisfboff.com
APP_BASE_PATH=/staging
```

### Apache
```apache
# .htaccess
RewriteBase /staging/
```

### URLs Geradas
- API: `https://staging.poker.luisfboff.com/staging/api/session.php`
- Frontend: `https://staging.poker.luisfboff.com/staging/login`
- Aceitar convite: `https://staging.poker.luisfboff.com/staging/accept-invite?token=...`

---

## 🛠️ USANDO AS FUNÇÕES HELPERS

### app_url() - URL Completa
```php
// Gera URL completa para qualquer path
$loginUrl = app_url('login');
// Resultado: https://poker.luisfboff.com/poker/login

$apiUrl = app_url('api/session.php');
// Resultado: https://poker.luisfboff.com/poker/api/session.php

$acceptInvite = app_url('accept-invite') . '?token=' . $token;
// Resultado: https://poker.luisfboff.com/poker/accept-invite?token=abc123
```

### app_path() - Path Relativo
```php
// Gera path considerando o base path
$loginPath = app_path('login');
// Resultado: /poker/login

$apiPath = app_path('api/session.php');
// Resultado: /poker/api/session.php

// Em HTML
<a href="<?php echo app_path('login'); ?>">Login</a>
// Resultado: <a href="/poker/login">Login</a>
```

### clean_old_files() - Limpar Arquivos Antigos
```php
// Limpa arquivos com mais de 24 horas
clean_old_files(APP_PDF_DIR, 24 * 60 * 60);

// Limpa arquivos com mais de 1 hora
clean_old_files(APP_TEMP_DIR, 60 * 60);
```

### app_log() - Registrar Logs
```php
// Log de informação
app_log('Usuário fez login: ' . $email, 'info');

// Log de erro
app_log('Erro ao enviar email: ' . $error, 'error');

// Log de aviso
app_log('Limite de sessões atingido', 'warning');
```

---

## 📁 ESTRUTURA DE DIRETÓRIOS TEMPORÁRIOS

### Antiga (Problemática)
```
api/
├── temp_pdfs/        ❌ Acumula arquivos
│   ├── session_1.pdf
│   ├── session_2.pdf
│   └── ...
├── email_log.txt     ❌ Fica na pasta api/
└── ...
```

### Nova (Correta)
```
/tmp/poker_app/       ✅ Diretório temporário do sistema
├── pdfs/             ✅ PDFs temporários (limpeza automática)
│   ├── session_1.pdf
│   └── session_2.pdf
├── logs/             ✅ Logs organizados por data
│   ├── app_2025-01-10.log
│   ├── email_2025-01-10.log
│   └── ...
└── ...
```

**Benefícios:**
- ✅ Sistema operacional limpa automaticamente /tmp
- ✅ Não acumula lixo na pasta do projeto
- ✅ Limpeza automática de arquivos antigos
- ✅ Logs organizados por data

---

## 🔧 CONSTANTES DISPONÍVEIS

Após incluir `api/app_config.php`, você tem acesso a:

| Constante | Exemplo | Descrição |
|-----------|---------|-----------|
| `APP_BASE_URL` | `https://poker.luisfboff.com/poker` | URL completa base |
| `APP_BASE_PATH` | `/poker` | Path base da aplicação |
| `APP_TEMP_DIR` | `/tmp/poker_app` | Diretório temporário |
| `APP_LOG_DIR` | `/tmp/poker_app/logs` | Diretório de logs |
| `APP_PDF_DIR` | `/tmp/poker_app/pdfs` | Diretório de PDFs |
| `APP_ENV` | `production` | Ambiente atual |

---

## 🔍 DEBUG E TROUBLESHOOTING

### Ver Configurações Detectadas
```bash
# Via curl
curl https://poker.luisfboff.com/poker/api/app_config.php?debug_config

# Via browser
https://poker.luisfboff.com/poker/api/app_config.php?debug_config
```

**Resposta:**
```json
{
  "APP_BASE_URL": "https://poker.luisfboff.com/poker",
  "APP_BASE_PATH": "/poker",
  "APP_TEMP_DIR": "/tmp/poker_app",
  "APP_LOG_DIR": "/tmp/poker_app/logs",
  "APP_PDF_DIR": "/tmp/poker_app/pdfs",
  "APP_ENV": "production",
  "detected_protocol": "https",
  "detected_host": "poker.luisfboff.com",
  "detected_script_path": "/poker/api/app_config.php",
  "detected_base_path": "/poker"
}
```

### Verificar Logs
```bash
# Ver últimos logs
tail -f /tmp/poker_app/logs/app_2025-01-10.log

# Ver logs de email
tail -f /tmp/poker_app/logs/email_2025-01-10.log
```

### Problemas Comuns

**1. URLs incorretas no email**
```php
// ❌ Antes
$url = "https://" . $_SERVER['HTTP_HOST'] . "/api/approve.php";

// ✅ Depois
$url = app_url('api/approve.php');
```

**2. Arquivo .htaccess não funciona**
```apache
# Verifique se RewriteBase está correto
RewriteBase /poker/  # Para produção em subdiretório
# OU
RewriteBase /        # Para desenvolvimento local
# OU
# RewriteBase /poker/  # Comentar para detecção automática
```

**3. PDFs não são gerados**
```php
// Verificar permissões
chmod 755 /tmp/poker_app
chmod 755 /tmp/poker_app/pdfs

// Verificar se diretório existe
var_dump(is_dir(APP_PDF_DIR));
var_dump(is_writable(APP_PDF_DIR));
```

---

## ✅ CHECKLIST DE DEPLOY

### Antes de Deployar
- [ ] Verificar `api/.env` com todas as variáveis necessárias
- [ ] Verificar `BASE_URL` está correto
- [ ] Verificar `APP_BASE_PATH` está correto
- [ ] Verificar `.htaccess` RewriteBase está correto
- [ ] Testar `?debug_config` localmente

### Após Deploy
- [ ] Testar `?debug_config` em produção
- [ ] Testar envio de email (verificar URLs)
- [ ] Testar geração de PDF (verificar paths)
- [ ] Testar login/logout
- [ ] Testar convites

---

## 📚 EXEMPLOS PRÁTICOS

### Exemplo 1: Enviar Email com Link Correto
```php
require_once 'app_config.php';

// Gerar link de aceitação de convite
$token = 'abc123xyz';
$acceptUrl = app_url('accept-invite') . '?token=' . $token;

// Em produção: https://poker.luisfboff.com/poker/accept-invite?token=abc123xyz
// Em dev: http://localhost/accept-invite?token=abc123xyz
```

### Exemplo 2: Gerar PDF Temporário
```php
require_once 'app_config.php';

// Limpar PDFs antigos (mais de 24h)
clean_old_files(APP_PDF_DIR, 24 * 60 * 60);

// Gerar PDF
$fileName = 'session_' . $sessionId . '.pdf';
$filePath = APP_PDF_DIR . '/' . $fileName;
file_put_contents($filePath, $pdfContent);

// URL de download
$downloadUrl = app_path('api/download_pdf.php') . '?file=' . urlencode($fileName);
```

### Exemplo 3: Salvar Log
```php
require_once 'app_config.php';

try {
    // Código que pode falhar
    sendEmail($to, $subject, $body);
    app_log("Email enviado para: {$to}", 'info');
} catch (Exception $e) {
    app_log("Erro ao enviar email: {$e->getMessage()}", 'error');
}
```

---

## 🎯 BOAS PRÁTICAS

### ✅ FAZER
```php
// Usar helpers
$url = app_url('api/session.php');
$path = app_path('login');

// Usar constantes
$pdfFile = APP_PDF_DIR . '/report.pdf';
$logFile = APP_LOG_DIR . '/app.log';

// Limpar arquivos antigos
clean_old_files(APP_PDF_DIR, 24 * 60 * 60);

// Registrar logs
app_log('Ação realizada', 'info');
```

### ❌ NÃO FAZER
```php
// URLs hardcoded
$url = "https://poker.luisfboff.com/api/session.php";

// Paths hardcoded
$path = "/poker/login";

// Diretórios fixos na pasta do projeto
$pdfFile = __DIR__ . "/temp_pdfs/report.pdf";

// Logs na pasta do projeto
$logFile = __DIR__ . "/app.log";
```

---

## 📞 SUPORTE

Em caso de dúvidas ou problemas:

1. Verificar configuração: `?debug_config`
2. Verificar logs: `/tmp/poker_app/logs/`
3. Consultar `RELATORIO_CAMINHOS_PROBLEMAS.md`
4. Revisar este guia

---

**Última Atualização:** 2025-01-10  
**Versão:** 1.0  
**Autor:** Sistema de Configuração Dinâmica
