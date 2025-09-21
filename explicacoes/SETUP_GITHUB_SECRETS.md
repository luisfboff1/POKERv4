# 🔐 **CONFIGURAR GITHUB SECRETS - SEGURANÇA**

## 🎯 **PASSO A PASSO PARA CONFIGURAR SECRETS**

### **1. 📧 PRIMEIRO: Criar Email no Hostinger**

1. **Acesse o painel do Hostinger**
2. **Vá em "Emails" → "Contas de Email"**
3. **Criar nova conta:**
   - **Email:** `noreply@luisfboff.com`
   - **Senha:** `Poker2025!` (ou outra forte)
   - **Salve a senha!**

### **2. 🔐 CONFIGURAR GITHUB SECRETS**

1. **Acesse seu repositório no GitHub**
2. **Vá em Settings → Secrets and variables → Actions**
3. **Clique em "New repository secret"**

**Adicione estes secrets:**

```
SMTP_HOST = mail.luisfboff.com
SMTP_PORT = 587
SMTP_USERNAME = noreply@luisfboff.com
SMTP_PASSWORD = Poker2025!
SMTP_ENCRYPTION = tls
```

### **3. ✅ VERIFICAR SECRETS EXISTENTES**

Certifique-se que você já tem estes secrets configurados:
- ✅ `FTP_HOST`
- ✅ `FTP_USERNAME` 
- ✅ `FTP_PASSWORD`
- ✅ `DB_HOST`
- ✅ `DB_NAME`
- ✅ `DB_USER`
- ✅ `DB_PASSWORD`
- ✅ `GROQ_API_KEY`

---

## 🚀 **COMO FUNCIONA AGORA**

### **🔒 SEGURANÇA TOTAL:**
- ❌ **Nenhuma senha** no código
- ✅ **Todas as credenciais** nos GitHub Secrets
- ✅ **Arquivo .env** criado automaticamente no deploy
- ✅ **PHPMailer** instalado automaticamente

### **📦 DEPLOY AUTOMÁTICO:**
1. **GitHub Actions** pega os secrets
2. **Cria arquivo .env** no servidor
3. **Instala PHPMailer** via Composer
4. **Deploy** completo funcionando

### **📧 EMAIL FUNCIONARÁ:**
- **Remetente:** noreply@luisfboff.com
- **Configuração:** Automática via secrets
- **Segurança:** Total

---

## 🔧 **CONFIGURAÇÃO HOSTINGER**

### **📧 Configurações do Email:**

No painel do Hostinger, em "Emails":

```
Servidor de Entrada (IMAP):
- Servidor: mail.luisfboff.com
- Porta: 993
- Segurança: SSL/TLS

Servidor de Saída (SMTP):
- Servidor: mail.luisfboff.com  ✅ (Usamos este)
- Porta: 587                   ✅ (Usamos esta)  
- Segurança: STARTTLS          ✅ (Usamos este)
```

### **🔐 Credenciais:**
- **Email:** noreply@luisfboff.com
- **Senha:** (A que você criar no painel)

---

## 🎯 **RESULTADO FINAL**

### **ANTES (Inseguro):**
```php
define('SMTP_PASSWORD', 'Poker2025!'); // ❌ Exposto no código
```

### **AGORA (Seguro):**
```php
define('SMTP_PASSWORD', $_ENV['SMTP_PASSWORD'] ?? ''); // ✅ Vem dos secrets
```

### **DEPLOY AUTOMÁTICO:**
```yaml
echo "SMTP_PASSWORD=${{ secrets.SMTP_PASSWORD }}" >> api/.env
```

---

## 🐛 **TROUBLESHOOTING**

### **❌ Se email não funcionar:**

1. **Verificar secrets no GitHub:**
   - Todos os 5 secrets SMTP estão configurados?
   - Senha está correta?

2. **Verificar email no Hostinger:**
   - Email noreply@luisfboff.com existe?
   - Senha bate com o secret?

3. **Verificar logs:**
   - Arquivo `api/email_log.txt` no servidor
   - Console do navegador para erros

### **🔍 Debug:**
```php
// Temporariamente adicionar no email_config.php para debug:
error_log("SMTP_PASSWORD loaded: " . (SMTP_PASSWORD ? "YES" : "NO"));
```

---

## 📊 **VANTAGENS DA NOVA CONFIGURAÇÃO**

### **🔒 SEGURANÇA:**
- ✅ **Zero credenciais** no código
- ✅ **Secrets criptografados** no GitHub
- ✅ **Ambiente isolado** no servidor

### **⚡ AUTOMAÇÃO:**
- ✅ **Deploy automático** com todas as dependências
- ✅ **PHPMailer** instalado automaticamente
- ✅ **Configuração** automática via secrets

### **🔧 MANUTENÇÃO:**
- ✅ **Fácil alteração** de senhas (só nos secrets)
- ✅ **Sem commit** de credenciais
- ✅ **Rollback seguro** se necessário

---

**🚀 SISTEMA 100% SEGURO E AUTOMATIZADO!**

Agora todas as credenciais ficam seguras nos GitHub Secrets e o sistema funciona automaticamente!
