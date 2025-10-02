#!/bin/bash
# =============================================
# SCRIPT DE BACKUP AUTOMÁTICO - POKER MANAGER
# =============================================
# Execute este script para fazer backup completo
# do banco de dados
# =============================================

# Configurações (ajuste conforme necessário)
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-poker_manager}"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

echo "🔄 Iniciando backup do banco de dados..."
echo "📅 Data/Hora: $(date)"
echo "🗄️  Banco: $DB_NAME"
echo "📁 Diretório: $BACKUP_DIR"

# Backup completo (estrutura + dados)
echo "📦 Gerando backup completo..."
mysqldump -h "$DB_HOST" -u "$DB_USER" -p \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --add-drop-table \
    --add-locks \
    --create-options \
    --extended-insert \
    --quick \
    --lock-tables=false \
    "$DB_NAME" > "$BACKUP_DIR/full_backup_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup completo criado: full_backup_$DATE.sql"
else
    echo "❌ Erro ao criar backup completo!"
    exit 1
fi

# Backup apenas da estrutura
echo "🏗️  Gerando backup da estrutura..."
mysqldump -h "$DB_HOST" -u "$DB_USER" -p \
    --no-data \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    "$DB_NAME" > "$BACKUP_DIR/structure_backup_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup da estrutura criado: structure_backup_$DATE.sql"
else
    echo "❌ Erro ao criar backup da estrutura!"
    exit 1
fi

# Backup apenas dos dados
echo "📊 Gerando backup dos dados..."
mysqldump -h "$DB_HOST" -u "$DB_USER" -p \
    --no-create-info \
    --single-transaction \
    --hex-blob \
    --extended-insert \
    --quick \
    --lock-tables=false \
    "$DB_NAME" > "$BACKUP_DIR/data_backup_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup dos dados criado: data_backup_$DATE.sql"
else
    echo "❌ Erro ao criar backup dos dados!"
    exit 1
fi

# Compactar backups
echo "🗜️  Compactando arquivos..."
cd "$BACKUP_DIR"
tar -czf "poker_manager_backup_$DATE.tar.gz" *_backup_$DATE.sql
rm *_backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "✅ Backup compactado: poker_manager_backup_$DATE.tar.gz"
else
    echo "❌ Erro ao compactar backup!"
    exit 1
fi

# Limpar backups antigos (manter últimos 7 dias)
echo "🧹 Limpando backups antigos..."
find . -name "poker_manager_backup_*.tar.gz" -type f -mtime +7 -delete

# Mostrar tamanho do arquivo
FILESIZE=$(du -h "poker_manager_backup_$DATE.tar.gz" | cut -f1)
echo "📏 Tamanho do backup: $FILESIZE"

echo "🎉 Backup concluído com sucesso!"
echo "📁 Arquivo: $BACKUP_DIR/poker_manager_backup_$DATE.tar.gz"