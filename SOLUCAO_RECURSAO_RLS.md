# Solução: Recursão Infinita nas Políticas RLS

## 🔍 **Problema Identificado:**

```
❌ Erro: infinite recursion detected in policy for relation "user_permissions"
📋 Código: 42P17
```

## 🚨 **Causa do Problema:**

As políticas RLS da tabela `user_permissions` estão causando recursão infinita porque:
1. A política tenta verificar se o usuário é admin
2. Para verificar se é admin, precisa consultar a tabela `user_permissions`
3. Mas para consultar `user_permissions`, precisa verificar as políticas RLS
4. Isso cria um loop infinito

## ✅ **Solução:**

### **Passo 1: Execute o Script de Correção**

Execute o arquivo `fix_rls_policies.sql` no SQL Editor do Supabase:

```sql
-- 1. Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON user_permissions;

-- 2. Criar políticas RLS mais simples e seguras
CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Admins can view all permissions" ON user_permissions
  FOR SELECT USING (
    email = 'luisfboff@hotmail.com' OR
    (auth.email() = email)
  );

CREATE POLICY "Admins can manage permissions" ON user_permissions
  FOR ALL USING (
    email = 'luisfboff@hotmail.com' OR
    (auth.email() = email)
  );
```

### **Passo 2: Teste a Conectividade**

Após executar o script, teste novamente:

```bash
node test-simple-connection.js
```

### **Passo 3: Execute o Script de Tabelas**

Depois que a recursão for resolvida, execute:

```sql
-- Use o arquivo: create_missing_tables_only.sql
```

## 🔧 **Como Executar:**

### **1. Acesse o Supabase Dashboard:**
- URL: https://supabase.com/dashboard/project/jrdhftjekefbwjktbauu
- Vá em **SQL Editor**

### **2. Execute o Script de Correção:**
- Cole o conteúdo de `fix_rls_policies.sql`
- Clique em **Run**

### **3. Execute o Script de Tabelas:**
- Cole o conteúdo de `create_missing_tables_only.sql`
- Clique em **Run**

### **4. Teste a Conectividade:**
```bash
node test-simple-connection.js
```

## 📋 **Resultado Esperado:**

Após executar os scripts, você deve ver:

```
🔍 Testando conectividade com Supabase...
✅ Cliente Supabase criado
📍 URL: https://jrdhftjekefbwjktbauu.supabase.co
🔑 Chave (primeiros 20 chars): eyJhbGciOiJIUzI1NiIs...
🔄 Testando consulta...
✅ Consulta executada com sucesso
📊 Dados: [...]
🔄 Testando autenticação...
✅ Verificação de sessão OK
👤 Usuário atual: Não logado
🎉 Teste de conectividade concluído com sucesso!

✅ Conectividade com Supabase funcionando!
```

## 🚀 **Próximos Passos:**

1. **Execute os scripts SQL** na ordem correta
2. **Teste a conectividade** com o script Node.js
3. **Faça login** no app com `luisfboff@hotmail.com`
4. **Verifique se aparece como admin**

## 🆘 **Se Ainda Houver Problemas:**

### **Verificar Políticas RLS:**
```sql
-- Ver todas as políticas da tabela user_permissions
SELECT * FROM pg_policies WHERE tablename = 'user_permissions';
```

### **Remover Todas as Políticas:**
```sql
-- Se necessário, remover todas as políticas
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON user_permissions;
```

### **Desabilitar RLS Temporariamente:**
```sql
-- Apenas para teste (NÃO usar em produção)
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
```

## 🎯 **Resumo:**

O problema é uma **recursão infinita nas políticas RLS**. A solução é:
1. ✅ Remover políticas problemáticas
2. ✅ Criar políticas mais simples
3. ✅ Testar conectividade
4. ✅ Criar tabelas restantes

Execute os scripts na ordem e o sistema funcionará!
