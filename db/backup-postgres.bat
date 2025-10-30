@echo off
REM =============================================
REM SCRIPT DE BACKUP - PostgreSQL (Supabase)
REM Schema: poker
REM =============================================

REM Adicionar PostgreSQL ao PATH (usa versão 18 - compatível com servidor 17.6)
set PATH=C:\Program Files\PostgreSQL\18\bin;%PATH%

REM Configurações do Supabase
set DB_HOST=aws-1-sa-east-1.pooler.supabase.com
set DB_PORT=6543
set DB_NAME=postgres
set DB_USER=postgres.jhodhxvvhohygijqcxbo
set DB_SCHEMA=poker
set BACKUP_DIR=.\backups
set PGPASSWORD=affJLwPDtzPm0LYI

REM Criar timestamp para o arquivo
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Criar diretório de backup se não existir
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ========================================
echo 🔄 BACKUP DO SCHEMA POKER (PostgreSQL)
echo ========================================
echo 📅 Timestamp: %TIMESTAMP%
echo 🗄️  Schema: %DB_SCHEMA%
echo 🌐 Host: %DB_HOST%
echo 📁 Diretório: %BACKUP_DIR%
echo ========================================
echo.

REM 1. Backup COMPLETO (estrutura + dados)
echo 📦 [1/3] Gerando backup COMPLETO do schema poker...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -b -v -f "%BACKUP_DIR%\poker_full_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup completo criado: poker_full_%TIMESTAMP%.sql
) else (
    echo ❌ ERRO ao criar backup completo!
    pause
    exit /b 1
)
echo.

REM 2. Backup APENAS ESTRUTURA (tabelas, views, functions, etc)
echo 🏗️  [2/3] Gerando backup da ESTRUTURA (schema-only)...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -s -v -f "%BACKUP_DIR%\poker_structure_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup da estrutura criado: poker_structure_%TIMESTAMP%.sql
) else (
    echo ❌ ERRO ao criar backup da estrutura!
    pause
    exit /b 1
)
echo.

REM 3. Backup APENAS DADOS (sem DDL)
echo 📊 [3/3] Gerando backup dos DADOS (data-only)...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -n %DB_SCHEMA% -F p -a -v -f "%BACKUP_DIR%\poker_data_%TIMESTAMP%.sql"

if %errorlevel% equ 0 (
    echo ✅ Backup dos dados criado: poker_data_%TIMESTAMP%.sql
) else (
    echo ❌ ERRO ao criar backup dos dados!
    pause
    exit /b 1
)
echo.

echo ========================================
echo 🎉 BACKUP CONCLUÍDO COM SUCESSO!
echo ========================================
echo 📁 Localização: %BACKUP_DIR%\
echo 📦 Arquivos gerados:
echo    - poker_full_%TIMESTAMP%.sql (completo)
echo    - poker_structure_%TIMESTAMP%.sql (estrutura)
echo    - poker_data_%TIMESTAMP%.sql (dados)
echo ========================================
pause
