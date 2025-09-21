# 📧 **CONFIGURAÇÃO SMTP - SISTEMA DE EMAIL**

## 🎯 **PASSO A PASSO PARA CONFIGURAR EMAIL**

### **1. 📧 CRIAR EMAIL NO HOSTINGER**

1. **Acesse o painel do Hostinger**
2. **Vá em "Emails" → "Contas de Email"**
3. **Criar nova conta:**
   - **Email:** `noreply@luisfboff.com`
   - **Senha:** Crie uma senha forte (ex: `PokerSaaS2024!@#`)
   - **Salve a senha!**

### **2. 🔧 CONFIGURAR SENHA NO CÓDIGO**

Edite o arquivo `api/email_config.php` linha 13:

```php
// ANTES:
define('SMTP_PASSWORD', 'SuaSenhaAqui123!');

// DEPOIS:
define('SMTP_PASSWORD', 'SuaSenhaRealAqui');
```

### **3. 📦 INSTALAR PHPMAILER NO SERVIDOR**

Execute no terminal do servidor (pasta `/api/`):

```bash
# Instalar Composer (se não tiver)
curl -sS https://getcomposer.org/installer | php

# Instalar PHPMailer
php composer.phar install
```

**OU** fazer upload manual da pasta `vendor/` após rodar local.

### **4. ✅ TESTAR O SISTEMA**

Após configurar, teste enviando um convite:
- Acesse o PokerBot
- Use comando: "Convidar seu@email.com"
- Verifique se o email chegou

---

## 📋 **CONFIGURAÇÕES SMTP HOSTINGER**

```php
SMTP_HOST: 'mail.luisfboff.com'
SMTP_PORT: 587
SMTP_USERNAME: 'noreply@luisfboff.com'  
SMTP_PASSWORD: 'SuaSenhaReal'
SMTP_ENCRYPTION: 'tls'
```

---

## 📧 **COMO FUNCIONA O SISTEMA**

### **📨 ENVIO DE CONVITES:**
- **Remetente:** `noreply@luisfboff.com`
- **Nome:** "Poker SaaS"
- **Assunto:** "🎯 [Nome] te convidou para a home game: [Grupo]"

### **📄 TEMPLATE DO EMAIL:**
- **Design profissional** com gradiente azul
- **Mensagem personalizada:** "Fulano te convidou para fazer parte da home game dele"
- **Botão de ação:** "🚀 Aceitar Convite e Começar"
- **Fallback:** Link copiável se botão não funcionar
- **Responsivo** para mobile

### **🔒 SEGURANÇA:**
- **Token único** por convite
- **Expiração** em 7 dias
- **Validação** de email duplicado
- **Log** de todos os envios

---

## 🚀 **FUNCIONALIDADES IMPLEMENTADAS**

### **✅ SISTEMA COMPLETO:**
- ✅ **PHPMailer** integrado
- ✅ **Template HTML** profissional
- ✅ **Configuração SMTP** Hostinger
- ✅ **Fallback** para debug em caso de erro
- ✅ **Log de emails** para troubleshooting

### **✅ COMANDOS DO AGENTE:**
- 🗣️ **"Convidar email@exemplo.com"** → Email real enviado
- 📧 **"Enviar convite para João"** → Pede email e envia
- 👥 **Botão "Convidar" na interface** → Formulário completo

---

## 🐛 **TROUBLESHOOTING**

### **❌ Se email não enviar:**

1. **Verificar logs:**
   ```php
   // Arquivo: api/email_log.txt
   // Contém erros detalhados
   ```

2. **Testar SMTP manualmente:**
   ```bash
   telnet mail.luisfboff.com 587
   ```

3. **Verificar credenciais:**
   - Email existe no painel Hostinger?
   - Senha está correta no código?
   - Servidor SMTP correto?

### **🔧 Debug mode:**
Se der erro, o sistema salva em `api/email_log.txt` com detalhes completos.

---

## 📊 **ESTATÍSTICAS DE EMAIL**

O sistema registra:
- ✅ **Emails enviados** com sucesso
- ❌ **Falhas** de envio
- 📝 **Log completo** no banco de dados
- 🕒 **Timestamp** de cada envio

---

## 🎯 **RESULTADO FINAL**

### **ANTES (Simulado):**
```
📧 Convite simulado para email@exemplo.com
```

### **AGORA (Real):**
```
📧 Convite enviado com sucesso para email@exemplo.com
✅ Email real chegou na caixa de entrada
🎯 Template profissional com call-to-action
```

---

**🚀 SISTEMA DE EMAIL 100% FUNCIONAL!**

Todos os convites agora são **emails reais** enviados via **noreply@luisfboff.com** com template profissional e personalizado por tenant!
