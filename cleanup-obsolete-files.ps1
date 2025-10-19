# Script de Limpeza de Arquivos Obsoletos
# Poker Manager - Migracao PHP/Vite para Next.js

Write-Host ""
Write-Host "LIMPEZA DE ARQUIVOS OBSOLETOS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

if (!(Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script no diretorio raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Arquivos que serao removidos:" -ForegroundColor Yellow
Write-Host "  - dist/ (build antiga)" -ForegroundColor Gray
Write-Host "  - .eslintrc.cjs (duplicado)" -ForegroundColor Gray
Write-Host "  - package-lock.json (NPM nao usado)" -ForegroundColor Gray
Write-Host "  - tsconfig.tsbuildinfo (cache)" -ForegroundColor Gray

$confirm = Read-Host "`nDeseja continuar? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "`nOperacao cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host "`nIniciando limpeza..." -ForegroundColor Green

$removed = 0

# Remover dist/
if (Test-Path "dist") {
    Write-Host "`nRemovendo dist/..." -ForegroundColor Cyan
    Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  OK: dist/ removido" -ForegroundColor Green
        $removed++
    }
}

# Remover .eslintrc.cjs
if (Test-Path ".eslintrc.cjs") {
    Write-Host "`nRemovendo .eslintrc.cjs..." -ForegroundColor Cyan
    Remove-Item -Path ".eslintrc.cjs" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  OK: .eslintrc.cjs removido" -ForegroundColor Green
        $removed++
    }
}

# Remover package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "`nRemovendo package-lock.json..." -ForegroundColor Cyan
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  OK: package-lock.json removido" -ForegroundColor Green
        $removed++
    }
}

# Remover tsconfig.tsbuildinfo
if (Test-Path "tsconfig.tsbuildinfo") {
    Write-Host "`nRemovendo tsconfig.tsbuildinfo..." -ForegroundColor Cyan
    Remove-Item -Path "tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  OK: tsconfig.tsbuildinfo removido" -ForegroundColor Green
        $removed++
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "LIMPEZA CONCLUIDA!" -ForegroundColor Green
Write-Host "Arquivos removidos: $removed" -ForegroundColor White
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`nProximos passos:" -ForegroundColor Yellow
Write-Host "  1. pnpm run build" -ForegroundColor Gray
Write-Host "  2. pnpm run dev" -ForegroundColor Gray
Write-Host "  3. git add -A" -ForegroundColor Gray
Write-Host "  4. git commit -m 'chore: remove obsolete files'" -ForegroundColor Gray

Write-Host ""
