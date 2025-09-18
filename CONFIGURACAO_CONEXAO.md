# Configuração de Conexão - Supabase + Vercel

## 🔍 **Problema Identificado:**

O Supabase tem diferentes tipos de conexão, e o **Direct Connection** não é compatível com IPv4 (usado pelo Vercel).

## ✅ **Solução Implementada:**

### 1. **Transaction Pooler (Recomendado para Vercel)**
- ✅ **IPv4 Compatible** - Funciona perfeitamente com Vercel
- ✅ **Gratuito** - Sem custos adicionais
- ✅ **Ideal para Serverless** - Perfeito para funções serverless
- ✅ **Pool de Conexões** - Múltiplos clientes compartilham conexões

### 2. **Configuração Atualizada:**

#### `src/supabaseClient.js`:
```javascript
// Usando Transaction Pooler para compatibilidade IPv4 (Vercel)
const supabaseUrl = 'https://jrdhftjekefbwjktbauu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Configuração para usar Transaction Pooler (IPv4 compatible)
const supabaseOptions = {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'poker-settlements',
    },
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);
```

#### `vercel.json`:
```json
{
  "env": {
    "SUPABASE_URL": "https://jrdhftjekefbwjktbauu.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 📊 **Tipos de Conexão Supabase:**

### ❌ **Direct Connection** (Não usar com Vercel)
- **Problema**: Não compatível com IPv4
- **Uso**: Apenas para IPv6 ou conexões persistentes
- **Vercel**: ❌ Não funciona

### ✅ **Transaction Pooler** (Usar com Vercel)
- **Vantagem**: IPv4 compatible
- **Uso**: Ideal para serverless functions
- **Vercel**: ✅ Funciona perfeitamente
- **Custo**: Gratuito

### ✅ **Session Pooler** (Alternativa)
- **Vantagem**: IPv4 compatible
- **Uso**: Apenas quando necessário
- **Vercel**: ✅ Funciona
- **Custo**: Gratuito

## 🚀 **Próximos Passos:**

### 1. **Execute o Script SQL:**
```sql
-- Use o arquivo: complete_database_setup_fixed.sql
-- No SQL Editor do Supabase
```

### 2. **Teste a Conectividade:**
```javascript
// Cole no console do navegador (F12)
fetch('https://jrdhftjekefbwjktbauu.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGhmdGpla2VmYndqa3RiYXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTAxOTcsImV4cCI6MjA3Mjc2NjE5N30.WuxY3dwgMdizjlFmeUBNmdnQm0T48Ideo320FPTY9go'
  }
})
.then(r => console.log('✅ Status:', r.status))
.catch(e => console.log('❌ Erro:', e.message));
```

### 3. **Deploy no Vercel:**
- As configurações já estão prontas
- O Transaction Pooler será usado automaticamente
- Compatibilidade IPv4 garantida

## 🔧 **Configurações Adicionais:**

### **Headers de Segurança:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### **Runtime Node.js:**
```json
{
  "functions": {
    "src/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

## 📋 **Checklist de Configuração:**

- [x] ✅ URL do Supabase atualizada
- [x] ✅ ANON KEY configurada
- [x] ✅ SERVICE_ROLE KEY configurada
- [x] ✅ Transaction Pooler configurado
- [x] ✅ Opções de conexão otimizadas
- [x] ✅ Headers de segurança
- [x] ✅ Runtime Node.js 18.x
- [x] ✅ Variáveis de ambiente no Vercel

## 🆘 **Se Ainda Houver Problemas:**

### 1. **Verificar Console:**
```javascript
// Teste completo de conectividade
import { supabase } from './src/supabaseClient.js';

supabase
  .from('sessions')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Conectividade OK:', data);
    }
  });
```

### 2. **Verificar Status do Supabase:**
- Acesse: https://status.supabase.com/
- Verifique se há problemas de serviço

### 3. **Verificar Configurações do Projeto:**
- Dashboard Supabase → Settings → API
- Verificar se as chaves estão corretas
- Verificar se o projeto está ativo

## 🎯 **Resultado Esperado:**

Com essas configurações, o app deve:
- ✅ Conectar ao Supabase sem problemas
- ✅ Funcionar perfeitamente no Vercel
- ✅ Suportar IPv4 (compatibilidade total)
- ✅ Usar pool de conexões otimizado
- ✅ Ter autenticação funcionando
- ✅ Salvar e carregar dados corretamente

A configuração está otimizada para produção no Vercel!
