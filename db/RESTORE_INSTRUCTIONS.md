# 🚨 INSTRUÇÕES DE RESTAURAÇÃO DO BANCO DE DADOS

## O que aconteceu?

O comando `supabase db reset --linked` apagou **TODO** o banco de dados do projeto Supabase `supabase-luis` (jhodhxvvhohygijqcxbo).

## Backups Disponíveis

Você tem backup manual do schema `poker`:
- **Arquivo:** `db/backups/poker_full_20251030_174558.sql`
- **Data:** 30/10/2025 às 17:45:58
- **Conteúdo:** Schema poker completo (estrutura + dados)

## ⚠️ ATENÇÃO

Se você tinha **outros schemas/projetos** usando esse mesmo banco Supabase, eles também foram apagados e NÃO estão neste backup!

## Opções de Recuperação

### Opção 1: Verificar Backups Automáticos do Supabase (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard/project/jhodhxvvhohygijqcxbo/database/backups
2. Veja se há algum backup automático disponível
3. Se houver, use a função "Restore" do Supabase

### Opção 2: Restaurar Backup Manual (poker schema)

**Via Supabase SQL Editor:**

1. Acesse: https://supabase.com/dashboard/project/jhodhxvvhohygijqcxbo/sql/new
2. Abra o arquivo `db/backups/poker_full_20251030_174558.sql`
3. Copie o conteúdo e cole no SQL Editor
4. Execute o SQL

**⚠️ PROBLEMA:** O arquivo tem 2070 linhas e pode exceder o limite do SQL Editor.

**Solução:** Vou criar uma versão dividida em partes menores.

### Opção 3: Usar psql (Requer instalação)

```bash
# Instalar PostgreSQL client
# Baixar de: https://www.postgresql.org/download/windows/

# Depois executar:
psql "postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require" -f "db/backups/poker_full_20251030_174558.sql"
```

## Próximos Passos

1. **VERIFIQUE BACKUPS AUTOMÁTICOS PRIMEIRO** (Opção 1)
2. Se não houver, me avise para criar scripts de restauração divididos
3. Liste todos os schemas/projetos que estavam nesse banco para avaliar danos

## Prevenção Futura

1. **NUNCA use `supabase db reset --linked` em produção**
2. Configure backups automáticos no Supabase (planos pagos)
3. Sempre faça backup antes de operações destrutivas
4. Use ambientes separados (dev/staging/prod)
