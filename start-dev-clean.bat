@echo off
echo 🧹 Limpando ambiente de desenvolvimento...
echo.

echo 🔄 Parando processos Node.js existentes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul

echo.
echo 🧹 Limpando cache...
npm cache clean --force 2>nul

echo.
echo 📦 Reinstalando dependências...
npm install

echo.
echo 🚀 Iniciando servidor de desenvolvimento...
echo.
echo ✅ Ambiente limpo! Acesse: http://localhost:5173
echo.

npm run dev
