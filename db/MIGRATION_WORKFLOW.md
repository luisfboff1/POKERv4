# 🔄 Workflow de Migrations - Poker Manager

## ⚠️ REGRA DE OURO

**SEMPRE que for mudar a estrutura do banco de dados, USE MIGRATIONS!**

Nunca execute SQL direto no Supabase Dashboard para mudanças estruturais em produção.

---

## 📋 Dados do Nosso Banco de Dados

### Configurações Supabase

```bash
# Supabase Project
Project Ref: jhodhxvvhohygijqcxbo
Project URL: https://jhodhxvvhohygijqcxbo.supabase.co
Region: South America (São Paulo) - aws-1-sa-east-1

# Database Connection
Host (Pooler): aws-1-sa-east-1.pooler.supabase.com
Port (Pooler): 6543
Port (Direct): 5432
Database: postgres
Schema Principal: poker
User: postgres.jhodhxvvhohygijqcxbo

# Tabelas Principais
- poker.tenants (Multi-tenant)
- poker.users (Usuários do sistema)
- poker.players (Jogadores de poker)
- poker.sessions (Sessões de jogo)
- poker.player_transfers (Transferências entre jogadores)
- poker.audit_logs (Logs de auditoria)
- poker.user_invites (Convites de usuários)
```

---

## 🚀 Como Usar Migrations

### Pré-requisitos

```powershell
# 1. Instalar Supabase CLI (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 2. Verificar instalação
supabase --version

# 3. Fazer login
supabase login

# 4. Linkar ao projeto (fazer apenas 1 vez)
supabase link --project-ref jhodhxvvhohygijqcxbo
```

---

## 📝 Workflow Padrão

### 1️⃣ Criar Nova Migration

```powershell
# Sintaxe: supabase migration new <nome_descritivo>
supabase migration new add_verified_column_to_users
```

Isso cria um arquivo em: `supabase/migrations/TIMESTAMP_add_verified_column_to_users.sql`

### 2️⃣ Editar a Migration

Abra o arquivo gerado e adicione seu SQL:

```sql
-- supabase/migrations/20251030143000_add_verified_column_to_users.sql

-- Adicionar coluna verified
ALTER TABLE poker.users 
ADD COLUMN verified BOOLEAN DEFAULT false NOT NULL;

-- Criar índice para performance
CREATE INDEX idx_users_verified ON poker.users(verified);

-- Adicionar comentário
COMMENT ON COLUMN poker.users.verified IS 'Indica se o email do usuário foi verificado';
```

### 3️⃣ Testar Localmente (Opcional)

```powershell
# Se tiver Supabase rodando localmente
supabase start
supabase db reset  # Aplica todas as migrations do zero
```

### 4️⃣ Aplicar em Produção

```powershell
# Aplicar todas as migrations pendentes
supabase db push --project-ref jhodhxvvhohygijqcxbo

# Ou se já estiver linkado:
supabase db push
```

### 5️⃣ Commitar no Git

```powershell
git add supabase/migrations/
git commit -m "feat: add verified column to users table"
git push origin main
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Adicionar Nova Coluna

```powershell
# 1. Criar migration
supabase migration new add_phone_to_users

# 2. Editar arquivo gerado
```

```sql
-- Adicionar coluna phone
ALTER TABLE poker.users 
ADD COLUMN phone VARCHAR(20);

-- Índice para busca
CREATE INDEX idx_users_phone ON poker.users(phone);
```

```powershell
# 3. Aplicar
supabase db push
```

### Exemplo 2: Criar Nova Tabela

```powershell
# 1. Criar migration
supabase migration new create_notifications_table

# 2. Editar arquivo
```

```sql
-- Criar tabela de notificações
CREATE TABLE poker.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES poker.users(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_notifications_user_id ON poker.notifications(user_id);
CREATE INDEX idx_notifications_tenant_id ON poker.notifications(tenant_id);
CREATE INDEX idx_notifications_is_read ON poker.notifications(is_read);

-- RLS Policy
ALTER TABLE poker.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON poker.notifications FOR SELECT
USING (
    user_id = (SELECT id FROM poker.users WHERE email = auth.jwt()->>'email')
);

-- Trigger de updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON poker.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário
COMMENT ON TABLE poker.notifications IS 'Notificações do sistema para usuários';
```

```powershell
# 3. Aplicar
supabase db push
```

### Exemplo 3: Modificar Coluna Existente

```powershell
# 1. Criar migration
supabase migration new change_email_max_length

# 2. Editar arquivo
```

```sql
-- Aumentar tamanho máximo do email
ALTER TABLE poker.users 
ALTER COLUMN email TYPE VARCHAR(320);  -- RFC 5321 standard

-- Adicionar constraint de validação
ALTER TABLE poker.users 
ADD CONSTRAINT email_format_check 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

```powershell
# 3. Aplicar
supabase db push
```

### Exemplo 4: Adicionar RLS Policy

```powershell
# 1. Criar migration
supabase migration new add_rls_policy_players_update

# 2. Editar arquivo
```

```sql
-- Criar policy para permitir que admins atualizem jogadores
CREATE POLICY "Admins can update players in their tenant"
ON poker.players FOR UPDATE
USING (
    tenant_id IN (
        SELECT tenant_id FROM poker.users 
        WHERE email = auth.jwt()->>'email' 
        AND role = 'admin'
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM poker.users 
        WHERE email = auth.jwt()->>'email' 
        AND role = 'admin'
    )
);
```

```powershell
# 3. Aplicar
supabase db push
```

---

## 🔄 Como Fazer Rollback (Reverter)

**IMPORTANTE:** Supabase Migrations não tem rollback automático!

### Opção 1: Criar Migration de Reversão

```powershell
# Se aplicou migration que adicionou coluna 'phone'
supabase migration new remove_phone_from_users
```

```sql
-- Reverter a mudança
ALTER TABLE poker.users DROP COLUMN phone;
DROP INDEX IF EXISTS idx_users_phone;
```

```powershell
supabase db push
```

### Opção 2: Restaurar Backup Completo

```powershell
# 1. Restaurar do backup
psql -h aws-1-sa-east-1.pooler.supabase.com `
     -p 6543 `
     -U postgres.jhodhxvvhohygijqcxbo `
     -d postgres `
     -f db\backups\poker_full_TIMESTAMP.sql

# 2. Recriar migrations para refletir estado atual
supabase db pull
```

---

## 📦 Comandos Úteis

```powershell
# Listar todas as migrations
supabase migration list

# Baixar schema atual do Supabase (gera migration)
supabase db pull

# Ver diff entre local e remoto
supabase db diff

# Resetar banco local (reaplica todas migrations)
supabase db reset

# Linkar a outro projeto
supabase link --project-ref OUTRO_PROJECT_REF

# Ver status da conexão
supabase status
```

---

## ✅ Checklist de Migration

Antes de aplicar uma migration em produção:

- [ ] Migration tem nome descritivo
- [ ] SQL está correto e testado
- [ ] Índices criados para colunas pesquisadas
- [ ] RLS policies ajustadas (se necessário)
- [ ] Triggers de `updated_at` adicionados (se nova tabela)
- [ ] Comentários explicativos no código SQL
- [ ] Backup recente do banco existe
- [ ] Migration commitada no Git
- [ ] Testada localmente (se possível)

---

## ⚠️ O Que NÃO Fazer

### ❌ Nunca Faça Isso:

1. **Executar SQL direto no Dashboard para mudanças estruturais**
   ```sql
   -- ❌ NÃO fazer direto no SQL Editor do Supabase
   ALTER TABLE poker.users ADD COLUMN phone VARCHAR(20);
   ```

2. **Editar migrations já aplicadas**
   ```powershell
   # ❌ NÃO editar arquivo que já foi aplicado
   # Se errou, crie uma NOVA migration para corrigir
   ```

3. **Deletar arquivos de migration**
   ```powershell
   # ❌ NÃO deletar migrations antigas
   # Elas são o histórico do banco
   ```

4. **Usar migrations para inserir dados de produção**
   ```sql
   -- ❌ NÃO usar migration para dados de usuários
   INSERT INTO poker.users (name, email) VALUES ('João', 'joao@email.com');
   
   -- ✅ Use API ou seed separado para dados de teste
   ```

---

## 🎯 Quando Usar Cada Ferramenta

| Situação | Ferramenta | Comando |
|----------|-----------|---------|
| Mudar estrutura do banco | **Migration** | `supabase migration new` |
| Backup completo | **pg_dump** | `.\backup-postgres.bat` |
| Testar SQL rápido | **SQL Editor** | Dashboard Supabase |
| Dados de seed/demo | **Seed File** | `db/sample_data.sql` |
| Ver schema atual | **Pull** | `supabase db pull` |
| Migrar para outro banco | **Backup + Restore** | `pg_dump` + `psql` |

---

## 📚 Recursos Adicionais

- [Documentação Supabase Migrations](https://supabase.com/docs/guides/cli/managing-environments#database-migrations)
- [Documentação Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🔑 Resumo

```
┌────────────────────────────────────────────────┐
│   MUDANÇA NO BANCO DE DADOS?                   │
│   ↓                                            │
│   1. supabase migration new <nome>            │
│   2. Editar arquivo .sql gerado                │
│   3. supabase db push                          │
│   4. git commit + push                         │
└────────────────────────────────────────────────┘
```

**Nunca pule esse workflow!** Suas futuras entregas e colaboradores agradecem. 🙏
