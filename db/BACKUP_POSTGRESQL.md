# 🔧 Como Fazer Backup do Schema `poker` (PostgreSQL/Supabase)

## 📋 Pré-requisitos

### 1. Instalar PostgreSQL Client Tools
Você precisa ter o `pg_dump` instalado. Baixe em:
- **Windows**: https://www.postgresql.org/download/windows/
- Instale apenas o "Command Line Tools" se não quiser o servidor completo

### 2. Verificar instalação
```powershell
pg_dump --version
```
Deve retornar algo como: `pg_dump (PostgreSQL) 15.x`

---

## 🔐 Configurar Credenciais do Supabase

### Opção 1: Editar o script manualmente

Edite o arquivo `backup-postgres.bat` e ajuste:

```bat
set DB_HOST=aws-0-sa-east-1.pooler.supabase.com
set DB_PORT=6543
set DB_NAME=postgres
set DB_USER=postgres.YOUR_PROJECT_REF
```

**Onde encontrar essas informações:**
1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database
2. Em "Connection string" → "Connection pooling" (modo Transaction)
3. Copie as informações:
   - **Host**: `aws-0-sa-east-1.pooler.supabase.com` (ou sua região)
   - **Port**: `6543` (pooler) ou `5432` (direto)
   - **User**: `postgres.xxxxxxxxxxxxxx` (seu project ref)
   - **Database**: `postgres`

### Opção 2: Usar variável de ambiente para senha

Para evitar digitar a senha toda vez, crie uma variável de ambiente:

```powershell
$env:PGPASSWORD = "sua_senha_do_supabase"
```

Ou crie um arquivo `.pgpass` (Linux/Mac) ou `pgpass.conf` (Windows) em:
- **Windows**: `%APPDATA%\postgresql\pgpass.conf`
- **Formato**: `hostname:port:database:username:password`
- **Exemplo**: `aws-0-sa-east-1.pooler.supabase.com:6543:postgres:postgres.abcdefgh:sua_senha`

---

## 🚀 Como Executar o Backup

### Método 1: Executar o script completo

```powershell
cd db
.\backup-postgres.bat
```

Isso criará 3 arquivos em `db/backups/`:
- ✅ `poker_full_YYYYMMDD_HHMMSS.sql` - Backup completo
- ✅ `poker_structure_YYYYMMDD_HHMMSS.sql` - Apenas estrutura (DDL)
- ✅ `poker_data_YYYYMMDD_HHMMSS.sql` - Apenas dados (INSERT)

### Método 2: Comando manual (sem script)

```powershell
# Backup completo do schema poker
pg_dump -h aws-0-sa-east-1.pooler.supabase.com `
        -p 6543 `
        -U postgres.xxxxxx `
        -d postgres `
        -n poker `
        -F p `
        -f poker_backup.sql

# Será solicitada a senha do Supabase
```

### Método 3: Backup direto (sem pooler)

Se o pooler der erro, use a conexão direta (porta 5432):

```powershell
pg_dump -h db.xxxxxxxxxxxxxx.supabase.co `
        -p 5432 `
        -U postgres `
        -d postgres `
        -n poker `
        -F p `
        -f poker_backup.sql
```

---

## 📦 Opções do pg_dump Explicadas

| Opção | Descrição |
|-------|-----------|
| `-h HOST` | Hostname do servidor PostgreSQL |
| `-p PORT` | Porta (6543 pooler ou 5432 direto) |
| `-U USER` | Usuário do banco |
| `-d DATABASE` | Nome do database (sempre `postgres` no Supabase) |
| `-n SCHEMA` | Nome do schema (`poker`) |
| `-F p` | Formato plain text (SQL) |
| `-F c` | Formato custom (binário, mais rápido) |
| `-s` | Apenas estrutura (--schema-only) |
| `-a` | Apenas dados (--data-only) |
| `-b` | Incluir large objects |
| `-v` | Verbose (mostra progresso) |
| `-f FILE` | Arquivo de saída |

---

## 🔄 Como Restaurar um Backup

### Restaurar backup completo:
```powershell
psql -h aws-0-sa-east-1.pooler.supabase.com `
     -p 6543 `
     -U postgres.xxxxxx `
     -d postgres `
     -f db/backups/poker_full_20251030_143000.sql
```

### Restaurar apenas estrutura:
```powershell
psql -h HOST -p PORT -U USER -d postgres -f poker_structure_*.sql
```

### Restaurar apenas dados:
```powershell
psql -h HOST -p PORT -U USER -d postgres -f poker_data_*.sql
```

---

## ⚠️ Troubleshooting

### Erro: "pg_dump: command not found"
- **Solução**: Instale PostgreSQL Client Tools ou adicione ao PATH
- **Windows PATH**: `C:\Program Files\PostgreSQL\15\bin`

### Erro: "password authentication failed"
- **Solução**: Verifique a senha do Supabase em Settings → Database

### Erro: "could not translate host name"
- **Solução**: Verifique o hostname correto do Supabase (varia por região)

### Erro: "connection pooler timeout"
- **Solução**: Use conexão direta (porta 5432) em vez do pooler (6543)

---

## 📌 Dicas Importantes

1. **Backup Regular**: Agende backups semanais ou antes de mudanças grandes
2. **Versionamento**: Os arquivos incluem timestamp automático
3. **Compressão**: Para economizar espaço, use `-F c` (formato custom)
4. **Segurança**: Nunca commite backups com dados reais no Git
5. **Testes**: Sempre teste a restauração em ambiente de dev

---

## 🎯 Exemplo Prático Completo

```powershell
# 1. Navegar até o diretório do projeto
cd C:\Users\Luisf\OneDrive\Github\Poker-Novo\db

# 2. Definir senha como variável (evita digitar toda vez)
$env:PGPASSWORD = "sua_senha_supabase"

# 3. Executar backup
pg_dump -h aws-0-sa-east-1.pooler.supabase.com `
        -p 6543 `
        -U postgres.sua_ref `
        -d postgres `
        -n poker `
        -F p `
        -b `
        -v `
        -f "backups\poker_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# 4. Verificar arquivo criado
ls backups\
```

---

## 📚 Recursos Adicionais

- [Documentação pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase Database Settings](https://supabase.com/dashboard/project/_/settings/database)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
