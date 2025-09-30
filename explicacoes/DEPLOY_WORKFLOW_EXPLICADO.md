# 📦 WORKFLOW DE DEPLOY - Explicado

## 🤔 **`.env.local` vs `.env.production`**

### **❌ `.env.production` (Anterior - Mais Confuso):**
```yaml
echo "NEXT_PUBLIC_API_URL=/api" > .env.production
npm run build
```
- Usado AUTOMATICAMENTE pelo Next.js em `npm run build`
- Mais "correto" tecnicamente
- Mas confunde porque não é explícito

### **✅ `.env.local` (Atual - Mais Simples):**
```yaml
echo "NEXT_PUBLIC_API_URL=/api" > .env.local
npm run build
```
- Explícito e claro
- Funciona em desenvolvimento E produção
- É o padrão que você já usa no MeguisPet
- **Escolhemos este!**

---

## 🔄 **Fluxo Completo do Deploy:**

### **1️⃣ Build Next.js (Frontend):**
```yaml
# Cria .env.local com variáveis PÚBLICAS (NEXT_PUBLIC_*)
echo "NEXT_PUBLIC_API_URL=/api" > .env.local
echo "NEXT_PUBLIC_GROQ_API_KEY=xxx" >> .env.local

# Build Next.js → Gera /dist
npm run build
```

**Resultado:** Pasta `dist/` com arquivos estáticos

---

### **2️⃣ Configurar APIs PHP (Backend):**
```yaml
# Copia pasta api/ para dist/api/
mkdir -p dist/api
cp -r api/* dist/api/

# Cria dist/api/.env com variáveis PRIVADAS
echo "DB_HOST=xxx" > dist/api/.env
echo "DB_NAME=xxx" >> dist/api/.env
echo "JWT_SECRET=xxx" >> dist/api/.env
# ... etc

# Instala dependências PHP (PHPMailer)
cd dist/api
php composer.phar install --no-dev
```

**Resultado:** Pasta `dist/api/` com PHP configurado

---

### **3️⃣ Deploy FTP (Tudo de Uma Vez):**
```yaml
# Upload de TUDO (frontend + api) para Hostinger
local-dir: ./dist/
server-dir: /poker/
```

**Resultado:**
- `/poker/` → Frontend Next.js
- `/poker/api/` → Backend PHP

---

## 📁 **Estrutura Final no Hostinger:**

```
/poker/
├── index.html                 # Next.js (gerado)
├── _next/                     # Assets Next.js
├── .htaccess                  # Configuração Apache
└── api/                       # Backend PHP
    ├── .env                   # Variáveis PRIVADAS
    ├── config.php
    ├── auth.php
    ├── session.php
    ├── jwt_helper.php
    └── vendor/                # PHPMailer (Composer)
```

---

## 🔐 **Variáveis de Ambiente:**

### **Frontend (.env.local):**
Apenas variáveis **PÚBLICAS** (ficam no JavaScript do navegador):
```bash
NEXT_PUBLIC_API_URL=/api              # ✅ Seguro (URL pública)
NEXT_PUBLIC_GROQ_API_KEY=sk-xxx       # ⚠️ Exposto (mas OK, Groq tem rate limit)
```

### **Backend (dist/api/.env):**
Variáveis **PRIVADAS** (só o PHP vê):
```bash
DB_HOST=srv1234.hstgr.io              # 🔒 Privado
DB_NAME=u123456_poker                 # 🔒 Privado
DB_USER=u123456_admin                 # 🔒 Privado
DB_PASSWORD=senhasupersecreta         # 🔒 Privado
JWT_SECRET=chave-jwt-secreta          # 🔒 Privado
SMTP_PASSWORD=senha-email             # 🔒 Privado
```

---

## 🎯 **Por que Separamos Assim:**

### **✅ Segurança:**
- JWT_SECRET **NUNCA** vai para o frontend
- Senhas do banco **NUNCA** vão para JavaScript
- Apenas variáveis públicas no frontend

### **✅ Simplicidade:**
- Um único deploy FTP
- Tudo em `dist/`
- Fácil de entender

### **✅ Compatibilidade:**
- Segue padrão do MeguisPet
- Mesma lógica em ambos projetos
- Workflow familiar

---

## 📝 **Exemplo Prático:**

### **Antes (Errado):**
```yaml
# ❌ JWT_SECRET no frontend
echo "JWT_SECRET=xxx" > .env.local
npm run build
```
**Problema:** JWT_SECRET fica exposto no JavaScript!

### **Depois (Correto):**
```yaml
# ✅ JWT_SECRET APENAS no backend
echo "JWT_SECRET=xxx" > dist/api/.env
```
**Solução:** JWT_SECRET só existe no PHP!

---

## 🚀 **Como Usar:**

### **1. Configurar GitHub Secrets:**
```
HOSTINGER_FTP_HOST
HOSTINGER_FTP_USER
HOSTINGER_FTP_PASSWORD
DB_HOST
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_ENCRYPTION
GROQ_API_KEY
```

### **2. Push para Main:**
```bash
git add .
git commit -m "feat: implementar funcionalidade X"
git push origin main
```

### **3. GitHub Actions Executa Automaticamente:**
1. Instala dependências
2. Build Next.js
3. Copia APIs PHP
4. Configura variáveis
5. Deploy via FTP

### **4. Acesse:**
- Frontend: `https://luisfboff.com/poker/`
- API: `https://luisfboff.com/poker/api/`

---

## ✅ **Checklist de Deploy:**

- [x] Next.js configurado (next.config.ts)
- [x] Variáveis de ambiente separadas (públicas vs privadas)
- [x] APIs PHP copiadas para dist/
- [x] Composer install executado
- [x] .htaccess configurado
- [x] FTP deploy configurado
- [x] GitHub Secrets configurados

---

## 🎓 **Lição Aprendida:**

**`.env.local` é mais simples e direto que `.env.production`**

Mesmo sendo tecnicamente "menos correto", é:
- ✅ Mais fácil de entender
- ✅ Mais explícito
- ✅ Padrão que você já usa
- ✅ Funciona perfeitamente

**Conclusão:** Simplicidade > Purismo técnico 🎯

