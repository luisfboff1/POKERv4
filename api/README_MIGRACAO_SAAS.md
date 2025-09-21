# 🚀 MIGRAÇÃO PARA SISTEMA SAAS

Este documento explica como migrar o sistema atual para a arquitetura SaaS multi-tenant.

## 📁 ARQUIVOS CRIADOS

- `setup_saas.sql` - Setup completo com todas as tabelas e funcionalidades
- `migration_existing_data.sql` - Migração segura de dados existentes  
- `test_database.sql` - Testes para verificar se tudo funcionou
- `setup.sql` - Atualizado para compatibilidade básica

## 🔄 PROCESSO DE MIGRAÇÃO

### 1. BACKUP (OBRIGATÓRIO!)
```bash
# Fazer backup completo do banco atual
mysqldump -u [seu_usuario] -p [nome_banco] > backup_antes_migracao_$(date +%Y%m%d_%H%M%S).sql
```

### 2. ESCOLHER TIPO DE MIGRAÇÃO

#### OPÇÃO A: Sistema Novo (Recomendado)
Se você quer começar do zero com a estrutura SaaS:
```sql
-- Execute no MySQL
SOURCE api/setup_saas.sql;
```

#### OPÇÃO B: Migrar Dados Existentes
Se você já tem dados no sistema atual:
```sql
-- 1. Execute primeiro o setup completo
SOURCE api/setup_saas.sql;

-- 2. Depois execute a migração dos dados
SOURCE api/migration_existing_data.sql;
```

### 3. CONFIGURAR SENHA DO ADMIN

**IMPORTANTE:** Você precisa gerar uma senha segura para o usuário admin.

#### Opção 1: Online (Rápido)
1. Acesse: https://phppasswordhash.com/
2. Digite sua senha desejada
3. Copie o hash gerado
4. Execute no MySQL:
```sql
UPDATE users 
SET password_hash = 'COLE_O_HASH_AQUI' 
WHERE email = 'luisfboff@hotmail.com';
```

#### Opção 2: Via PHP
```php
<?php
echo password_hash('sua_senha_aqui', PASSWORD_DEFAULT);
?>
```

### 4. TESTAR A MIGRAÇÃO
```sql
-- Execute os testes
SOURCE api/test_database.sql;
```

### 5. VERIFICAÇÕES IMPORTANTES

#### Verificar se as tabelas foram criadas:
```sql
SHOW TABLES;
-- Deve mostrar: tenants, users, sessions, user_sessions, audit_logs
```

#### Verificar se o tenant admin foi criado:
```sql
SELECT * FROM tenants WHERE email = 'luisfboff@hotmail.com';
```

#### Verificar se as sessões existentes foram migradas:
```sql
SELECT COUNT(*) as total_sessions FROM sessions WHERE tenant_id = 1;
```

## 🔧 ESTRUTURA CRIADA

### Tabelas Principais:
- **tenants** - Clientes/empresas do SaaS
- **users** - Usuários que fazem login
- **sessions** - Sessões de poker (agora com tenant_id)
- **user_sessions** - Controle de tokens JWT
- **audit_logs** - Log de todas as ações

### Views Úteis:
- **tenant_stats** - Estatísticas por cliente
- **tenant_sessions** - Sessões com info do tenant

### Stored Procedures:
- **ApproveTenant()** - Aprovar novos clientes
- **CheckTenantLimits()** - Verificar limites do plano

## 🚨 PROBLEMAS COMUNS

### Erro: "Column 'tenant_id' cannot be null"
**Solução:** Execute a migração de dados existentes:
```sql
UPDATE sessions SET tenant_id = 1 WHERE tenant_id IS NULL;
```

### Erro: "Foreign key constraint fails"
**Solução:** Certifique-se que o tenant admin foi criado:
```sql
INSERT IGNORE INTO tenants (id, name, email, status, plan) 
VALUES (1, 'Admin', 'luisfboff@hotmail.com', 'active', 'enterprise');
```

### Senha não funciona
**Solução:** Gere um novo hash e atualize:
```sql
UPDATE users SET password_hash = 'NOVO_HASH' WHERE email = 'luisfboff@hotmail.com';
```

## 📊 PRÓXIMOS PASSOS

Após a migração do banco estar funcionando:

1. ✅ **Banco de Dados** (ATUAL)
2. 🔄 **APIs de Autenticação** (PRÓXIMO)
3. 🔄 **Middleware de Tenant** 
4. 🔄 **Frontend com Login**
5. 🔄 **Sistema de Aprovação**
6. 🔄 **Página de Planos**

## 🆘 SUPORTE

Se algo der errado:
1. Restaure o backup: `mysql -u [usuario] -p [banco] < backup_antes_migracao_*.sql`
2. Verifique os logs de erro do MySQL
3. Execute os testes novamente para identificar o problema

---

**⚠️ LEMBRE-SE:** 
- Sempre faça backup antes de executar
- Teste em ambiente de desenvolvimento primeiro
- Gere uma senha segura para o admin
- Verifique se todas as tabelas foram criadas corretamente
