@echo off
REM =============================================
REM SCRIPT DE BACKUP AUTOMÁTICO - POKER MANAGER (Windows)
REM =============================================
REM Execute este script para fazer backup completo
REM do banco de dados no Windows
REM =============================================

REM Configurações (ajuste conforme necessário)
set DB_HOST=localhost
set DB_USER=root
set DB_NAME=poker_manager
set BACKUP_DIR=.\backups
set DATE=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE=%DATE: =0%

REM Criar diretório de backup se não existir
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo 🔄 Iniciando backup do banco de dados...
echo 📅 Data/Hora: %date% %time%
echo 🗄️  Banco: %DB_NAME%
echo 📁 Diretório: %BACKUP_DIR%

REM Backup completo (estrutura + dados)
echo 📦 Gerando backup completo...
mysqldump -h %DB_HOST% -u %DB_USER% -p --single-transaction --routines --triggers --events --hex-blob --add-drop-table --add-locks --create-options --extended-insert --quick --lock-tables=false %DB_NAME% > "%BACKUP_DIR%\full_backup_%DATE%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup completo criado: full_backup_%DATE%.sql
) else (
    echo ❌ Erro ao criar backup completo!
    pause
    exit /b 1
)

REM Backup apenas da estrutura
echo 🏗️  Gerando backup da estrutura...
mysqldump -h %DB_HOST% -u %DB_USER% -p --no-data --routines --triggers --events --add-drop-table %DB_NAME% > "%BACKUP_DIR%\structure_backup_%DATE%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup da estrutura criado: structure_backup_%DATE%.sql
) else (
    echo ❌ Erro ao criar backup da estrutura!
    pause
    exit /b 1
)

REM Backup apenas dos dados
echo 📊 Gerando backup dos dados...
mysqldump -h %DB_HOST% -u %DB_USER% -p --no-create-info --single-transaction --hex-blob --extended-insert --quick --lock-tables=false %DB_NAME% > "%BACKUP_DIR%\data_backup_%DATE%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup dos dados criado: data_backup_%DATE%.sql
) else (
    echo ❌ Erro ao criar backup dos dados!
    pause
    exit /b 1
)

REM Compactar backups (usando 7zip se disponível)
echo 🗜️  Compactando arquivos...
if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" a "%BACKUP_DIR%\poker_manager_backup_%DATE%.zip" "%BACKUP_DIR%\*_backup_%DATE%.sql"
    del "%BACKUP_DIR%\*_backup_%DATE%.sql"
    echo ✅ Backup compactado: poker_manager_backup_%DATE%.zip
) else (
    echo ⚠️  7-Zip não encontrado. Arquivos não compactados.
)

echo 🎉 Backup concluído com sucesso!
echo 📁 Localização: %BACKUP_DIR%\
pause